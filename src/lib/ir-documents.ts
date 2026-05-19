import Exa from 'exa-js';
import type { ApiResult, IRDocument, IRDocumentType } from '@/lib/types';

const EXA_API_KEY = process.env.EXA_API_KEY?.trim() ?? '';
const exa = EXA_API_KEY.length > 0 ? new Exa(EXA_API_KEY) : null;

const MAX_RESULTS = 8;

type ExaSearchResult = {
  readonly id: string;
  readonly url: string;
  readonly title?: string;
  readonly publishedDate?: string;
  readonly author?: string;
};

function classifyDocumentType(title: string, url: string): IRDocumentType {
  const lower = `${title} ${url}`.toLowerCase();

  if (
    lower.includes('earnings release') ||
    lower.includes('quarterly results') ||
    lower.includes('q1') ||
    lower.includes('q2') ||
    lower.includes('q3') ||
    lower.includes('q4') ||
    lower.includes('full year results') ||
    lower.includes('annual results')
  ) {
    return 'earnings-release';
  }

  if (
    lower.includes('presentation') ||
    lower.includes('investor day') ||
    lower.includes('capital markets day') ||
    lower.includes('roadshow')
  ) {
    return 'presentation';
  }

  if (
    lower.includes('press release') ||
    lower.includes('announcement') ||
    lower.includes('news release')
  ) {
    return 'press-release';
  }

  if (
    lower.includes('annual report') ||
    lower.includes('10-k') ||
    lower.includes('20-f') ||
    lower.includes('form 20') ||
    lower.includes('form 10')
  ) {
    return 'annual-report';
  }

  return 'other';
}

function isPdfOrIrUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.pdf') ||
    lower.includes('investors.') ||
    lower.includes('ir.') ||
    lower.includes('/ir/') ||
    lower.includes('investor-relations') ||
    lower.includes('investorrelations') ||
    lower.includes('results') ||
    lower.includes('earnings')
  );
}

function normalizePublicationDate(publishedDate: string | undefined): string {
  if (!publishedDate) return new Date().toISOString().slice(0, 10);

  try {
    return new Date(publishedDate).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function extractPublisher(url: string, company: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return company;
  }
}

function dedupeByUrl(docs: readonly IRDocument[]): readonly IRDocument[] {
  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (seen.has(doc.url)) return false;
    seen.add(doc.url);
    return true;
  });
}

export async function findIRDocuments(
  company: string,
  ticker: string | null
): Promise<ApiResult<readonly IRDocument[]>> {
  if (exa === null) {
    return { success: false, error: 'EXA_API_KEY not configured' };
  }

  const queries: string[] = [
    `${company} investor relations earnings results PDF`,
    `site:${company.toLowerCase().replace(/\s+/g, '')}.com investor relations`,
  ];

  if (ticker) {
    queries.push(`${ticker} earnings release press release 2024 2025`);
  }

  const allResults: ExaSearchResult[] = [];

  for (const query of queries.slice(0, 2)) {
    try {
      const result = await exa.search(query, {
        type: 'neural',
        numResults: MAX_RESULTS,
        startPublishedDate: '2023-01-01',
        useAutoprompt: true,
      });

      const items = result.results as ExaSearchResult[];
      allResults.push(...items);
    } catch (error: unknown) {
      console.error('[ir-documents] exa search failed', { query, error: String(error) });
    }
  }

  if (allResults.length === 0) {
    return { success: false, error: `No IR documents found for "${company}"` };
  }

  const docs: IRDocument[] = allResults
    .filter((r) => isPdfOrIrUrl(r.url))
    .map((r): IRDocument => ({
      title: r.title ?? `${company} IR Document`,
      url: r.url,
      publisher: extractPublisher(r.url, company),
      publicationDate: normalizePublicationDate(r.publishedDate),
      documentType: classifyDocumentType(r.title ?? '', r.url),
    }));

  const deduped = dedupeByUrl(docs);

  if (deduped.length === 0) {
    const fallback: IRDocument[] = allResults.slice(0, 3).map((r): IRDocument => ({
      title: r.title ?? `${company} Document`,
      url: r.url,
      publisher: extractPublisher(r.url, company),
      publicationDate: normalizePublicationDate(r.publishedDate),
      documentType: classifyDocumentType(r.title ?? '', r.url),
    }));
    return { success: true, data: dedupeByUrl(fallback) };
  }

  return { success: true, data: deduped.slice(0, MAX_RESULTS) };
}
