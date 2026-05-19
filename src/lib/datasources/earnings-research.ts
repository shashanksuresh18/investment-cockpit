import { createAnthropicClient } from '@/lib/anthropic-client';
import type {
  ApiResult,
  EarningsAnalysis,
  FinnhubData,
  FmpData,
  SecEdgarData,
  IRDocument,
  PDFExtract,
} from '@/lib/types';
import {
  REVENUE_CONCEPTS,
  NET_INCOME_CONCEPTS,
  extractLatestFact,
} from '@/lib/datasources/sec-edgar';

const client = createAnthropicClient();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

function buildEarningsContext(
  company: string,
  ticker: string | null,
  finnhub: FinnhubData | null,
  fmp: FmpData | null,
  sec: SecEdgarData | null,
  irDocuments: readonly IRDocument[],
  pdfExtracts: readonly PDFExtract[]
): string {
  const parts: string[] = [`Company: ${company}${ticker ? ` (${ticker})` : ''}`];

  // Finnhub earnings history
  if (finnhub?.earnings && finnhub.earnings.length > 0) {
    const rows = finnhub.earnings.slice(0, 4).map(
      (e) =>
        `  ${e.period}: actual=${e.actual ?? 'N/A'}, estimate=${e.estimate ?? 'N/A'}, surprise=${e.surprisePercent?.toFixed(1) ?? 'N/A'}%`
    );
    parts.push(`Finnhub EPS history (last 4Q):\n${rows.join('\n')}`);
  }

  // FMP analyst estimates
  if (fmp?.analystEstimates && fmp.analystEstimates.length > 0) {
    const rows = fmp.analystEstimates.map(
      (e) =>
        `  ${e.date}: est_rev=${e.estimatedRevenueAvg ?? 'N/A'}, est_eps=${e.estimatedEpsAvg ?? 'N/A'}`
    );
    parts.push(`FMP forward estimates:\n${rows.join('\n')}`);
  }

  // SEC XBRL latest revenue / net income
  if (sec?.xbrlFacts) {
    const rev = extractLatestFact(sec.xbrlFacts, [...REVENUE_CONCEPTS]);
    const ni = extractLatestFact(sec.xbrlFacts, [...NET_INCOME_CONCEPTS]);
    if (rev !== null) parts.push(`SEC latest annual revenue: $${(rev / 1e9).toFixed(2)}B`);
    if (ni !== null) parts.push(`SEC latest annual net income: $${(ni / 1e9).toFixed(2)}B`);
  }

  // Finnhub recent news headlines
  if (finnhub?.news && finnhub.news.length > 0) {
    const headlines = finnhub.news.slice(0, 5).map((n) => `  - ${n.headline}`);
    parts.push(`Recent news:\n${headlines.join('\n')}`);
  }

  // IR documents
  if (irDocuments.length > 0) {
    const docs = irDocuments.slice(0, 4).map(
      (d) => `  - ${d.title} (${d.documentType}, ${d.publicationDate})`
    );
    parts.push(`IR documents:\n${docs.join('\n')}`);
  }

  // PDF extracts
  for (const pdf of pdfExtracts) {
    const lines = [`PDF: ${pdf.title}`];
    if (pdf.revenue !== null) lines.push(`  revenue: $${pdf.revenue}M`);
    if (pdf.ebitda !== null) lines.push(`  ebitda: $${pdf.ebitda}M`);
    if (pdf.rawSummary) lines.push(`  summary: ${pdf.rawSummary}`);
    const metrics = Object.entries(pdf.keyMetrics)
      .slice(0, 5)
      .map(([k, v]) => `    ${k}: ${v}`);
    if (metrics.length > 0) lines.push(`  key metrics:\n${metrics.join('\n')}`);
    parts.push(lines.join('\n'));
  }

  // FMP historical multiples (last 2 periods for trend)
  if (fmp?.historicalMultiples && fmp.historicalMultiples.length > 0) {
    const rows = fmp.historicalMultiples.slice(0, 2).map(
      (m) =>
        `  ${m.date}: PE=${m.peRatio?.toFixed(1) ?? 'N/A'}x EV/EBITDA=${m.evToEbitda?.toFixed(1) ?? 'N/A'}x EV/Sales=${m.evToSales?.toFixed(1) ?? 'N/A'}x`
    );
    parts.push(`FMP historical multiples:\n${rows.join('\n')}`);
  }

  return parts.join('\n\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((i) => typeof i === 'string');
}

function parseEarningsAnalysis(text: string): EarningsAnalysis | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1]! : text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const beatMissValues = new Set(['beat', 'miss', 'in-line']);
  const guidanceValues = new Set(['raised', 'lowered', 'maintained', 'none']);

  function parseBeatMiss(v: unknown): EarningsAnalysis['revenueBeatMiss'] {
    return typeof v === 'string' && beatMissValues.has(v)
      ? (v as EarningsAnalysis['revenueBeatMiss'])
      : null;
  }

  function parseGuidance(v: unknown): EarningsAnalysis['guidanceRevision'] {
    return typeof v === 'string' && guidanceValues.has(v)
      ? (v as EarningsAnalysis['guidanceRevision'])
      : null;
  }

  function parseNullableNumber(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  const keyMetricsRaw = parsed['keyMetrics'];
  const keyMetrics: Record<string, string> = {};
  if (isRecord(keyMetricsRaw)) {
    for (const [k, v] of Object.entries(keyMetricsRaw)) {
      keyMetrics[k] = String(v);
    }
  }

  return {
    period: typeof parsed['period'] === 'string' ? parsed['period'] : 'Unknown period',
    revenueActual: parseNullableNumber(parsed['revenueActual']),
    revenueEstimate: parseNullableNumber(parsed['revenueEstimate']),
    revenueBeatMiss: parseBeatMiss(parsed['revenueBeatMiss']),
    epsActual: parseNullableNumber(parsed['epsActual']),
    epsEstimate: parseNullableNumber(parsed['epsEstimate']),
    epsBeatMiss: parseBeatMiss(parsed['epsBeatMiss']),
    keyMetrics,
    managementCommentary:
      typeof parsed['managementCommentary'] === 'string'
        ? parsed['managementCommentary']
        : '',
    analystTake:
      typeof parsed['analystTake'] === 'string' ? parsed['analystTake'] : '',
    updatedOutlook:
      typeof parsed['updatedOutlook'] === 'string' ? parsed['updatedOutlook'] : '',
    guidanceRevision: parseGuidance(parsed['guidanceRevision']),
    riskFlags: isStringArray(parsed['riskFlags']) ? parsed['riskFlags'] : [],
    sourcedFrom: isStringArray(parsed['sourcedFrom']) ? parsed['sourcedFrom'] : [],
  };
}

