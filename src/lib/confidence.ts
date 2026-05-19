import type {
  CockpitData,
  DataConfidenceClass,
  ScoreItem,
} from '@/lib/types';

const MS_PER_DAY = 86_400_000;

function daysSince(isoDate: string): number {
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) return 999;
  return Math.max(0, (Date.now() - then) / MS_PER_DAY);
}

function freshnessFromDays(days: number): number {
  if (days <= 1) return 100;
  if (days <= 7) return 95;
  if (days <= 30) return 90;
  if (days <= 60) return 85;
  if (days <= 90) return 80;
  if (days <= 180) return 65;
  if (days <= 270) return 55;
  if (days <= 365) return 45;
  return Math.max(10, 40 - Math.floor((days - 365) / 30));
}

export function computeSourceFreshness(data: CockpitData): ScoreItem {
  const dates: string[] = [];

  if (data.sec?.recentFilings[0]?.filingDate) {
    dates.push(data.sec.recentFilings[0].filingDate);
  }

  if (data.finnhub?.news[0]) {
    const ts = data.finnhub.news[0].datetime;
    dates.push(new Date(ts * 1000).toISOString().slice(0, 10));
  }

  if (data.fmp?.enterpriseValues[0]?.date) {
    dates.push(data.fmp.enterpriseValues[0].date);
  }

  if (data.companiesHouse?.profile?.accounts?.last_accounts?.made_up_to) {
    dates.push(data.companiesHouse.profile.accounts.last_accounts.made_up_to);
  }

  if (data.gleif?.record?.attributes.registration.lastUpdateDate) {
    dates.push(data.gleif.record.attributes.registration.lastUpdateDate.slice(0, 10));
  }

  if (data.irDocuments.length > 0) {
    const sorted = [...data.irDocuments]
      .map((d) => d.publicationDate)
      .filter(Boolean)
      .sort()
      .reverse();
    if (sorted[0]) dates.push(sorted[0]);
  }

  if (dates.length === 0) {
    return {
      score: 30,
      detail: 'No dated sources found; freshness cannot be determined.',
    };
  }

  const mostRecent = dates.sort().reverse()[0]!;
  const days = daysSince(mostRecent);
  const score = freshnessFromDays(days);

  let detail: string;
  if (days <= 7) {
    detail = `Most recent source from ${mostRecent} (${Math.round(days)}d ago). Very fresh.`;
  } else if (days <= 90) {
    detail = `Most recent source from ${mostRecent} (${Math.round(days)}d ago). Within 90 days.`;
  } else if (days <= 365) {
    detail = `Most recent source from ${mostRecent} (${Math.round(days)}d ago). Moderately stale.`;
  } else {
    detail = `Most recent source from ${mostRecent} (${Math.round(days)}d ago). Stale — data may not reflect current state.`;
  }

  return { score, detail };
}

export function computeDataConfidence(data: CockpitData): ScoreItem {
  let score = 0;
  const reasons: string[] = [];

  if (data.sec?.xbrlFacts !== null) {
    score += 40;
    reasons.push('SEC XBRL financials parsed');
  }

  if (data.fmp !== null) {
    const fmpScore =
      (data.fmp.historicalMultiples.length > 0 ? 8 : 0) +
      (data.fmp.enterpriseValues.length > 0 ? 5 : 0) +
      (data.fmp.analystEstimates.length > 0 ? 5 : 0) +
      (data.fmp.priceTargetConsensus !== null ? 4 : 0) +
      (data.fmp.peers.length > 0 ? 3 : 0);
    score += fmpScore;
    reasons.push(`FMP: ${fmpScore}pts`);
  }

  if (data.finnhub !== null) {
    const fhScore =
      (data.finnhub.quote !== null ? 5 : 0) +
      (data.finnhub.basicFinancials !== null ? 5 : 0) +
      (data.finnhub.recommendations.length > 0 ? 3 : 0) +
      (data.finnhub.priceTarget !== null ? 2 : 0);
    score += fhScore;
    reasons.push(`Finnhub: ${fhScore}pts`);
  }

  if (data.companiesHouse?.profile !== null) {
    score += 5;
    reasons.push('Companies House profile');
  }

  if (data.gleif?.record !== null) {
    score += 3;
    reasons.push('GLEIF entity');
  }

  if (data.irDocuments.length > 0) {
    const irScore = Math.min(10, data.irDocuments.length * 3);
    score += irScore;
    reasons.push(`${data.irDocuments.length} IR doc(s)`);
  }

  if (data.pdfExtracts.length > 0) {
    const pdfScore = Math.min(8, data.pdfExtracts.length * 4);
    score += pdfScore;
    reasons.push(`${data.pdfExtracts.length} PDF extract(s)`);
  }

  if (data.exaDeep !== null) {
    score += 5;
    reasons.push('Exa deep research');
  }

  const capped = Math.min(100, score);
  const detail =
    reasons.length > 0
      ? `Sources: ${reasons.join('; ')}.`
      : 'No structured data sources available.';

  return { score: capped, detail };
}

export function computeConviction(
  dataConfidence: ScoreItem,
  sourceFreshness: ScoreItem,
  hasSecFiling: boolean,
  hasPriceTarget: boolean,
  hasAnalystRecs: boolean
): ScoreItem {
  let score = 0;
  const reasons: string[] = [];

  const dcScore = dataConfidence.score;
  score += Math.round(dcScore * 0.4);
  reasons.push(`data quality (${dcScore})`);

  const fsScore = sourceFreshness.score;
  score += Math.round(fsScore * 0.25);

  if (hasSecFiling) {
    score += 15;
    reasons.push('audited filings');
  }

  if (hasPriceTarget) {
    score += 8;
    reasons.push('analyst price targets');
  }

  if (hasAnalystRecs) {
    score += 7;
    reasons.push('analyst recommendations');
  }

  const capped = Math.min(100, Math.max(10, score));
  const label =
    capped >= 80 ? 'High conviction' : capped >= 50 ? 'Watch-grade' : 'Low conviction';

  return {
    score: capped,
    detail: `${label}. Driven by: ${reasons.join(', ')}.`,
  };
}

export function deriveDataConfidenceClass(score: number): DataConfidenceClass {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
