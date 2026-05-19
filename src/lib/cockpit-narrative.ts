import Anthropic from '@anthropic-ai/sdk';
import type {
  CockpitData,
  CockpitReport,
  CockpitScores,
  Verdict,
  KPIMetric,
  ThesisQuadrant,
  Scenario,
  NextCatalyst,
  CockpitSource,
  ValuationData,
  PeerComp,
  AnalystConsensus,
  ConsensusLabel,
} from '@/lib/types';
import {
  computeDataConfidence,
  computeSourceFreshness,
  computeConviction,
} from '@/lib/confidence';
import {
  REVENUE_CONCEPTS,
  NET_INCOME_CONCEPTS,
  extractLatestFact,
} from '@/lib/datasources/sec-edgar';

const client = new Anthropic();
function formatMillions(value: number | null, suffix = ''): string {
  if (value === null) return 'N/A';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}T${suffix}`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}B${suffix}`;
  return `$${value.toFixed(0)}M${suffix}`;
}

function pct(value: number | null): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function buildValuationSummary(data: CockpitData): string {
  const { finnhub, fmp } = data;
  const parts: string[] = [];

  if (finnhub?.quote) {
    const q = finnhub.quote;
    parts.push(`Price: $${q.c.toFixed(2)} (prev close $${q.pc.toFixed(2)}, chg ${q.dp?.toFixed(2) ?? 'N/A'}%)`);
  }

  if (finnhub?.basicFinancials?.metric) {
    const m = finnhub.basicFinancials.metric;
    if (m.marketCapitalization) {
      parts.push(`Market Cap: $${(m.marketCapitalization / 1000).toFixed(1)}B [Finnhub]`);
    }
    if (m['52WeekHigh'] && m['52WeekLow']) {
      parts.push(`52w: $${m['52WeekLow']} – $${m['52WeekHigh']} [Finnhub]`);
    }
    if (m.peTTM) parts.push(`P/E TTM: ${m.peTTM.toFixed(1)}x [Finnhub]`);
    if (m.evEbitdaTTM) parts.push(`EV/EBITDA TTM: ${m.evEbitdaTTM.toFixed(1)}x [Finnhub]`);
    if (m.revenueGrowthTTMYoy) {
      parts.push(`Revenue Growth YoY: ${pct(m.revenueGrowthTTMYoy)} [Finnhub]`);
    }
  }

  if (fmp?.enterpriseValues[0]) {
    const ev = fmp.enterpriseValues[0];
    if (ev.enterpriseValue) {
      parts.push(`EV: $${(ev.enterpriseValue / 1_000_000).toFixed(1)}B [FMP, ${ev.date}]`);
    }
    if (ev.marketCapitalization) {
      parts.push(`Mkt Cap: $${(ev.marketCapitalization / 1_000_000).toFixed(1)}B [FMP, ${ev.date}]`);
    }
  }

  if (fmp?.historicalMultiples[0]) {
    const m = fmp.historicalMultiples[0];
    if (m.evToEbitda) parts.push(`EV/EBITDA: ${m.evToEbitda.toFixed(1)}x [FMP, ${m.date}]`);
    if (m.evToSales) parts.push(`EV/Sales: ${m.evToSales.toFixed(1)}x [FMP, ${m.date}]`);
    if (m.peRatio) parts.push(`P/E: ${m.peRatio.toFixed(1)}x [FMP, ${m.date}]`);
  }

  if (fmp?.priceTargetConsensus) {
    const pt = fmp.priceTargetConsensus;
    if (pt.targetMedian) {
      parts.push(`Analyst Median PT: $${pt.targetMedian.toFixed(2)} [FMP]`);
    }
    if (pt.targetHigh && pt.targetLow) {
      parts.push(`PT Range: $${pt.targetLow.toFixed(2)} – $${pt.targetHigh.toFixed(2)} [FMP]`);
    }
  }

  if (finnhub?.priceTarget) {
    const pt = finnhub.priceTarget;
    if (pt.targetMedian) {
      parts.push(`Finnhub Median PT: $${pt.targetMedian.toFixed(2)} [Finnhub]`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : 'No valuation data available.';
}

function buildAnalystSummary(data: CockpitData): string {
  const recs = data.finnhub?.recommendations ?? [];
  if (recs.length === 0) return 'No analyst recommendation data available.';

  const latest = recs[0]!;
  const total = latest.buy + latest.hold + latest.sell + latest.strongBuy + latest.strongSell;
  return [
    `Period: ${latest.period} [Finnhub]`,
    `Strong Buy: ${latest.strongBuy}, Buy: ${latest.buy}, Hold: ${latest.hold}, Sell: ${latest.sell}, Strong Sell: ${latest.strongSell}`,
    `Total coverage: ${total} analysts`,
  ].join('\n');
}

function buildPeerSummary(data: CockpitData): string {
  const peers = data.fmp?.peers ?? [];
  if (peers.length === 0) return 'No peer comp data available.';

  const header = 'Ticker | Company | Mkt Cap | EV/EBITDA | P/E | Rev Growth';
  const rows = peers.map((p) => [
    p.symbol,
    p.companyName.slice(0, 25),
    p.marketCap ? `$${(p.marketCap / 1_000_000).toFixed(1)}B` : 'N/A',
    p.evToEbitda ? `${p.evToEbitda.toFixed(1)}x` : 'N/A',
    p.peRatio ? `${p.peRatio.toFixed(1)}x` : 'N/A',
    p.revenueGrowth ? pct(p.revenueGrowth) : 'N/A',
  ].join(' | '));

  return [header, ...rows].join('\n');
}

function buildSecSummary(data: CockpitData): string {
  const { sec } = data;
  if (!sec) return 'No SEC EDGAR data.';

  const parts: string[] = [];

  if (sec.companyInfo) {
    const info = sec.companyInfo;
    parts.push(`CIK: ${info.cik}, SIC: ${info.sic} (${info.sicDescription})`);
    if (info.tickers.length > 0) {
      parts.push(`Tickers: ${info.tickers.join(', ')} on ${info.exchanges.join(', ')} [SEC EDGAR]`);
    }
  }

  if (sec.xbrlFacts) {
    const revenue = extractLatestFact(sec.xbrlFacts, [...REVENUE_CONCEPTS]);
    const netIncome = extractLatestFact(sec.xbrlFacts, [...NET_INCOME_CONCEPTS]);

    if (revenue !== null) {
      parts.push(`Latest Annual Revenue: ${formatMillions(revenue / 1_000_000)} [SEC EDGAR XBRL]`);
    }
    if (netIncome !== null) {
      parts.push(`Latest Annual Net Income: ${formatMillions(netIncome / 1_000_000)} [SEC EDGAR XBRL]`);
    }
  }

  const recentForms = sec.recentFilings
    .slice(0, 5)
    .map((f) => `${f.form} (${f.filingDate})`)
    .join(', ');

  if (recentForms) parts.push(`Recent filings: ${recentForms} [SEC EDGAR]`);

  return parts.length > 0 ? parts.join('\n') : 'SEC data incomplete.';
}

function buildExaDeepSummary(data: CockpitData): string {
  const { exaDeep } = data;
  if (!exaDeep) return '';

  const parts = [
    `Overview: ${exaDeep.overview} [Exa]`,
  ];

  if (exaDeep.estimatedRevenue) parts.push(`Est. Revenue: ${exaDeep.estimatedRevenue} [Exa]`);
  if (exaDeep.lastValuation) parts.push(`Last Valuation: ${exaDeep.lastValuation} [Exa]`);
  if (exaDeep.fundingTotal) parts.push(`Total Funding: ${exaDeep.fundingTotal} [Exa]`);
  if (exaDeep.headquarters) parts.push(`HQ: ${exaDeep.headquarters} [Exa]`);
  if (exaDeep.keyInvestors.length > 0) {
    parts.push(`Key Investors: ${exaDeep.keyInvestors.join(', ')} [Exa]`);
  }
  if (exaDeep.competitors.length > 0) {
    parts.push(`Competitors: ${exaDeep.competitors.join(', ')} [Exa]`);
  }
  if (exaDeep.recentNews) parts.push(`Recent News: ${exaDeep.recentNews} [Exa]`);

  return parts.join('\n');
}

function buildIRDocSummary(data: CockpitData): string {
  if (data.irDocuments.length === 0) return 'No IR documents discovered.';

  const docLines = data.irDocuments
    .slice(0, 5)
    .map((d) => `- ${d.title} (${d.documentType}, ${d.publicationDate}) [IR Doc]`);

  const pdfLines = data.pdfExtracts.map((e) => {
    const parts = [`PDF Extract: ${e.title}`];
    if (e.revenue !== null) parts.push(`Rev: ${formatMillions(e.revenue)}M`);
    if (e.ebitda !== null) parts.push(`EBITDA: ${formatMillions(e.ebitda)}M`);
    parts.push(`— ${e.rawSummary}`);
    return parts.join(' | ') + ' [IR Doc PDF]';
  });

  return [...docLines, ...pdfLines].join('\n');
}

function buildNewsSnippet(data: CockpitData): string {
  const news = data.finnhub?.news ?? [];
  if (news.length === 0) return '';

  return news
    .slice(0, 5)
    .map((n) => `- ${n.headline} (${new Date(n.datetime * 1000).toISOString().slice(0, 10)}) [Finnhub]`)
    .join('\n');
}

function buildEarningsAnalysisSummary(data: CockpitData): string {
  const { earningsAnalysis } = data;
  if (!earningsAnalysis) return 'No pre-analyzed earnings data available.';

  const parts: string[] = [`Period: ${earningsAnalysis.period}`];

  if (earningsAnalysis.revenueBeatMiss !== null) {
    const rev = earningsAnalysis.revenueActual !== null
      ? `$${earningsAnalysis.revenueActual.toFixed(0)}M`
      : 'N/A';
    const est = earningsAnalysis.revenueEstimate !== null
      ? `$${earningsAnalysis.revenueEstimate.toFixed(0)}M`
      : 'N/A';
    parts.push(`Revenue: ${rev} vs ${est} est → ${earningsAnalysis.revenueBeatMiss.toUpperCase()} [Earnings Analysis]`);
  }

  if (earningsAnalysis.epsBeatMiss !== null) {
    const eps = earningsAnalysis.epsActual !== null
      ? `$${earningsAnalysis.epsActual.toFixed(2)}`
      : 'N/A';
    const est = earningsAnalysis.epsEstimate !== null
      ? `$${earningsAnalysis.epsEstimate.toFixed(2)}`
      : 'N/A';
    parts.push(`EPS: ${eps} vs ${est} est → ${earningsAnalysis.epsBeatMiss.toUpperCase()} [Earnings Analysis]`);
  }

  if (earningsAnalysis.guidanceRevision && earningsAnalysis.guidanceRevision !== 'none') {
    parts.push(`Guidance: ${earningsAnalysis.guidanceRevision.toUpperCase()} [Earnings Analysis]`);
  }

  const metrics = Object.entries(earningsAnalysis.keyMetrics)
    .slice(0, 6)
    .map(([k, v]) => `  ${k}: ${v}`);
  if (metrics.length > 0) {
    parts.push(`Key metrics:\n${metrics.join('\n')} [Earnings Analysis]`);
  }

  if (earningsAnalysis.managementCommentary) {
    parts.push(`Management: ${earningsAnalysis.managementCommentary}`);
  }
  if (earningsAnalysis.analystTake) {
    parts.push(`Analyst take: ${earningsAnalysis.analystTake}`);
  }
  if (earningsAnalysis.updatedOutlook) {
    parts.push(`Outlook: ${earningsAnalysis.updatedOutlook}`);
  }
  if (earningsAnalysis.riskFlags.length > 0) {
    parts.push(`Risk flags: ${earningsAnalysis.riskFlags.join('; ')}`);
  }

  return parts.join('\n');
}

function buildMarketResearchSummary(data: CockpitData): string {
  const { marketResearch } = data;
  if (!marketResearch) return 'No pre-analyzed market research available.';

  const parts: string[] = [
    `Sector: ${marketResearch.sector}`,
    `Overview: ${marketResearch.sectorOverview} [Market Research]`,
    `Competitive landscape: ${marketResearch.competitiveLandscape} [Market Research]`,
    `Positioning vs peers: ${marketResearch.positioningVsPeers} [Market Research]`,
  ];

  if (marketResearch.tradingComps.length > 0) {
    const header = 'Sector trading comps [Market Research]:';
    const rows = marketResearch.tradingComps.map(
      (c) =>
        `  ${c.ticker} (${c.name}): EV/Rev=${c.evRevenue ?? 'N/A'} EV/EBITDA=${c.evEbitda ?? 'N/A'} PE=${c.pe ?? 'N/A'} RevGrowth=${c.revenueGrowth ?? 'N/A'} — ${c.note}`
    );
    parts.push([header, ...rows].join('\n'));
  }

  if (marketResearch.thematicTailwinds.length > 0) {
    parts.push(`Tailwinds: ${marketResearch.thematicTailwinds.join('; ')} [Market Research]`);
  }
  if (marketResearch.thematicHeadwinds.length > 0) {
    parts.push(`Headwinds: ${marketResearch.thematicHeadwinds.join('; ')} [Market Research]`);
  }

  return parts.join('\n');
}

function buildFallbackFullMemo(
  data: CockpitData,
  scores: CockpitScores,
  valuation: ValuationData | null,
  analystConsensus: AnalystConsensus | null,
  peerComps: readonly PeerComp[]
): string {
  const price = data.price !== null ? `$${data.price.toFixed(2)} [Finnhub]` : 'not available';
  const verdict = data.dataConfidenceClass === 'high' ? 'Watch' : 'Avoid';
  const marketCap =
    valuation?.marketCap !== null && valuation?.marketCap !== undefined
      ? `$${(valuation.marketCap / 1_000_000_000).toFixed(1)}B [Finnhub/FMP]`
      : 'not available';
  const consensus =
    analystConsensus !== null
      ? `${analystConsensus.strongBuy + analystConsensus.buy} buy / ${analystConsensus.hold} hold / ${analystConsensus.sell + analystConsensus.strongSell} sell [Finnhub]`
      : 'not available';
  const peerLine =
    peerComps.length > 0
      ? peerComps
          .slice(0, 5)
          .map((peer) => `${peer.ticker} (${peer.companyName})`)
          .join(', ')
      : 'not available';

  return `### 1. Executive Summary / Final Call
Verdict: ${verdict}. Price is ${price}. This memo was generated from structured source data because the narrative synthesis service did not return a complete memo.

- Data confidence is ${scores.dataConfidence.score}/100: ${scores.dataConfidence.detail}
- Source freshness is ${scores.sourceFreshness.score}/100: ${scores.sourceFreshness.detail}
- Conviction is ${scores.conviction.score}/100: ${scores.conviction.detail}

### 2. What Changed This Quarter
Quarterly change analysis is not available from the structured data currently cached. Latest price/source reference: ${data.priceAsOf ?? 'not available'} / ${data.lastCoreSourceDate ?? 'not available'}.

### 3. The Real Market Debate
The core debate is whether the available public-market data is deep enough to underwrite the equity view. Analyst recommendations are available, but detailed operating drivers, guidance bridge, and peer multiples are incomplete.

### 4. Market Likes / Market Dislikes
Market likes:
- Analyst distribution: ${consensus}
- Freshness: ${scores.sourceFreshness.detail}

Market dislikes:
- Several valuation and operating metrics are not available.
- The full narrative synthesis did not complete, so qualitative detail is limited.

### 5. Key Financial Snapshot
| Metric | Value |
| --- | --- |
| Price | ${price} |
| Market cap | ${marketCap} |
| 52-week high | ${valuation?.week52High !== null && valuation?.week52High !== undefined ? `$${valuation.week52High.toFixed(2)} [Finnhub]` : 'not available'} |
| 52-week low | ${valuation?.week52Low !== null && valuation?.week52Low !== undefined ? `$${valuation.week52Low.toFixed(2)} [Finnhub]` : 'not available'} |
| EV/Revenue | ${valuation?.evRevenue !== null && valuation?.evRevenue !== undefined ? `${valuation.evRevenue.toFixed(1)}x [FMP]` : 'not available'} |
| EV/EBITDA | ${valuation?.evEbitda !== null && valuation?.evEbitda !== undefined ? `${valuation.evEbitda.toFixed(1)}x [FMP]` : 'not available'} |
| P/E | ${valuation?.pe !== null && valuation?.pe !== undefined ? `${valuation.pe.toFixed(1)}x [FMP/Finnhub]` : 'not available'} |

### 6. Credit / Unit Economics
Credit and unit economics are not available in the structured data. For a fintech analysis, key missing items are take rate, loss rate, funding cost, delinquency trends, and contribution margin.

### 7. What Is Priced In
At the current price, the market appears to be pricing a still-contested growth and profitability path. Exact implied growth/margin assumptions cannot be calculated without reliable forward revenue, EBITDA, and earnings estimates.

### 8. Bull / Base / Bear / Kill Case
Bull case: Analyst sentiment remains constructive and source freshness is high, supporting a view that the market may reward execution if operating data improves.

Base case: Maintain a Watch stance until fuller financial disclosure, forward estimates, and peer comparables are available.

Bear case: Limited operating detail and incomplete valuation multiples make the equity harder to underwrite with confidence.

Kill case: Permanent impairment would require evidence that growth, credit quality, or funding economics are structurally weaker than the market expects; the current dataset does not prove that.

### 9. Peer / Competitor Framing
Peer data: ${peerLine}. Current peer comp rows are incomplete, so valuation comparison should be treated as provisional.

### 10. Catalysts and Watch Items
0-90 days:
- Next earnings or trading update.
- Updated analyst price targets.
- Fresh filing or IR document with revenue, margin, and credit metrics.

3-6 months:
- Evidence of durable profitability.
- Better peer valuation disclosure.
- Changes in analyst recommendation balance.

### 11. Risks
1. Missing data risk: key operating and valuation fields are unavailable.
2. Narrative risk: the LLM narrative synthesis did not complete for this cached report.
3. Market risk: price action may remain volatile without clearer forward estimates.

### 12. Source Freshness and Missing Data
Data confidence class: ${data.dataConfidenceClass}. ${scores.dataConfidence.detail}

Missing data includes detailed income statement history, guidance bridge, forward consensus estimates, unit economics, and complete peer multiples.`;
}

function buildFullPrompt(data: CockpitData, scores: CockpitScores): string {
  const company = data.company;
  const ticker = data.ticker ?? 'Private/Unknown';
  const exchange = data.exchange ?? '';
  const price = data.price !== null ? `$${data.price.toFixed(2)}` : 'N/A';
  const priceAsOf = data.priceAsOf ?? 'N/A';
  const lastSourceDate = data.lastCoreSourceDate ?? 'N/A';
  const confidenceClass = data.dataConfidenceClass;

  const freshness = scores.sourceFreshness;
  const confidence = scores.dataConfidence;
  const conviction = scores.conviction;

  return `You are a senior sell-side equity analyst producing a structured Investment Cockpit for ${company} (${ticker}${exchange ? ` on ${exchange}` : ''}).

## DATA AVAILABLE

### Scores (pre-computed, do NOT change these)
- Conviction: ${conviction.score}/100 — ${conviction.detail}
- Data Confidence: ${confidence.score}/100 — ${confidence.detail}
- Source Freshness: ${freshness.score}/100 — ${freshness.detail}
- Data Confidence Class: ${confidenceClass} (★${confidenceClass === 'high' ? '★★' : confidenceClass === 'medium' ? '★☆' : '☆☆'})

### Live Valuation [FMP + Finnhub]
${buildValuationSummary(data)}

### Analyst Consensus [Finnhub]
${buildAnalystSummary(data)}

### Peer Comps [FMP]
${buildPeerSummary(data)}

### SEC EDGAR
${buildSecSummary(data)}

### Private/Deep Research [Exa]
${buildExaDeepSummary(data)}

### IR Documents & PDF Extracts
${buildIRDocSummary(data)}

### Earnings Analysis [Pre-analyzed — Equity Research Skill Layer]
${buildEarningsAnalysisSummary(data)}

### Market Research [Pre-analyzed — Market Researcher Skill Layer]
${buildMarketResearchSummary(data)}

### Recent News [Finnhub]
${buildNewsSnippet(data)}

### Reference
- Price: ${price} as of ${priceAsOf}
- Last Core Source Date: ${lastSourceDate}

## YOUR OUTPUT

Produce a JSON object with EXACTLY these fields. Every number must trace to a source tag in brackets. No invented data — if unknown, say so explicitly.

\`\`\`json
{
  "verdict": "<Buy|Watch|Sell|Avoid|Speculative Buy>",
  "verdictDetail": "<one-sentence rationale for verdict>",
  "kpiBand": [
    { "metric": "<name>", "value": "<formatted>", "detail": "<context + source>" },
    ...4-8 items...
  ],
  "coreDebate": "<single paragraph — the real bull/bear argument, mechanism, and what data would settle it>",
  "thesisQuadrant": {
    "marketLikes": ["<specific bull point>", ...3-5 items],
    "marketDislikes": ["<specific bear point>", ...3-5 items],
    "whatIsPricedIn": ["<embedded expectation>", ...2-4 items],
    "whyUnderPressure": ["<near-term headwind>", ...2-4 items]
  },
  "scenarios": [
    { "name": "Bull", "stance": "<short headline>", "summary": "<2-3 sentences>", "priceRange": "<$X-Y or null>" },
    { "name": "Base", "stance": "<short headline>", "summary": "<2-3 sentences>", "priceRange": "<$X-Y or null>" },
    { "name": "Bear", "stance": "<short headline>", "summary": "<2-3 sentences>", "priceRange": "<$X-Y or null>" },
    { "name": "Kill", "stance": "<short headline — permanent impairment thesis>", "summary": "<2-3 sentences>", "priceRange": null }
  ],
  "missingData": ["<specific data point that would improve analysis>", ...3-6 items],
  "nextCatalyst": {
    "eventName": "<e.g. Q1 2026 earnings>",
    "expectedDate": "<e.g. May 2026>",
    "watchItems": ["<specific metric to watch>", ...3-5 items]
  },
  "fullMemo": "<12-section markdown memo — see spec below>",
  "sourceLibrary": [
    {
      "title": "<document title>",
      "publisher": "<who published>",
      "publicationDate": "<ISO date>",
      "freshnessScore": <0-100>,
      "confidenceScore": <0-100>,
      "url": "<url or 'API: FMP' or 'API: Finnhub' etc>",
      "status": "<analyzed|not_analyzed|partial>"
    },
    ...one entry per source used...
  ]
}
\`\`\`

## FULL MEMO SPEC (12 sections, markdown format)

Write the fullMemo as a complete markdown document with these exact sections:

### 1. Executive Summary / Final Call
State the verdict, price (if public), and 3 bullet points on why.

### 2. What Changed This Quarter
vs prior quarter and prior year. State explicitly if data is unavailable.

### 3. The Real Market Debate
Debate A: [name it]. Debate B (if applicable). Be specific — not "bulls vs bears", but the actual mechanism being disputed.

### 4. Market Likes / Market Dislikes
Two lists. Evidence-backed, not vague.

### 5. Key Financial Snapshot
Tables: Income statement summary (last 2-4 periods), guidance vs actuals (if available), forward consensus estimates.
Every number must have [source] tag.

### 6. Credit / Unit Economics (if fintech/financial) OR Segment Economics (if diversified)
Choose the relevant framing for this company type.

### 7. What Is Priced In
At current price/valuation, what must be true. Frame as implied multiples or growth assumptions.

### 8. Bull / Base / Bear / Kill Case
Full paragraphs for each. Not one-liners.

### 9. Peer / Competitor Framing
How does this company compare to peers on key metrics? Use the peer comp data above.

### 10. Catalysts and Watch Items
0-90 days section. 3-6 month section. Specific events, not generic "macro uncertainty".

### 11. Risks
Named risks, ranked by relevance. Not a generic list.

### 12. Source Freshness and Missing Data
What data is available, what's missing, confidence level. Be honest about gaps.

RULES:
- Write like a senior analyst, not a chatbot. No weasel words.
- Every number needs [source] tag: [SEC EDGAR], [Finnhub], [FMP], [IR Doc], [Exa], [Companies House], [GLEIF]
- No fabricated numbers. If unavailable, say "not available" or "sell-side consensus not available"
- Beat/miss vs guidance, not vs "expectations"
- If company is private, skip public-market sections and focus on funding/valuation/competitive positioning`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((i) => typeof i === 'string');
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

function parseVerdict(value: unknown): Verdict {
  const valid: Verdict[] = ['Buy', 'Watch', 'Sell', 'Avoid', 'Speculative Buy'];
  if (typeof value === 'string' && valid.includes(value as Verdict)) {
    return value as Verdict;
  }
  return 'Watch';
}

function parseKPIBand(value: unknown): readonly KPIMetric[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): KPIMetric | null => {
      if (!isRecord(item)) return null;
      const metric = typeof item['metric'] === 'string' ? item['metric'] : '';
      const val = typeof item['value'] === 'string' ? item['value'] : '';
      const detail = typeof item['detail'] === 'string' ? item['detail'] : '';
      if (!metric || !val) return null;
      return { metric, value: val, detail };
    })
    .filter((i): i is KPIMetric => i !== null);
}

function parseThesisQuadrant(value: unknown): ThesisQuadrant {
  const fallback: ThesisQuadrant = {
    marketLikes: [],
    marketDislikes: [],
    whatIsPricedIn: [],
    whyUnderPressure: [],
  };
  if (!isRecord(value)) return fallback;
  return {
    marketLikes: isStringArray(value['marketLikes']) ? value['marketLikes'] : [],
    marketDislikes: isStringArray(value['marketDislikes']) ? value['marketDislikes'] : [],
    whatIsPricedIn: isStringArray(value['whatIsPricedIn']) ? value['whatIsPricedIn'] : [],
    whyUnderPressure: isStringArray(value['whyUnderPressure']) ? value['whyUnderPressure'] : [],
  };
}

function parseScenarios(value: unknown): readonly Scenario[] {
  if (!Array.isArray(value)) return [];
  const validNames = new Set<string>(['Bull', 'Base', 'Bear', 'Kill']);
  return value
    .map((item): Scenario | null => {
      if (!isRecord(item)) return null;
      const name = item['name'];
      if (typeof name !== 'string' || !validNames.has(name)) return null;
      const priceRange =
        typeof item['priceRange'] === 'string' && item['priceRange'] !== 'null'
          ? item['priceRange']
          : undefined;
      return {
        name: name as Scenario['name'],
        stance: typeof item['stance'] === 'string' ? item['stance'] : '',
        summary: typeof item['summary'] === 'string' ? item['summary'] : '',
        ...(priceRange ? { priceRange } : {}),
      };
    })
    .filter((i): i is Scenario => i !== null);
}

function parseNextCatalyst(value: unknown): NextCatalyst | null {
  if (!isRecord(value)) return null;
  return {
    eventName: typeof value['eventName'] === 'string' ? value['eventName'] : 'Upcoming earnings',
    expectedDate: typeof value['expectedDate'] === 'string' ? value['expectedDate'] : 'TBD',
    watchItems: isStringArray(value['watchItems']) ? value['watchItems'] : [],
  };
}

function parseSourceLibrary(value: unknown): readonly CockpitSource[] {
  if (!Array.isArray(value)) return [];
  const validStatuses = new Set<string>(['analyzed', 'not_analyzed', 'partial']);
  return value
    .map((item): CockpitSource | null => {
      if (!isRecord(item)) return null;
      const status = typeof item['status'] === 'string' && validStatuses.has(item['status'])
        ? (item['status'] as CockpitSource['status'])
        : 'not_analyzed';
      return {
        title: typeof item['title'] === 'string' ? item['title'] : 'Unknown',
        publisher: typeof item['publisher'] === 'string' ? item['publisher'] : 'Unknown',
        publicationDate:
          typeof item['publicationDate'] === 'string' ? item['publicationDate'] : '',
        freshnessScore:
          typeof item['freshnessScore'] === 'number' ? item['freshnessScore'] : 50,
        confidenceScore:
          typeof item['confidenceScore'] === 'number' ? item['confidenceScore'] : 50,
        url: typeof item['url'] === 'string' ? item['url'] : 'N/A',
        status,
      };
    })
    .filter((i): i is CockpitSource => i !== null);
}

function buildValuationData(data: CockpitData): ValuationData | null {
  const { finnhub, fmp } = data;
  if (!finnhub && !fmp) return null;

  const metric = finnhub?.basicFinancials?.metric ?? null;
  const quote = finnhub?.quote ?? null;
  const ev = fmp?.enterpriseValues[0] ?? null;
  const multiples = fmp?.historicalMultiples[0] ?? null;
  const ptFmp = fmp?.priceTargetConsensus ?? null;
  const ptFinnhub = finnhub?.priceTarget ?? null;
  const recs = finnhub?.recommendations[0] ?? null;

  const price = quote?.c ?? null;
  const week52High = metric?.['52WeekHigh'] ?? null;
  const week52Low = metric?.['52WeekLow'] ?? null;
  const marketCap = ev?.marketCapitalization ?? (metric?.marketCapitalization ? metric.marketCapitalization * 1_000_000 : null);
  const enterpriseValue = ev?.enterpriseValue ?? (metric?.ev ? metric.ev * 1_000_000 : null);
  const pe = multiples?.peRatio ?? metric?.peTTM ?? null;
  const evEbitda = multiples?.evToEbitda ?? metric?.evEbitdaTTM ?? null;
  const evRevenue = multiples?.evToSales ?? null;
  const medianPT = ptFmp?.targetMedian ?? ptFinnhub?.targetMedian ?? null;
  const analystUpside =
    medianPT !== null && price !== null && price > 0
      ? (medianPT - price) / price
      : null;

  const buyCount = recs ? recs.strongBuy + recs.buy : 0;
  const holdCount = recs?.hold ?? 0;
  const sellCount = recs ? recs.sell + recs.strongSell : 0;

  return {
    price,
    week52High,
    week52Low,
    marketCap,
    enterpriseValue,
    evRevenue,
    evEbitda,
    pe,
    analystMedianPT: medianPT,
    analystUpside,
    buyCount,
    holdCount,
    sellCount,
  };
}

function buildPeerComps(data: CockpitData): readonly PeerComp[] {
  return (data.fmp?.peers ?? []).map((p): PeerComp => ({
    ticker: p.symbol,
    companyName: p.companyName,
    marketCap: p.marketCap,
    evRevenue: null,
    evEbitda: p.evToEbitda,
    pe: p.peRatio,
    revenueGrowth: p.revenueGrowth,
  }));
}

function buildAnalystConsensus(data: CockpitData): AnalystConsensus | null {
  const recs = data.finnhub?.recommendations ?? [];
  if (recs.length === 0) return null;

  const latest = recs[0]!;
  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  if (total === 0) return null;

  const bullish = latest.strongBuy + latest.buy;
  const bearish = latest.sell + latest.strongSell;
  let consensusLabel: ConsensusLabel = 'Neutral';
  if (bullish / total > 0.5) consensusLabel = 'Bullish';
  else if (bearish / total > 0.35) consensusLabel = 'Bearish';

  const ptFmp = data.fmp?.priceTargetConsensus ?? null;
  const ptFinnhub = data.finnhub?.priceTarget ?? null;

  return {
    strongBuy: latest.strongBuy,
    buy: latest.buy,
    hold: latest.hold,
    sell: latest.sell,
    strongSell: latest.strongSell,
    medianPT: ptFmp?.targetMedian ?? ptFinnhub?.targetMedian ?? null,
    highPT: ptFmp?.targetHigh ?? ptFinnhub?.targetHigh ?? null,
    lowPT: ptFmp?.targetLow ?? ptFinnhub?.targetLow ?? null,
    consensusLabel,
  };
}

export async function synthesizeCockpit(data: CockpitData): Promise<CockpitReport> {
  const dataConfidenceScore = computeDataConfidence(data);
  const sourceFreshnessScore = computeSourceFreshness(data);
  const convictionScore = computeConviction(
    dataConfidenceScore,
    sourceFreshnessScore,
    data.sec?.xbrlFacts !== null,
    data.fmp?.priceTargetConsensus !== null || data.finnhub?.priceTarget !== null,
    (data.finnhub?.recommendations.length ?? 0) > 0
  );

  const scores: CockpitScores = {
    conviction: convictionScore,
    dataConfidence: dataConfidenceScore,
    sourceFreshness: sourceFreshnessScore,
  };

  const prompt = buildFullPrompt(data, scores);

  let rawJson: unknown = null;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      system:
        'You are a senior equity analyst. Always respond with a single JSON object wrapped in ```json``` fences. Every financial number must have a [source] tag. Never fabricate data.',
    });

    const content = response.content[0];
    if (content?.type === 'text') {
      rawJson = tryParseJson(content.text);
    }
  } catch (error: unknown) {
    console.error('[narrative] Claude API call failed', { error: String(error) });
  }

  const parsed: Record<string, unknown> = isRecord(rawJson) ? rawJson : {};

  const verdict = parseVerdict(parsed['verdict']);
  const verdictDetail =
    typeof parsed['verdictDetail'] === 'string'
      ? parsed['verdictDetail']
      : 'Insufficient data to determine verdict with high confidence.';
  const kpiBand = parseKPIBand(parsed['kpiBand']);
  const coreDebate =
    typeof parsed['coreDebate'] === 'string'
      ? parsed['coreDebate']
      : 'Insufficient data to articulate core debate.';
  const thesisQuadrant = parseThesisQuadrant(parsed['thesisQuadrant']);
  const scenarios = parseScenarios(parsed['scenarios']);
  const missingData = isStringArray(parsed['missingData']) ? parsed['missingData'] : [];
  const nextCatalyst = parseNextCatalyst(parsed['nextCatalyst']);
  const sourceLibrary = parseSourceLibrary(parsed['sourceLibrary']);
  const valuation = buildValuationData(data);
  const peerComps = buildPeerComps(data);
  const analystConsensus = buildAnalystConsensus(data);

  const fullMemo =
    typeof parsed['fullMemo'] === 'string'
      ? parsed['fullMemo']
      : buildFallbackFullMemo(data, scores, valuation, analystConsensus, peerComps);

  return {
    company: data.company,
    ticker: data.ticker,
    exchange: data.exchange,
    verdict,
    verdictDetail,
    price: data.price,
    priceAsOf: data.priceAsOf,
    lastCoreSourceDate: data.lastCoreSourceDate,
    scores,
    kpiBand,
    coreDebate,
    thesisQuadrant,
    scenarios,
    missingData,
    nextCatalyst,
    sourceLibrary,
    valuation,
    peerComps,
    analystConsensus,
    fullMemo,
    generatedAt: new Date().toISOString(),
    dataConfidenceClass: data.dataConfidenceClass,
  };
}
