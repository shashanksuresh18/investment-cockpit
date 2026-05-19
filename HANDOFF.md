# Investment Cockpit — Handoff Notes

Last updated: 2026-05-19

## Last Commits

- `48713bb` feat: add Klarna V2 few-shot example to synthesis prompt
- This session: fix synthesis model config, split few-shot, add quality gate, DeepSeek fallback, route timeout

## What Works

- **Data collection (cockpit-engine):** FMP, Finnhub, SEC EDGAR, Companies House, GLEIF, Exa deep research, IR document discovery, PDF analysis, earnings-research pre-analysis, market-research pre-analysis — all run and populate for public U.S. companies.
- **Synthesis (cockpit-narrative):** Claude Opus 4.7 synthesis produces full 12-section memos. Confirmed working for Affirm: verdict "Watch", 7 KPIs, 4 scenarios, 10 sources, 17,058-char fullMemo.
- **Cache layer:** SQLite via Prisma, 24h TTL. Thin results (synthesis fallback) are NOT cached — will re-run on next request.
- **API:** POST `/api/cockpit` returns `{ report: CockpitReport, cached: boolean }`.

## What Was Fixed This Session

1. **Root cause of "empty synthesis":** The synthesis WAS working, but tests were accessing `result.verdict` on the response envelope instead of `result.report.verdict`. The CockpitResponse type wraps the report: `{ report: CockpitReport, cached: boolean }`.

2. **max_tokens increased:** `8192 → 16384` for synthesis. The 12-section fullMemo requires significant output tokens; 8192 was likely causing truncation on larger data inputs.

3. **Fallback model logic fixed:** Previously `break` fired after any API success even if JSON parsing failed. Now `continue` is used to try the next model (`claude-sonnet-4-6`) if JSON parse fails on `claude-opus-4-7`.

4. **KLARNA_FEW_SHOT extracted:** Moved from `cockpit-narrative.ts` (was ~1161 lines) to `src/lib/cockpit-few-shot.ts`. cockpit-narrative.ts is now ~540 lines.

5. **Quality gate added (soft):** After synthesis, if `fullMemo < 3000 chars || scenarios < 4 || sourceLibrary === 0`, the result is returned but NOT cached. Logs a warning. Does not throw — prevents breaking the API for data-thin companies.

6. **Route timeout added:** `export const maxDuration = 300` on `/api/cockpit` and `/api/debug` routes. Opus-4 with the full KLARNA_FEW_SHOT prompt takes 2-3 minutes for large inputs.

7. **DeepSeek V3 fallback:** `earnings-research.ts` and `market-research.ts` now check `DEEPSEEK_API_KEY`. If set, use DeepSeek V3 (`deepseek-chat`) via native fetch for ~10x cost reduction on intermediate layers. Falls back to `claude-sonnet-4-6` if not set.

8. **`.env.example` updated:** Added `DEEPSEEK_API_KEY=` with comment.

## Affirm Test Result (Post-Fix)

Cached result confirmed working:
- **verdict:** Watch
- **verdictDetail:** "Fundamentals are firing on every cylinder — four straight EPS beats and a credible path to GAAP profitability — but at 56x TTM P/E with the stock having run from ~$42 to ~$64, the upside/risk skew is no longer asymmetric."
- **kpiBand:** 7 items
- **scenarios:** 4 (Bull / Base / Bear / Kill)
- **sourceLibrary:** 10 sources
- **fullMemo:** 17,058 chars (substantive 12-section memo)
- **coreDebate:** Substantive paragraph on EPS beats vs valuation stretch

## Remaining Gaps

1. **IR document coverage for Affirm:** IR docs discovery via Exa may return 0 results for some companies. When `pdfExtracts` is empty, the synthesis relies only on FMP/Finnhub/SEC data — this produces thinner but still workable output.

2. **Sell-side consensus data:** Beat/miss analysis is vs company guidance only (FMP analystEstimates), not true consensus. No Bloomberg/FactSet integration. Would require a premium data vendor.

3. **Q&A webcast content:** Management call transcripts not ingested. Exa deep research partially compensates but misses quantitative guidance detail from Q&A.

4. **Private companies:** Limited support — no SEC EDGAR, no Finnhub fundamentals, no FMP peers. Exa + Companies House (UK) is the only data path.

5. **DeepSeek fallback untested in production:** The fallback is code-complete but DEEPSEEK_API_KEY is not set in `.env.local`. Needs API key from deepseek.com to activate.

## Next Session Priorities

1. **Transcript ingestion:** Add a Exa search for earnings call transcripts (search.exa.ai for "Affirm Q3 2025 earnings call transcript") and pipe the text into the synthesis prompt. This is the single highest-ROI improvement for memo quality.

2. **IR doc URL validation:** Some Exa-discovered IR URLs return 404 or paywalled content. Add a pre-flight HTTP HEAD check before attempting PDF download to skip dead URLs and reduce synthesis latency.

3. **Frontend display fix:** The cockpit UI likely accesses fields at the wrong path (same issue as the test — `result.verdict` vs `result.report.verdict`). Audit `src/app` components for CockpitResponse usage and fix to access `.report.*`.

## File Map

| File | Purpose |
|------|---------|
| `src/lib/cockpit-engine.ts` | Orchestrates all data collection, returns `CockpitData` |
| `src/lib/cockpit-narrative.ts` | Synthesizes `CockpitData → CockpitReport` via Claude Opus 4.7 |
| `src/lib/cockpit-few-shot.ts` | KLARNA_FEW_SHOT constant (target output quality example) |
| `src/lib/cockpit-report-service.ts` | Cache layer + quality gate; calls engine + narrative |
| `src/lib/datasources/earnings-research.ts` | Pre-analysis of earnings data via Claude/DeepSeek |
| `src/lib/datasources/market-research.ts` | Pre-analysis of market/sector data via Claude/DeepSeek |
| `src/app/api/cockpit/route.ts` | POST endpoint, maxDuration=300 |
| `src/app/api/debug/route.ts` | GET debug endpoint for synthesis testing |
| `prisma/dev.db` | SQLite cache (delete to force re-run) |
