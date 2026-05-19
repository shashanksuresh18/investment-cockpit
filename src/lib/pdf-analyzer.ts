import Anthropic from '@anthropic-ai/sdk';
import type { ApiResult, IRDocument, PDFExtract } from '@/lib/types';

const client = new Anthropic();

const MAX_PDF_BYTES = 32 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

type FinancialExtractionResult = {
  revenue: number | null;
  ebitda: number | null;
  netIncome: number | null;
  keyMetrics: Record<string, string>;
  rawSummary: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function tryParseJson(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1]! : text;
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,$%\s]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseExtractionResult(text: string): FinancialExtractionResult {
  const parsed = tryParseJson(text);

  if (isRecord(parsed)) {
    const metricsRaw = parsed['keyMetrics'];
    const keyMetrics: Record<string, string> = {};

    if (isRecord(metricsRaw)) {
      for (const [k, v] of Object.entries(metricsRaw)) {
        keyMetrics[k] = String(v);
      }
    }

    return {
      revenue: normalizeNumber(parsed['revenue']),
      ebitda: normalizeNumber(parsed['ebitda']),
      netIncome: normalizeNumber(parsed['netIncome']),
      keyMetrics,
      rawSummary:
        typeof parsed['rawSummary'] === 'string'
          ? parsed['rawSummary']
          : text.slice(0, 800),
    };
  }

  return {
    revenue: null,
    ebitda: null,
    netIncome: null,
    keyMetrics: {},
    rawSummary: text.slice(0, 800),
  };
}

async function fetchPdfBytes(url: string): Promise<ApiResult<Uint8Array>> {
  let response: Response;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
  } catch (error: unknown) {
    return { success: false, error: `Fetch failed: ${String(error)}` };
  }

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) {
    return { success: false, error: `URL is not a PDF (content-type: ${contentType})` };
  }

  try {
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_PDF_BYTES) {
      return {
        success: false,
        error: `PDF too large: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB > 32MB limit`,
      };
    }

    return { success: true, data: new Uint8Array(buffer) };
  } catch (error: unknown) {
    return { success: false, error: `Buffer read failed: ${String(error)}` };
  }
}

async function uploadAndAnalyzePdf(
  pdfBytes: Uint8Array,
  title: string
): Promise<ApiResult<FinancialExtractionResult>> {
  try {
    const b64 = Buffer.from(pdfBytes).toString('base64');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: b64,
              },
            },
            {
              type: 'text',
              text: `Extract key financial data from this document titled "${title}".
Return a JSON object with these exact fields:
{
  "revenue": <number in millions, null if not found>,
  "ebitda": <number in millions, null if not found>,
  "netIncome": <number in millions, null if not found>,
  "keyMetrics": {
    "<metric name>": "<value with units>",
    ...up to 10 most important metrics...
  },
  "rawSummary": "<2-3 sentence summary of the document's key financial findings>"
}

Only include numbers you see explicitly stated. Do not estimate or interpolate. Return only the JSON object.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content?.type !== 'text') {
      return { success: false, error: 'Claude returned non-text response' };
    }

    return { success: true, data: parseExtractionResult(content.text) };
  } catch (error: unknown) {
    return { success: false, error: `Claude API error: ${String(error)}` };
  }
}

export async function analyzePdf(doc: IRDocument): Promise<ApiResult<PDFExtract>> {
  if (!doc.url.toLowerCase().endsWith('.pdf') && !doc.url.toLowerCase().includes('.pdf')) {
    return { success: false, error: `Not a PDF URL: ${doc.url}` };
  }

  const fetchResult = await fetchPdfBytes(doc.url);

  if (!fetchResult.success) {
    console.error('[pdf-analyzer] fetch failed', { url: doc.url, error: fetchResult.error });
    return fetchResult;
  }

  const analysisResult = await uploadAndAnalyzePdf(fetchResult.data, doc.title);

  if (!analysisResult.success) {
    console.error('[pdf-analyzer] analysis failed', {
      url: doc.url,
      error: analysisResult.error,
    });
    return analysisResult;
  }

  const extract: PDFExtract = {
    url: doc.url,
    title: doc.title,
    extractedAt: new Date().toISOString(),
    revenue: analysisResult.data.revenue,
    ebitda: analysisResult.data.ebitda,
    netIncome: analysisResult.data.netIncome,
    keyMetrics: analysisResult.data.keyMetrics,
    rawSummary: analysisResult.data.rawSummary,
  };

  return { success: true, data: extract };
}

export async function analyzeIRDocuments(
  docs: readonly IRDocument[],
  maxPdfs: number = 2
): Promise<readonly PDFExtract[]> {
  const pdfDocs = docs
    .filter(
      (d) =>
        d.url.toLowerCase().endsWith('.pdf') ||
        d.url.toLowerCase().includes('.pdf')
    )
    .slice(0, maxPdfs);

  if (pdfDocs.length === 0) return [];

  const results = await Promise.allSettled(pdfDocs.map((d) => analyzePdf(d)));

  return results
    .map((r) => (r.status === 'fulfilled' && r.value.success ? r.value.data : null))
    .filter((r): r is PDFExtract => r !== null);
}
