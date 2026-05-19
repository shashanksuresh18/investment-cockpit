# Investment Cockpit — Project Instructions

## What This Project Does
AI-powered **Investment Cockpit** generator. User enters any company name → system routes through 7 data sources → Claude synthesizes a structured analyst cockpit report matching the Klarna V2 Investment Cockpit format. Supports both public (US/UK/global) and private companies.

## Target Output Format
See `COCKPIT_SPEC.md` for the exact cockpit format spec with field-by-field breakdown.

## Tooling
- **Always use `npm`, not `yarn` or `pnpm`.**
- Framework: Next.js 15 (App Router, TypeScript strict mode)
- Styling: Tailwind CSS v4 only, no external component libraries
- Database: SQLite via Prisma (cache layer)
- AI: Anthropic Claude API (claude-sonnet-4-6 for synthesis)
- Deployment: Vercel

## Commands
```sh
npm run dev
npx tsc --noEmit
npm run lint
npx prisma db push
npx prisma studio
```

## Architecture Rules
- Claude API is SYNTHESIS layer only. Never a data source.
- Every number must trace to a structured data source.
- Web-search derived data → flag ★☆☆ low confidence.
- All API clients in `src/lib/datasources/` — one file per source.
- Every data source call wrapped in try/catch. Failures log and continue.
- Never silently swallow errors.
- Validate all external API responses before use.

## Data Source Waterfall (try in order)
1. **FMP** (Financial Modeling Prep) — price, market cap, EV, historical multiples, analyst estimates, peer comps
2. **Finnhub** (free, 60 calls/min) — live quote, analyst recs, news, basic financials
3. **SEC EDGAR** (free, no key) — US public filings, XBRL financial facts
4. **Companies House UK** (free) — UK company registry
5. **GLEIF** (free) — global legal entity lookup, ownership
6. **Exa Deep** — private company research (last resort for private cos)
7. **Claude API + web search** — thin-data companies only

## New Capabilities (not in source project)
- `src/lib/ir-documents.ts` — Exa search to find IR document URLs (earnings releases, presentations, 8-Ks)
- `src/lib/pdf-analyzer.ts` — Fetch PDFs → Claude Files API for extraction
- `src/lib/cockpit-engine.ts` — waterfall assembly → structured cockpit data
- `src/lib/cockpit-narrative.ts` — Claude synthesis prompt generating all cockpit sections

## Confidence Rating Logic
```
★★★ HIGH   — SEC filing data present (XBRL financials parsed)
★★☆ MEDIUM — Market API data (FMP/Finnhub/Companies House/GLEIF matched)
★☆☆ LOW    — Web-search derived only (Claude fallback was primary source)
```

## Cockpit Scores (0-100)
- **Conviction** — how strong the investment case is (based on data quality + thesis clarity)
- **Data Confidence** — completeness of data sources (SEC filing = high, web-only = low)
- **Source Freshness** — recency of primary sources (today = 100, 1yr old = ~40)

## Source Project Reference
All 6 datasource clients were ported from:
`C:\Users\USER\Desktop\finance_intelligence\.claude\worktrees\modest-hermann-9df904\src\lib\datasources\`

Same patterns apply: `ApiResult<T>` return type, try/catch, no silent failures.

## Ported Files (do not rewrite, already correct)
- `src/lib/datasources/finnhub.ts`
- `src/lib/datasources/fmp.ts`
- `src/lib/datasources/sec-edgar.ts`
- `src/lib/datasources/companies-house.ts`
- `src/lib/datasources/gleif.ts`
- `src/lib/datasources/exa-deep.ts`
- `src/lib/company-search.ts`

## Code Style (TypeScript)
- Prefer `type` over `interface`
- **Never use `enum`** — use string literal unions
- Keep functions small and composable
- File organization: 200-400 lines typical, 800 max
- Server components by default; `"use client"` only when needed
- All API routes return typed JSON responses
- No `any` types. TypeScript strict mode everywhere.
- No `console.log` in production

## Forbidden Patterns
- No `any` type
- No `enum` — string literal unions only
- No object/array mutation
- No API keys in source (use .env.local)
- No Claude API as data source — only synthesis
- No `--no-verify` on commits

## Verification Requirements
- After building engine: test with "Apple" (US public), "Revolut" (UK private), "Klarna" (NYSE:KLAR)
- After UI: open browser, confirm all cockpit sections render
- Run typecheck + lint before every commit

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Search UI + cockpit view
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── cockpit/
│           └── route.ts            # POST /api/cockpit
├── lib/
│   ├── datasources/
│   │   ├── finnhub.ts
│   │   ├── fmp.ts
│   │   ├── sec-edgar.ts
│   │   ├── companies-house.ts
│   │   ├── gleif.ts
│   │   └── exa-deep.ts
│   ├── company-search.ts
│   ├── ir-documents.ts             # NEW: Exa → IR PDF URL discovery
│   ├── pdf-analyzer.ts             # NEW: Claude Files API PDF parsing
│   ├── cockpit-engine.ts           # NEW: waterfall + data assembly
│   ├── cockpit-narrative.ts        # NEW: Claude synthesis
│   ├── confidence.ts               # Score computation
│   ├── types.ts                    # ALL shared types (source of truth)
│   └── db.ts                       # Prisma client
└── components/
    ├── SearchBar.tsx
    ├── CockpitView.tsx
    ├── VerdictHeader.tsx           # Verdict + price + last source date
    ├── ScoreCards.tsx              # Conviction/DataConf/Freshness 0-100
    ├── KPIBand.tsx                 # Key metrics table
    ├── CoreDebate.tsx              # Central debate paragraph
    ├── ThesisQuadrant.tsx          # Likes/Dislikes/PricedIn/Pressure
    ├── ScenarioGrid.tsx            # Bull/Base/Bear/Kill cards
    ├── ValuationPanel.tsx          # Price, market cap, EV, multiples
    ├── PeerCompTable.tsx           # 5 peers × 5 multiples live data
    ├── AnalystConsensus.tsx        # Buy/Hold/Sell + median PT
    ├── QuarterlyFinancials.tsx     # Historical income statement
    ├── MissingData.tsx
    ├── NextCatalyst.tsx
    ├── SourceLibrary.tsx           # Sources table with freshness/confidence
    └── FullMemo.tsx                # Expandable 12-section memo
```

## API Keys Needed
```
ANTHROPIC_API_KEY      # Claude API (required)
FINNHUB_API_KEY        # Market data (required)
EXA_API_KEY            # Private co research + IR doc discovery (required)
FMP_API_KEY            # Valuation depth — price, multiples, peers (recommended)
COMPANIES_HOUSE_API_KEY # UK registry (recommended)
SEC_EDGAR_USER_AGENT   # Your email (required for SEC)
DATABASE_URL           # SQLite: file:./prisma/dev.db
```
