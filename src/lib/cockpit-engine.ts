import { fetchFmpData } from '@/lib/datasources/fmp';
import { fetchFinnhubData } from '@/lib/datasources/finnhub';
import { fetchSecEdgarData } from '@/lib/datasources/sec-edgar';
import { fetchCompaniesHouseData } from '@/lib/datasources/companies-house';
import { fetchGleifData } from '@/lib/datasources/gleif';
import { fetchExaDeepData } from '@/lib/datasources/exa-deep';
import { findIRDocuments } from '@/lib/ir-documents';
import { analyzeIRDocuments } from '@/lib/pdf-analyzer';
import { deriveDataConfidenceClass } from '@/lib/confidence';
import type {
  CockpitData,
  FmpData,
  FinnhubData,
  SecEdgarData,
  CompaniesHouseData,
  GleifData,
  ExaDeepData,
  IRDocument,
  PDFExtract,
  DataConfidenceClass,
} from '@/lib/types';

type WaterfallResult = {
  fmp: FmpData | null;
  finnhub: FinnhubData | null;
  sec: SecEdgarData | null;
  companiesHouse: CompaniesHouseData | null;
  gleif: GleifData | null;
  exaDeep: ExaDeepData | null;
};

type ResolvedIdentity = {
  company: string;
  ticker: string | null;
  exchange: string | null;
  price: number | null;
  priceAsOf: string | null;
};

function resolveIdentity(
  query: string,
  result: WaterfallResult
): ResolvedIdentity {
  let ticker: string | null = null;
  let exchange: string | null = null;
  let price: number | null = null;
  let priceAsOf: string | null = null;
  let company = query;

  if (result.finnhub !== null) {
    ticker = result.finnhub.symbol;
    if (result.finnhub.companyName) {
      company = result.finnhub.companyName;
    }
    if (result.finnhub.quote !== null) {
      price = result.finnhub.quote.c;
      priceAsOf = new Date().toISOString().slice(0, 10);
    }
  }

  if (result.fmp !== null) {
    if (!ticker) ticker = result.fmp.symbol;
    if (result.fmp.companyName) company = result.fmp.companyName;
  }

  if (result.sec?.companyInfo !== null) {
    const secInfo = result.sec?.companyInfo;
    if (secInfo) {
      if (!ticker && secInfo.tickers.length > 0) ticker = secInfo.tickers[0] ?? null;
      if (!exchange && secInfo.exchanges.length > 0) exchange = secInfo.exchanges[0] ?? null;
      if (!company || company === query) company = secInfo.name;
    }
  }

  if (result.exaDeep !== null && (company === query)) {
    company = result.exaDeep.companyName;
  }

  return { company, ticker, exchange, price, priceAsOf };
}

function resolveLastCoreSourceDate(
  result: WaterfallResult,
  irDocuments: readonly IRDocument[]
): string | null {
  const dates: string[] = [];

  if (result.sec?.recentFilings[0]?.filingDate) {
    dates.push(result.sec.recentFilings[0].filingDate);
  }

  if (result.fmp?.enterpriseValues[0]?.date) {
    dates.push(result.fmp.enterpriseValues[0].date);
  }

  if (result.finnhub?.news[0]) {
    const ts = result.finnhub.news[0].datetime;
    dates.push(new Date(ts * 1000).toISOString().slice(0, 10));
  }

  if (irDocuments.length > 0) {
    const sorted = [...irDocuments]
      .map((d) => d.publicationDate)
      .filter(Boolean)
      .sort()
      .reverse();
    if (sorted[0]) dates.push(sorted[0]);
  }

  if (dates.length === 0) return null;
  return dates.sort().reverse()[0] ?? null;
}

function scoreConfidenceRaw(result: WaterfallResult): number {
  let score = 0;
  if (result.sec?.xbrlFacts !== null) score += 40;
  if (result.fmp !== null) score += 20;
  if (result.finnhub !== null) score += 15;
  if (result.companiesHouse?.profile !== null) score += 10;
  if (result.gleif?.record !== null) score += 5;
  if (result.exaDeep !== null) score += 5;
  return Math.min(100, score);
}