export async function fetchEarningsAnalysis(
  company: string,
  ticker: string | null,
  finnhub: FinnhubData | null,
  fmp: FmpData | null,
  sec: SecEdgarData | null,
  irDocuments: readonly IRDocument[],
  pdfExtracts: readonly PDFExtract[]
): Promise<ApiResult<EarningsAnalysis>> {
  const context = buildEarningsContext(
    company,
    ticker,
    finnhub,
    fmp,
    sec,
    irDocuments,
    pdfExtracts
  );

  const hasData =
    (finnhub?.earnings?.length ?? 0) > 0 ||
    (fmp?.analystEstimates?.length ?? 0) > 0 ||
    sec?.xbrlFacts !== null ||
    pdfExtracts.length > 0;

  if (!hasData) {
    return {
      success: false,
      error: 'Insufficient earnings data for analysis',
    };
  }

  const earningsPrompt = `Analyze the most recent available earnings period for ${company} using the data below. Produce a JSON object with EXACTLY these fields:

{
  "period": "<e.g. Q4 2025 or FY2024>",
  "revenueActual": <number in millions or null>,
  "revenueEstimate": <number in millions or null>,
  "revenueBeatMiss": <"beat"|"miss"|"in-line"|null>,
  "epsActual": <number or null>,
  "epsEstimate": <number or null>,
  "epsBeatMiss": <"beat"|"miss"|"in-line"|null>,
  "keyMetrics": { "<metric>": "<value with units>", ...up to 8 most important },
  "managementCommentary": "<1-2 sentences on what management emphasized>",
  "analystTake": "<1-2 sentences analyst interpretation of results quality>",
  "updatedOutlook": "<1-2 sentences on forward guidance and what it implies>",
  "guidanceRevision": <"raised"|"lowered"|"maintained"|"none"|null>,
  "riskFlags": ["<specific risk from the results>", ...up to 5],
  "sourcedFrom": ["<source tag>", ...]
}

DATA:
${context}`;

  const earningsSystem =
    'You are a senior equity research analyst. Produce structured earnings analysis. Only use numbers explicitly present in the data. Never fabricate. Return only a JSON object in ```json``` fences.';

  try {
    let responseText: string;

    if (DEEPSEEK_API_KEY) {
      // DeepSeek V3 — 10x cheaper for intermediate layers
      const dsResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: earningsSystem },
            { role: 'user', content: earningsPrompt },
          ],
          max_tokens: 4096,
        }),
      });
      if (!dsResponse.ok) {
        const errText = await dsResponse.text();
        throw new Error(`DeepSeek error ${dsResponse.status}: ${errText}`);
      }
      const dsJson = (await dsResponse.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      responseText = dsJson.choices[0]?.message?.content ?? '';
    } else {
      // Fallback to Anthropic claude-sonnet-4-6
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: earningsSystem,
        messages: [{ role: 'user', content: earningsPrompt }],
      });
      const content = response.content[0];
      if (content?.type !== 'text') {
        return { success: false, error: 'Claude returned non-text response' };
      }
      responseText = content.text;
    }

    const analysis = parseEarningsAnalysis(responseText);
    if (analysis === null) {
      return { success: false, error: 'Could not parse earnings analysis JSON' };
    }

    return { success: true, data: analysis };
  } catch (error: unknown) {
    return {
      success: false,
      error: `Earnings analysis call failed: ${String(error)}`,
    };
  }
}
