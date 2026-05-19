# Investment Cockpit — Output Format Specification

## Reference: Klarna V2 Investment Cockpit (target output quality)

This file defines every field in the cockpit output. The Claude synthesis prompt
must produce all sections. The `CockpitReport` type in `src/lib/types.ts` maps 1:1
to these sections.

---

## 1. Header Block

```
Company: Klarna Group plc
Ticker: NYSE: KLAR
Verdict: Watch
Verdict Detail: growth is real, profit conversion is not yet trusted
Price: $14.29
Price As Of: 2026-05-07
Last Core Source Date: 2026-02-19 (date of most recent primary document used)
```

**Verdict options:** `Buy` | `Watch` | `Sell` | `Avoid` | `Speculative Buy`

---

## 2. Scores (0–100 each)

| Score | Description |
|---|---|
| Conviction | How strong/clear the investment case is. 80+ = high conviction, 50-79 = watch, <50 = uncertain |
| Data Confidence | How complete the data is. 90+ = SEC + earnings docs + consensus. 50-70 = market data only. <50 = web-only |
| Source Freshness | Recency. 100 = today. 80 = within 90 days. 60 = within 6 months. <50 = stale |

Each score must include a `detail` string explaining why.

---

## 3. KPI Band

Array of key metrics. Each has:
- `metric` — metric name (e.g. "Q4 GMV", "Revenue", "Adj Op Profit")
- `value` — formatted value (e.g. "$38.7b", "$1.082b", "$47m")
- `detail` — context (e.g. "+32% YoY; FY2025 GMV was $127.9b")

For public companies: include Revenue, EBITDA/Op Profit, key volume metric, consumer/user count, market cap.
For private companies: include ARR/Revenue estimate, funding raised, valuation, employee count, growth rate.

---

## 4. Core Debate

Single paragraph. The central investment question. Not a summary — the REAL argument:
- What the bull and bear are actually disagreeing about
- The specific mechanism that makes this hard to resolve
- What data would settle it

Example: "The real debate is whether Klarna's TMD miss is temporary margin timing
from fast Fair Financing growth, or evidence that the company is becoming a
lower-quality credit-sensitive fintech."

---

## 5. Thesis Quadrant

Four arrays of bullet strings:

### marketLikes[]
What the market/bulls find compelling. Specific, evidence-backed.

### marketDislikes[]
What bears/skeptics point to. Specific, not vague.

### whatIsPricedIn[]
What expectations are already embedded in the current price.
If no live price, frame directionally.

### whyUnderPressure[]
Near-term headwinds, recent negative developments, execution concerns.

---

## 6. Scenarios

Four scenarios, each with:
- `name`: Bull | Base | Bear | Kill
- `stance`: Short headline (e.g. "Fair Financing seasons cleanly")
- `summary`: 2-3 sentence description of the path
- `priceRange`: Optional (e.g. "$18-22") — only if DCF/multiples available

---

## 7. Missing Data

Array of strings. What would improve the analysis. Be specific:
- "Cohort loss curves for 2025 Fair Financing vintages"
- "Sell-side consensus estimates (Bloomberg/FactSet)"
- "Management Q&A from earnings webcast"
- "20-F footnotes on ECL methodology"

---

## 8. Next Catalyst

- `eventName`: e.g. "Q1 2026 earnings"
- `expectedDate`: e.g. "May 14, 2026"
- `watchItems[]`: Array of strings — specific things to watch at that event

---

## 9. Source Library

Array of sources used. Each:
- `title`: Document name
- `publisher`: Who published it
- `publicationDate`: ISO date string
- `freshnessScore`: 0-100
- `confidenceScore`: 0-100
- `url`: URL or "Local/static source"
- `status`: "analyzed" | "not_analyzed" | "partial"

---

## 10. Valuation Panel (DATA DEPTH — new vs Klarna report)

Live data from FMP + Finnhub:
- Current price, 52-week high/low
- Market cap, Enterprise Value
- EV/Revenue (TTM), EV/EBITDA (TTM), P/E (TTM)
- Analyst median price target, implied upside/downside
- Buy/Hold/Sell counts

---

## 11. Peer Comp Table (DATA DEPTH — new)

5 peers from FMP stock-peers endpoint. Each peer:
- Ticker, Company Name
- Market Cap
- EV/Revenue
- EV/EBITDA
- P/E
- Revenue Growth (YoY)

---

## 12. Analyst Consensus (DATA DEPTH — new)

From Finnhub + FMP:
- Strong Buy / Buy / Hold / Sell / Strong Sell counts
- Median price target
- High PT / Low PT
- Consensus label: "Bullish" | "Neutral" | "Bearish"

---

## 13. Full Research Memo

12-section deep-dive memo. Sections:

1. Executive Summary / Final Call
2. What Changed This Quarter (vs prior quarter + prior year)
3. The Real Market Debate (Debate A + Debate B if applicable)
4. Market Likes / Market Dislikes
5. Key Financial Snapshot (tables: guidance vs actuals, income statement, forward guidance)
6. Credit / Unit Economics (if financial services) OR Segment Economics (if diversified)
7. What Is Priced In
8. Bull / Base / Bear / Kill Case (full paragraphs)
9. Peer / Competitor Framing
10. Catalysts and Watch Items (0-90 days + 3-6 months)
11. Risks (named, ranked by relevance)
12. Source Freshness and Missing Data

**Rules for memo:**
- Every number tagged with source: [SEC EDGAR], [Finnhub], [FMP], [IR Doc], [Exa]
- No fabricated numbers — if data missing, state it
- No weasel words: write like a senior analyst, not a chatbot
- Beat/miss vs guidance, not vs "expectations"
- If no sell-side consensus available, say so explicitly

---

## CockpitReport TypeScript Shape

```typescript
type CockpitReport = {
  readonly company: string;
  readonly ticker: string | null;
  readonly exchange: string | null;
  readonly verdict: Verdict;
  readonly verdictDetail: string;
  readonly price: number | null;
  readonly priceAsOf: string | null;
  readonly lastCoreSourceDate: string | null;
  readonly scores: CockpitScores;
  readonly kpiBand: readonly KPIMetric[];
  readonly coreDebate: string;
  readonly thesisQuadrant: ThesisQuadrant;
  readonly scenarios: readonly Scenario[];
  readonly missingData: readonly string[];
  readonly nextCatalyst: NextCatalyst | null;
  readonly sourceLibrary: readonly CockpitSource[];
  readonly valuation: ValuationData | null;
  readonly peerComps: readonly PeerComp[];
  readonly analystConsensus: AnalystConsensus | null;
  readonly fullMemo: string;
  readonly generatedAt: string;
  readonly dataConfidenceClass: 'high' | 'medium' | 'low';
};
```

---

## Key Differences vs Existing finance_intelligence App

The existing app (`finance_intelligence`) produces a general analyst report.
This app (`investment-cockpit`) produces the specific cockpit format above, with:

1. **Structured verdict** (not just a recommendation)
2. **Three quantified scores** (Conviction, Data Confidence, Source Freshness)
3. **Thesis Quadrant** (4-quadrant market sentiment grid)
4. **Bull/Base/Bear/Kill scenarios** (named, with specific mechanisms)
5. **Live valuation panel** (price, EV, multiples — requires FMP)
6. **Live peer comp table** (5 peers × 5 multiples)
7. **Source Library with per-source freshness/confidence**
8. **IR document discovery** — Exa finds company earnings PDFs, Claude reads them
9. **12-section research memo** format (not the 7-section narrative from old app)

The old app's datasource clients are ported verbatim. Only the synthesis layer changes.
