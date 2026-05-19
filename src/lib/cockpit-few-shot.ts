// ─── Few-shot example: Klarna V2 — target output quality and structure ────────
// Extracted to keep cockpit-narrative.ts under 900 lines.
export const KLARNA_FEW_SHOT = `
=== THIS IS THE TARGET OUTPUT QUALITY AND STRUCTURE ===
The following is an example of the exact quality, depth, and analytical rigour required.
Company: Klarna Group plc (NYSE: KLAR). Produced May 2026 from Q4 2025 earnings pack.
Match this depth for every section. Never produce shallower analysis.

--- EXAMPLE JSON OUTPUT (abridged field list — fullMemo shown in full below) ---

{
  "verdict": "Watch",
  "verdictDetail": "Growth is real, profit conversion is not yet trusted — TMD missed guidance for the third consecutive quarter despite a credible IFRS 9 provisioning explanation.",
  "kpiBand": [
    { "metric": "Q4 GMV", "value": "$38.7b", "detail": "+32% YoY; FY2025 GMV was $127.9b. Beat guidance of $37.5–38.5b. [IR Doc PDF — Q4 2025 Earnings Release]" },
    { "metric": "Q4 Revenue", "value": "$1.082b", "detail": "+38% YoY; first billion-dollar quarter. Beat top of guidance range $1,065–$1,080m. [IR Doc PDF]" },
    { "metric": "Adj Op Profit", "value": "$47m", "detail": "Q4 adjusted operating profit. Adj margin 4.3%. FY2025 IFRS net loss $(273)m — keep both visible. [IR Doc PDF]" },
    { "metric": "Transaction Margin $", "value": "$372m", "detail": "MISSED guidance of $390–$400m by ~$18–28m. TMD margin 34.4% of revenue vs 40.6% in Q4'24. [IR Doc PDF]" },
    { "metric": "Consumers", "value": "117.9m", "detail": "Banking consumers: 15.8m (doubled YoY). Banking ARPU $107 vs $30 average — 3.6x lift. [IR Doc PDF]" },
    { "metric": "Fair Financing GMV", "value": "$4.5b (Q4)", "detail": "+165% YoY. Day-1 IFRS 9 provisioning on rapid cohort growth drives TMD compression. [IR Doc PDF]" }
  ],
  "coreDebate": "The real debate is NOT whether Klarna can grow — it clearly can (+38% revenue, +32% GMV in Q4). The debate is whether the Transaction Margin Dollar miss is (A) a predictable and temporary IFRS 9 accounting lag from fast Fair Financing adoption, or (B) evidence that management's guidance process is structurally unreliable and that the cohort credit curves will not season as modelled. On (A): the mechanism is textbook — originate installment loan, recognize Day-1 expected credit loss in full, collect interest revenue over 6–24 months. In a 165% YoY growth environment, provision expense runs ahead of revenue. The $73m institutional gain-on-sale of $1.6b of receivables is independent market validation of credit quality. On (B): this is the third consecutive quarter of TMD underperformance vs guidance. Management cannot both claim the guidance process is rigorous and accept repeated growth-investment misses. Q1 2026 guidance of $300–340m TMD implies further QoQ contraction from Q4's already-missed $372m. The 2025 vintage charge-off curves are only 6–9 months seasoned — nowhere near the 12–15 months needed to verify the 3–4% modelled peak.",
  "thesisQuadrant": {
    "marketLikes": [
      "Revenue crossed $1b for the first time — $1,082m Q4 revenue +38% YoY, beat top of guidance. Milestone matters for IPO narrative.",
      "U.S. acceleration: revenue +58% YoY, GMV +43%, 29m consumers (11% of U.S. population). U.S. Fair Financing is a massive whitespace.",
      "Banking consumer ARPU leverage: 15.8m banking consumers at $107 ARPU vs $30 average — demonstrated 3.6x monetization gap is real.",
      "Cost discipline: Revenue +104% since Q4'22, adjusted opex -8%. Revenue per employee $1.24m — among highest in fintech.",
      "Forward-flow validation: $73m gain-on-sale of $1.6b Fair Financing receivables at premium to book = independent institutional credit quality confirmation."
    ],
    "marketDislikes": [
      "TMD missed guidance ($372m vs $390–400m) — third consecutive quarter of margin underperformance vs own guidance.",
      "Q1 2026 guidance implies TMD contraction QoQ to $300–340m, attributed to seasonality but coincides with 2025 cohort maturation window.",
      "FY2025 IFRS net loss of $(273)m — wider than $(244)m in 2023 and reversal from $21m profit in 2024. Wrong direction YoY.",
      "SBC of $33m/quarter excluded from adjusted operating profit. Dilutive to equity holders at this scale.",
      "Revenue take rate improvement partially absorbed by funding cost growth: fair value adjustment on loans sold +174% YoY to $78m in Q4."
    ],
    "whatIsPricedIn": [
      "The market accepts Klarna can grow; growth alone is not the question. The question is whether TMD, provisions, and funding costs can recover together.",
      "2026 guidance implies TMD inflection through the year (FY guidance >1.04% of GMV = ~$1.6b vs Q4 run-rate ~$1.49b) — cohort seasoning must deliver.",
      "Adjusted operating profit of >6.9% of FY2026 revenue (~$300m+) would represent ~2x FY2025 — significant operating leverage priced in.",
      "Without live multiples and sell-side consensus, exact priced-in assumptions are directional, not calculable."
    ],
    "whyUnderPressure": [
      "Q4 TMD margin compressed to 34.4% of revenue from 40.6% in Q4'24 — 620bps deterioration against a backdrop of revenue beats.",
      "Q4 report is 11+ weeks old; Q1 results will reset the narrative before the current report's thesis can compound.",
      "The public market is calibrating against a fresh IPO narrative — any guidance miss in the first 3 quarters post-IPO damages credibility disproportionately."
    ]
  },
  "scenarios": [
    {
      "name": "Bull",
      "stance": "Fair Financing seasons cleanly",
      "summary": "2024–2025 cohorts season within the 3–4% modelled charge-off peak. As cohorts mature, TMD as % of revenue expands back toward 40%+ through 2026. Banking consumers reach 25m+, pulling average ARPU from $30 toward $45–50. Worldpay/JP Morgan default-on partnerships activate at scale in H2'26, adding tens of millions of U.S. consumers. Revenue reaches $5b+ in 2027. Adjusted operating profit approaches 12–15% of revenue. The company earns a high-growth fintech multiple.",
      "priceRange": null
    },
    {
      "name": "Base",
      "stance": "Growth good, trust still capped",
      "summary": "Fair Financing growth moderates from 165% to 80–100% YoY by Q4'26 (base effect). Provisions stabilize at 0.60–0.70% of GMV. TMD/GMV expands incrementally as cohorts season; full-year 2026 TMD hits guidance range ~$1.6b. Banking consumers reach 22–25m. Adjusted operating profit reaches $250–300m in FY2026. IFRS losses narrow but do not disappear. Revenue grows 25–30%. The stock stays range-bound pending one clean guidance delivery.",
      "priceRange": null
    },
    {
      "name": "Bear",
      "stance": "Credit mix keeps weighing",
      "summary": "2025 Fair Financing cohorts season above model (charge-offs reach 5–6% vs 3–4% modelled). Provision rates re-accelerate toward 0.80–0.90% of GMV in mid-2026. TMD margin stays compressed at 30–35% of revenue. Banking consumer ARPU of $107 doesn't scale because $475 average deposits reflects a secondary account relationship. Worldpay/JP Morgan activation slower than expected. Revenue growth decelerates to 15–20% by H2'26; adjusted operating profit guidance missed for second year consecutively.",
      "priceRange": null
    },
    {
      "name": "Kill",
      "stance": "Model breaks on credit cycle",
      "summary": "Macro recession or elevated unemployment causes vintage curves to blow through 4% toward 6–8% charge-offs. The forward-flow program freezes as institutional investors reprice Fair Financing receivables. $13b in consumer deposits starts to run if depositors perceive credit risk at Klarna Bank. Regulatory intervention in the EU or UK disrupts BNPL model. Company requires equity at distressed valuation. This is a tail risk, not a base case — but not zero given the speed of Fair Financing growth and immaturity of vintage data.",
      "priceRange": null
    }
  ],
  "missingData": [
    "Management Q&A webcast content — qualitative commentary on credit guidance and partnership timelines not reflected.",
    "External sell-side consensus estimates — all beat/miss analysis is vs company guidance only; true consensus beat/miss not determinable.",
    "20-F annual report footnotes — ECL model methodology, capital adequacy (Klarna Bank), geographic revenue P&L not analyzed.",
    "Fair Financing cohort loss curves at 12–15 month maturity for 2025 originations — too young to verify at peak seasoning.",
    "Funding cost bridge — detail on how forward-flow program scale affects net funding cost trajectory in 2026.",
    "Q3'25 TMD guidance vs actual — would clarify whether the TMD miss pattern predates Q4."
  ],
  "nextCatalyst": {
    "eventName": "Q1 2026 earnings",
    "expectedDate": "May 14, 2026",
    "watchItems": [
      "TMD vs $300–340m guidance — first test of whether cohort seasoning is compounding as modelled.",
      "Fair Financing GMV growth rate vs provision rate — these must diverge positively for the thesis to work.",
      "IFRS net loss trajectory — whether operating leverage is visible on a GAAP basis, not just adjusted.",
      "Receivable offload volume and gain/loss — quality signal for institutional demand for Klarna credit.",
      "U.S. consumer and card adoption pace — Klarna Card 4.2m active users; trajectory toward 8m mid-year."
    ]
  }
}

--- EXAMPLE fullMemo (12 sections — match this depth and structure EXACTLY) ---

### 1. Executive Summary / Final Call
Mixed quarter with a clear narrative split: top-line was clean, unit economics were not.

Revenue crossed $1 billion for the first time ($1,082m, +38% YoY) [IR Doc PDF — Q4 2025 Earnings Release], beating the top of guidance. GMV of $38.7b (+32% YoY) beat guidance by ~$200–300m. Both metrics were accompanied by accelerating U.S. growth (+58% revenue, +43% GMV) [IR Doc PDF] and genuine product momentum in Fair Financing (+165% GMV YoY) and the Klarna Card (users up +288% YoY to 4.2m) [IR Doc PDF — Q4 2025 Investor Presentation].

The miss: Transaction Margin Dollars (TMD) came in at $372m, ~$18–28m below the $390–400m guidance range [IR Doc PDF]. Management's explanation — faster-than-expected Fair Financing adoption forces upfront IFRS 9 provisioning before revenue accrues — is structurally coherent and supported by stable-to-improving delinquency data. But this is the third consecutive quarter where management has explained away margin underperformance with a growth-investment narrative. Investors must decide whether this is a predictable accounting lag or evidence that the guidance process is unreliable.

FY2025 IFRS net loss widened to $(273)m vs net profit of $21m in 2024 [IR Doc PDF]. Adjusted operating profit was $47m in Q4 — thin margin on $1bn revenue excluding $33m of quarterly SBC [IR Doc PDF].

**Verdict: Watch.** Klarna is growing faster than almost any public fintech of scale. The payment → banking pivot is real, showing 3x ARPU leverage, and credit quality data is defensible. But the company is not yet demonstrating consistent margin delivery, and FY2026 Q1 guidance implies TMD contraction QoQ ($300–340m vs $372m in Q4). Investors face a company that earns a growth premium only if the provision-deferral thesis proves out over the next 2–4 quarters.

### 2. What Changed This Quarter

**Vs prior quarter (Q3 2025):**
- GMV acceleration: +32% YoY in Q4 vs +25% in Q3. Like-for-like +23% [IR Doc PDF].
- Revenue acceleration: +38% YoY in Q4 vs +28% in Q3 (+10pp acceleration) [IR Doc PDF].
- U.S. revenue acceleration: +58% YoY in Q4 vs +51% in Q3 — U.S. now clearly leads growth [IR Doc PDF].
- Fair Financing inflection: GMV +165% YoY in Q4 vs +139% in Q3; December alone reached +193% YoY [IR Doc PDF — Investor Presentation].
- Klarna Card step-change: Active users hit 4.2m, up 1.9m quarter-over-quarter — sharpest acceleration in product history [IR Doc PDF].
- TMD recovered QoQ but missed guidance: TMD $372m was +28% QoQ (from implied ~$290m in Q3) but missed $390–400m guidance [IR Doc PDF].
- Provision rate improved: 0.65% of GMV in Q4 vs 0.72% in Q3 — attributed to stable delinquencies and increased offloading [IR Doc PDF].
- First forward-flow gain: $73m gain-on-sale of $1.6b Fair Financing receivables sold to institutional investors [IR Doc PDF].

**Vs prior year (Q4 2024):**
- Revenue +38%; GMV +32%; consumers +28%; merchants +42% [IR Doc PDF].
- Net loss $(26)m vs net profit $40m — provisions +59% ($250m vs $156m), funding costs +43% ($210m vs $147m) [IR Doc PDF].
- Banking consumer count doubled: 15.8m vs ~7.9m implied [IR Doc PDF — Investor Presentation].

### 3. The Real Market Debate

**Debate A: Is the provision miss a "good" miss?**

The mechanism is textbook under IFRS 9: originate a Fair Financing cohort → recognize Day-1 expected credit loss provision in full → recognize interest revenue over the loan's life (6–24 months). In a 165% YoY growth environment, provision expense necessarily runs ahead of revenue on new cohorts. This is not financial engineering — it is how installment lending works under IFRS 9 [IR Doc PDF — Investor Presentation, slide 7].

The honest bear case is not that management is lying. It is that: (a) this narrative allows management to perpetually miss TMD guidance as long as Fair Financing grows, and (b) the "profitable at maturity" thesis requires cohort credit curves to stay within modelled ranges. On (b): the $73m gain-on-sale at a premium to book is independent institutional validation — real market-clearing evidence that receivables are priced correctly [IR Doc PDF].

**Debate B: Is the ARPU/banking pivot structurally defensible?**

15.8m banking consumers generating $107 ARPU vs $30 average — a 3.6x lift — is Klarna's core value proposition for the next phase [IR Doc PDF — Investor Presentation]. The skeptical question: does Klarna have the regulatory standing and consumer trust to become a primary bank relationship for most of these users? $475 average deposit balance per banking consumer is low; these are not primary banking relationships for most. The underlying question both debates share: How durable is Klarna's underwriting advantage at scale? The company claims loss curves are unchanged from Q1'23 to Q1'25 despite volume tripling. If true, this is exceptional. If not, the 2026 vintage performance is the reveal.

### 4. Market Likes / Market Dislikes

**Market Likes:**
- First $1bn quarter milestone: $1,082m Q4 revenue +38% YoY — beat top of guidance, psychologically important for a recently-IPO'd company [IR Doc PDF].
- U.S. acceleration: 58% revenue growth, 43% GMV growth, 29m consumers = 11% of U.S. population. The U.S. Fair Financing market is enormous relative to current penetration [IR Doc PDF].
- Banking consumer ARPU leverage: 15.8m banking consumers at $107 vs $30 average. Ramp from ~7.9m to 15.8m in one year is credible evidence of adoption [IR Doc PDF — Investor Presentation].
- Cost discipline: Revenue +104% since Q4'22 while adjusted opex declined 8%. Revenue per employee $1.24m — among highest in fintech [IR Doc PDF].
- Forward-flow validation: $73m gain-on-sale at premium to book confirms institutional demand and validates credit quality independently [IR Doc PDF].

**Market Dislikes:**
- TMD miss is now a pattern: third consecutive quarter of margin underperformance vs own guidance [IR Doc PDF].
- Q1 2026 guidance implies TMD contraction QoQ: $300–340m vs $372m in Q4, coinciding with the 2025 cohort maturation window [IR Doc PDF].
- FY2025 net loss of $(273)m: wider than $(244)m in 2023 and reversal from $21m profit in 2024 — wrong direction YoY [IR Doc PDF].
- SBC large and excluded: $33m quarterly SBC not in adjusted operating profit metric. Dilutive to equity holders [IR Doc PDF].
- Funding cost trajectory: fair value adjustment on loans sold grew 174% YoY to $78m in Q4 — scales with Pay Later offloading volume [IR Doc PDF].

### 5. Key Financial Snapshot

**Table 1: Q4 2025 Guidance vs Actuals** [IR Doc PDF — Q4 2025 Earnings Release]

| Metric | Q4 Guidance | Q4 Actual | Result |
|---|---|---|---|
| GMV | $37.5–$38.5b | $38.7b | BEAT |
| Revenue | $1,065–$1,080m | $1,082m | BEAT |
| Transaction Margin $ | $390–$400m | $372m | MISS (~–5%) |
| Adj. Operating Profit | n/a | $47m | — |

**Table 2: Income Statement Summary (USD millions)** [IR Doc PDF]

| | Q4'25 | Q4'24 | YoY | FY2025 | FY2024 | YoY |
|---|---|---|---|---|---|---|
| GMV | 38,698 | 29,382 | +32% | 127,900 | — | — |
| Revenue | 1,082 | 781 | +38% | 3,509 | 2,811 | +25% |
| Provision for credit losses | (250) | (156) | +59% | (794) | (495) | +60% |
| Provision as % of GMV | 0.65% | 0.53% | +12bps | ~0.60% | ~0.46% | — |
| TMD (before provisions) | 622 | 474 | +31% | — | — | — |
| TMD | 372 | 317 | +17% | — | — | — |
| TMD margin (% revenue) | 34.4% | 40.6% | –620bps | — | — | — |
| Adj. operating profit | 47 | 42 | +12% | ~155 | — | — |
| Net profit / (loss) | (26) | 40 | n.m. | (273) | 21 | n.m. |

**Table 3: FY2026 Guidance** [IR Doc PDF]

| | Q1'26 Guidance | YoY | FY2026 |
|---|---|---|---|
| GMV | $32–33b | +26–30% | >$155b |
| Revenue | $900–980m | +28–40% | >2.80% of GMV |
| TMD | $300–340m | +11–26% | >1.04% of GMV |
| Adj. op. profit | $5–35m | +51–959% | >6.9% of revenue |

### 6. Credit / Unit Economics

**Provision Mechanics:**
Provision for credit losses was $250m in Q4'25 (0.65% of GMV), down 7bps from Q3'25's 0.72% and up 12bps from Q4'24's 0.53% [IR Doc PDF]. Sequential improvement came despite Fair Financing GMV +165% YoY; attributed to stable delinquency trends and offloading $1.6b of receivables.

**Consumer Receivables Book** [IR Doc PDF — Balance Sheet, Dec 31, 2025]:

| | Gross | ECL Allowance | Net | Coverage |
|---|---|---|---|---|
| Fair Financing | $4,604m | $(272)m | $4,332m | 5.9% |
| Pay Later | $6,347m | $(220)m | $6,127m | 3.5% |
| Total | $10,951m | $(492)m | $10,459m | 4.5% |

Fair Financing coverage 5.9% reflects longer duration (6–24 month installment vs sub-60 day Pay Later). ECL allowance grew from $332m to $492m (+48%) while gross book grew +29% — management provisioning more conservatively relative to book, consistent with the growth-provisioning thesis.

**Banking Consumer Credit Profile** [IR Doc PDF — Investor Presentation]:

| | Klarna Total | Klarna Banking |
|---|---|---|
| Active consumers | 117.9m | 15.8m |
| Purchase frequency (L12M) | 10.1x | 28.5x |
| ARPU | $30 | $107 |
| Avg deposits | $64 | $475 |
| Avg credit outstanding | $146 | $568 |
| Avg charge-off rate | 0.6% | 1.1% |

Banking consumers carry ~4x the credit balance and ~2x the charge-off rate vs average. 1.1% charge-off rate is not alarming for installment credit but is the number to watch as the segment scales.

**Vintage Performance (US Fair Financing)** [IR Doc PDF — Investor Presentation, slide 7]:
Cumulative charge-off curves by origination vintage (Q1'23–Q1'25) converge to 3–4% at 12–15 months. Volume tripled, loss curves unchanged from Q1'23 to Q1'25. Critical caveat: Q1'25 vintage is only 6–9 months seasoned — curves for the fastest-growing cohorts are unverified at maturity.

### 7. What Is Priced In

No current price target offered — stock price data unavailable for this analysis period. The following describes qualitative market expectations implied by the narrative.

FY2026 guidance implies: revenue ~$4.3–4.7b (+22–34% YoY) at >2.80% take rate on >$155b GMV; TMD inflection through the year (~$1.6b FY2026 vs ~$1.49b implied Q4 run-rate); adjusted operating profit doubling to ~$300m+. The market is pricing significant operating leverage from cohort seasoning — the model requires this to materialize.

Risk in what's priced in: Q1'26 guidance adjusted operating profit of $5–35m implies back-half loaded profitability. If Fair Financing adoption continues to outpace expectations (as it did in Q4), provision expense could again defer that inflection. Markets pricing significant operating leverage require at least one clean guidance delivery to sustain the multiple.

### 8. Bull / Base / Bear / Kill Case

**Bull:** Fair Financing scales to 20%+ of GMV by Q4'26, reaching $35–40b in annual originations. 2024–2025 cohorts season within the 3–4% charge-off model. As cohorts mature and provisions normalize, TMD as a % of revenue expands back toward 40%+. Banking consumers reach 25m+, pulling average ARPU from $30 toward $45–50. Worldpay/JP Morgan default-on partnerships activate at scale in H2'26. Revenue reaches $5b+ in 2027. Adjusted operating profit approaches 12–15% of revenue.

**Base:** Fair Financing growth moderates from 165% to 80–100% YoY by Q4'26 (base effect). Provisions stabilize at 0.60–0.70% of GMV. TMD/GMV expands incrementally as cohorts season; 2026 full-year TMD hits $1.6–1.7b (guidance midpoint). Banking consumers reach 22–25m. U.S. revenue growth sustains 40–50% YoY. Adjusted operating profit reaches $250–300m in FY2026. IFRS operating losses narrow but do not disappear; net loss improves to $(100–150)m. Stock stays range-bound pending one clean guidance delivery.

**Bear:** 2025 Fair Financing cohorts season above model (charge-offs reach 5–6% vs 3–4% modelled). Provision rates re-accelerate toward 0.80–0.90% of GMV in mid-2026. TMD margin remains compressed at 30–35% of revenue. Banking consumer ARPU of $107 doesn't scale because $475 average deposits is a secondary account relationship, not primary banking. Worldpay/JP Morgan activation slower than expected. Revenue growth decelerates to 15–20% by H2'26; adjusted operating profit guidance missed for second consecutive year.

**Kill:** Credit cycle deterioration (macro recession, elevated unemployment) causes vintage curves to blow through 4% toward 6–8% charge-offs. The forward-flow program freezes as institutional investors reprice Fair Financing receivables. $13b in consumer deposits starts to run if depositors perceive credit risk at Klarna Bank. Regulatory intervention in the EU or UK disrupts BNPL model. Company requires equity capital at a distressed valuation. This is a tail risk, not a base case — not zero given the speed of Fair Financing growth and the immaturity of the vintage data.

### 9. Peer / Competitor Framing

**Affirm (AFRM) — closest U.S. comparable:** Operates similar installment lending model with higher AOV (furniture, electronics, travel) vs Klarna's broader retail + fashion skew. Affirm achieved GAAP profitability in Q4 FY2025 for the first time, demonstrating the installment-at-scale model can reach profitability. Key difference: Klarna is building a payments network + bank; Affirm is building a lending-first platform. Klarna's 118m consumers and 966k merchants give it a network moat Affirm lacks. Affirm credit loss rate typically 3–6% of GMV vs Klarna's 0.65% provision rate — note these metrics are defined differently and should not be directly compared.

**Afterpay/Block (SQ):** Integrated into Cash App, Afterpay lost independent brand identity in the U.S. post-acquisition. No direct transparency into standalone Afterpay economics. Klarna is likely taking market share from Afterpay at checkout.

**PayPal Pay Later:** 435m active accounts but strategy is defensive (protect GMV share) not offensive (grow new credit categories). Klarna's Fair Financing is a direct attack on revolving credit PayPal does not aggressively compete in.

**The real market — revolving credit:** U.S. revolving credit market is ~$1.3 trillion in outstanding balances. Fair Financing at $4.5b quarterly GMV ($18b annualized) is still under 2% penetration of the addressable installment/revolving credit space. If the credit quality thesis holds, this is the growth runway that justifies the current investment cycle.

### 10. Catalysts and Watch Items

**0–90 days:**
- Q1 2026 results (May 14, 2026): First test of whether Fair Financing cohorts from H2'25 season within model. TMD $300–340m vs Q4's $372m will be scrutinized.
- Worldpay and JP Morgan Payments default-on launch timing: Management said 2026 launch expected; merchant activation rate and GMV uplift are the first read.
- Full annual report (20-F): Filed February 26, 2026. Footnotes on credit provisioning methodology and regulatory capital are relevant.

**3–6 months:**
- U.S. card adoption trajectory: 4.2m active users, +1.9m QoQ. If pace continues, card could cross 8m users by mid-2026.
- Subscription conversion: 3.5m subscriptions mostly in trial. Conversion into paid subscriptions will reveal whether banking ARPU thesis can expand further.
- Forward-flow program scale: Will Q1/Q2'26 feature additional large offloads? Each offload timing creates quarterly noise in reported profitability.

### 11. Risks

1. **Credit risk — vintage seasoning (HIGH):** Most material risk. 2025 Fair Financing cohorts too young to validate at maturity. Deterioration vs modelled 3–4% charge-off peaks would require provision additions, compress TMD, and impair forward-flow program economics.
2. **Provision guidance reliability:** Management missed TMD guidance in Q4 citing faster-than-expected growth. Guidance credibility is impaired until management demonstrates a quarter where growth AND margins beat simultaneously.
3. **Interest rate sensitivity:** FY2026 guidance assumes modest benchmark rate declines. Funding costs ($210m in Q4'25, +43% YoY) are rate-sensitive. Higher-for-longer compresses Fair Financing net interest margin.
4. **Regulatory risk:** BNPL regulation accelerating in EU (Consumer Credit Directive) and UK. Product-level regulation could impose affordability checks that slow Fair Financing originations.
5. **FX risk:** 6pp of Q4'25 revenue growth (38% reported vs 32% LfL) was from FX tailwinds. 2026 guidance embeds EUR/USD 1.17, SEK 0.11, GBP 1.34. USD strengthening is a headwind.
6. **Forward-flow counterparty risk:** If institutional demand for Fair Financing receivables softens (credit cycle, regulatory change), Klarna retains more on-balance-sheet, increasing capital requirements and funding costs.

### 12. Source Freshness and Missing Data

**Used:**
- Q4 2025 Earnings Release (Feb 19, 2026) [IR Doc PDF]: Primary financial data source — full P&L, balance sheet, cash flow, consumer receivables breakdown, non-IFRS reconciliations, guidance. ✅ Analyzed.
- Q4 2025 Press Release (Feb 19, 2026) [IR Doc PDF]: Supplemental highlights. ✅ Analyzed.
- Q4 2025 Investor Presentation (Feb 19, 2026) [IR Doc PDF]: Guidance vs actuals table, banking consumer engagement data, vintage charge-off curves. ✅ Analyzed.

**Not available / limitations:**
- Management Q&A webcast: Not accessed. Qualitative commentary on credit quality, partnership specifics, and 2026 prioritization from Q&A not reflected. ⚠️ Not analyzed.
- External sell-side consensus: No Bloomberg, FactSet, or broker estimate data available. All beat/miss analysis is vs company-issued guidance only. ❌ Not available.
- 20-F annual report: Filed February 26, 2026 but not analyzed. ECL model methodology, capital adequacy disclosures, geographic P&L not reflected. ⚠️ Not analyzed.
- Q3'25 TMD guidance vs actual: Not in provided documents. Would clarify whether the TMD miss pattern predates Q4. ❌ Not available.
- Current stock price and market cap: Not available. No price target or trading multiple analysis possible. ❌ Not available.

Data confidence class: high. Source freshness: 82/100 — core earnings pack is recent enough for a cockpit, but Q1 is the next proof point. All numbers are from company-issued documents as noted. No figures sourced from recollection or training data estimates. Where data is inferred, calculation methodology is stated inline.

=== END OF EXAMPLE — NOW PRODUCE THE SAME DEPTH AND QUALITY FOR THE COMPANY BELOW ===
`;