async function runWaterfall(query: string): Promise<WaterfallResult> {
  const [fmpResult, finnhubResult, secResult, chResult, gleifResult] =
    await Promise.allSettled([
      fetchFmpData(query),
      fetchFinnhubData(query),
      fetchSecEdgarData(query),
      fetchCompaniesHouseData(query),
      fetchGleifData(query),
    ]);

  const fmp =
    fmpResult.status === 'fulfilled' && fmpResult.value.success
      ? fmpResult.value.data
      : null;
  const finnhub =
    finnhubResult.status === 'fulfilled' && finnhubResult.value.success
      ? finnhubResult.value.data
      : null;
  const sec =
    secResult.status === 'fulfilled' && secResult.value.success
      ? secResult.value.data
      : null;
  const companiesHouse =
    chResult.status === 'fulfilled' && chResult.value.success
      ? chResult.value.data
      : null;
  const gleif =
    gleifResult.status === 'fulfilled' && gleifResult.value.success
      ? gleifResult.value.data
      : null;

  if (fmpResult.status === 'rejected') {
    console.error('[engine] fmp waterfall threw', { error: String(fmpResult.reason) });
  }
  if (finnhubResult.status === 'rejected') {
    console.error('[engine] finnhub waterfall threw', { error: String(finnhubResult.reason) });
  }
  if (secResult.status === 'rejected') {
    console.error('[engine] sec waterfall threw', { error: String(secResult.reason) });
  }
  if (chResult.status === 'rejected') {
    console.error('[engine] companies-house waterfall threw', { error: String(chResult.reason) });
  }
  if (gleifResult.status === 'rejected') {
    console.error('[engine] gleif waterfall threw', { error: String(gleifResult.reason) });
  }

  const hasStructuredData = fmp !== null || finnhub !== null || sec !== null;
  let exaDeep: ExaDeepData | null = null;

  if (!hasStructuredData) {
    const exaResult = await fetchExaDeepData(query);
    if (exaResult.success) {
      exaDeep = exaResult.data;
    } else {
      console.error('[engine] exa-deep failed', { query, error: exaResult.error });
    }
  }

  return { fmp, finnhub, sec, companiesHouse, gleif, exaDeep };
}

export async function runCockpitEngine(query: string): Promise<CockpitData> {
  const waterfall = await runWaterfall(query);

  const identity = resolveIdentity(query, waterfall);
  const rawScore = scoreConfidenceRaw(waterfall);
  const dataConfidenceClass: DataConfidenceClass = deriveDataConfidenceClass(rawScore);

  let irDocuments: readonly IRDocument[] = [];
  let pdfExtracts: readonly PDFExtract[] = [];

  try {
    const irResult = await findIRDocuments(identity.company, identity.ticker);
    if (irResult.success) {
      irDocuments = irResult.data;
      pdfExtracts = await analyzeIRDocuments(irDocuments, 2);
    } else {
      console.error('[engine] IR document discovery failed', {
        company: identity.company,
        error: irResult.error,
      });
    }
  } catch (error: unknown) {
    console.error('[engine] IR/PDF pipeline threw', { error: String(error) });
  }

  const lastCoreSourceDate = resolveLastCoreSourceDate(waterfall, irDocuments);

  return {
    company: identity.company,
    ticker: identity.ticker,
    exchange: identity.exchange,
    price: identity.price,
    priceAsOf: identity.priceAsOf,
    lastCoreSourceDate,
    fmp: waterfall.fmp,
    finnhub: waterfall.finnhub,
    sec: waterfall.sec,
    companiesHouse: waterfall.companiesHouse,
    gleif: waterfall.gleif,
    exaDeep: waterfall.exaDeep,
    irDocuments,
    pdfExtracts,
    dataConfidenceClass,
  };
}
