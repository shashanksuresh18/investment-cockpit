import { createAnthropicClient } from '@/lib/anthropic-client';
import type {
  ApiResult,
  MarketResearch,
  SectorComp,
  FmpData,
  FinnhubData,
  SecEdgarData,
  ExaDeepData,
} from '@/lib/types';

const client = createAnthropicClient();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

function buildMarketContext(
  company: string,
  ticker: string | null,
  fmp: FmpData | null,
  finnhub: FinnhubData | null,
  sec: SecEdgarData | null,
  exaDeep: ExaDeepData | null
): string {
  const parts: string[] = [`Company: ${company}${ticker ? ` (${ticker})` : ''}`];

  // Sector from SEC SIC
  if (sec?.companyInfo) {
    const info = sec.companyInfo;
    if (info.sic) {
      parts.push(`SIC: ${info.sic} — ${info.sicDescription}`);
    }
  }

  // Peer comps from FMP
  if (fmp?.peers && fmp.peers.length > 0) {
    const header = 'FMP Peers:';
    const rows = fmp.peers.map(
      (p) =>
        `  ${p.symbol} (${p.companyName}): mktCap=${p.marketCap ? `$${(p.marketCap / 1e9).toFixed(1)}B` : 'N/A'} EV/EBITDA=${p.evToEbitda?.toFixed(1) ?? 'N/A'}x PE=${p.peRatio?.toFixed(1) ?? 'N/A'}x revGrowth=${p.revenueGrowth ? `${(p.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}`
    );
    parts.push([header, ...rows].join('\n'));
  }

  // Finnhub basic financials for the subject company
  if (finnhub?.basicFinancials?.metric) {
    const m = finnhub.basicFinancials.metric;
    const lines = ['Subject company Finnhub metrics:'];
    if (m.marketCapitalization) lines.push(`  Mkt Cap: $${(m.marketCapitalization / 1000).toFixed(1)}B`);
    if (m.revenueGrowthTTMYoy) lines.push(`  Rev Growth YoY: ${(m.revenueGrowthTTMYoy * 100).toFixed(1)}%`);
    if (m.evEbitdaTTM) lines.push(`  EV/EBITDA TTM: ${m.evEbitdaTTM.toFixed(1)}x`);
    if (m.peTTM) lines.push(`  P/E TTM: ${m.peTTM.toFixed(1)}x`);
    if (m.netMarginTTM) lines.push(`  Net Margin TTM: ${(m.netMarginTTM * 100).toFixed(1)}%`);
    if (lines.length > 1) parts.push(lines.join('\n'));
  }

  // FMP historical multiples (trend)
  if (fmp?.historicalMultiples && fmp.historicalMultiples.length > 0) {
    const rows = fmp.historicalMultiples.slice(0, 3).map(
      (m) =>
        `  ${m.date}: EV/EBITDA=${m.evToEbitda?.toFixed(1) ?? 'N/A'}x EV/Sales=${m.evToSales?.toFixed(1) ?? 'N/A'}x PE=${m.peRatio?.toFixed(1) ?? 'N/A'}x`
    );
    parts.push(['Historical multiples:', ...rows].join('\n'));
  }

  // Exa deep research
  if (exaDeep) {
    parts.push(`Exa deep research:\n  ${exaDeep.overview}`);
    if (exaDeep.competitors.length > 0) {
      parts.push(`  Competitors: ${exaDeep.competitors.join(', ')}`);
    }
    if (exaDeep.recentNews) {
      parts.push(`  Recent developments: ${exaDeep.recentNews}`);
    }
  }

  // Finnhub recent news
  if (finnhub?.news && finnhub.news.length > 0) {
    const headlines = finnhub.news.slice(0, 4).map((n) => `  - ${n.headline}`);
    parts.push(['Sector/company news:', ...headlines].join('\n'));
  }

  return parts.join('\n\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((i) => typeof i === 'string');
}

function parseSectorComp(value: unknown): SectorComp | null {
  if (!isRecord(value)) return null;
  const ticker = typeof value['ticker'] === 'string' ? value['ticker'] : '';
  const name = typeof value['name'] === 'string' ? value['name'] : ticker;
  if (!ticker) return null;
  return {
    ticker,
    name,
    evRevenue: typeof value['evRevenue'] === 'string' ? value['evRevenue'] : null,
    evEbitda: typeof value['evEbitda'] === 'string' ? value['evEbitda'] : null,
    pe: typeof value['pe'] === 'string' ? value['pe'] : null,
    revenueGrowth:
      typeof value['revenueGrowth'] === 'string' ? value['revenueGrowth'] : null,
    note: typeof value['note'] === 'string' ? value['note'] : '',
  };
}

function parseMarketResearch(text: string): MarketResearch | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1]! : text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const tradingCompsRaw = Array.isArray(parsed['tradingComps'])
    ? parsed['tradingComps']
    : [];
  const tradingComps: SectorComp[] = tradingCompsRaw
    .map(parseSectorComp)
    .filter((c): c is SectorComp => c !== null);

  return {
    sector: typeof parsed['sector'] === 'string' ? parsed['sector'] : 'Unknown',
    sectorOverview:
      typeof parsed['sectorOverview'] === 'string' ? parsed['sectorOverview'] : '',
    competitiveLandscape:
      typeof parsed['competitiveLandscape'] === 'string'
        ? parsed['competitiveLandscape']
        : '',
    positioningVsPeers:
      typeof parsed['positioningVsPeers'] === 'string'
        ? parsed['positioningVsPeers']
        : '',
    tradingComps,
    thematicTailwinds: isStringArray(parsed['thematicTailwinds'])
      ? parsed['thematicTailwinds']
      : [],
    thematicHeadwinds: isStringArray(parsed['thematicHeadwinds'])
      ? parsed['thematicHeadwinds']
      : [],
    sourcedFrom: isStringArray(parsed['sourcedFrom']) ? parsed['sourcedFrom'] : [],
  };
}

export async function fetchMarketResearch(
  company: string,
  ticker: string | null,
  fmp: FmpData | null,
  finnhub: FinnhubData | null,
  sec: SecEdgarData | null,
  exaDeep: ExaDeepData | null
): Promise<ApiResult<MarketResearch>> {
  const hasSufficientData =
    fmp !== null || finnhub !== null || exaDeep !== null;

  if (!hasSufficientData) {
    return {
      success: false,
      error: 'Insufficient data for market research',
    };
  }

  const context = buildMarketContext(company, ticker, fmp, finnhub, sec, exaDeep);

  const marketSystem =
    'You are a senior sector analyst at a top-tier investment bank. Produce structured market research from available data. Do not fabricate numbers - mark as "N/A" if unknown. If source data is thin, produce a short honest output. A short accurate response is better than a long fabricated one. Return only a JSON object in ```json``` fences.';

  const marketPrompt = `Produce structured market research for ${company} using the data below.

Return a JSON object with EXACTLY these fields:

{
  "sector": "<sector name, e.g. Fintech / Payments>",
  "sectorOverview": "For sector size, growth rate, and market dynamics: report ONLY figures explicitly present in the source data below. If any of these are absent from the input, write exactly 'N/A - not in source data' for that field. Do not use general knowledge to fill gaps.",
  "competitiveLandscape": "<2-3 sentences on who the key players are and how they compete>",
  "positioningVsPeers": "<2-3 sentences on how ${company} is positioned vs competitors — differentiation, moat, weakness>",
  "tradingComps": [
    {
      "ticker": "<ticker>",
      "name": "<company name>",
      "evRevenue": "<e.g. 8.2x or N/A>",
      "evEbitda": "<e.g. 22.1x or N/A>",
      "pe": "<e.g. 31.5x or N/A>",
      "revenueGrowth": "<e.g. +18% or N/A>",
      "note": "<one-phrase positioning note>"
    },
    ...one entry per peer in the data, up to 5...
  ],
  "thematicTailwinds": ["<specific sector or macro tailwind>", ...3-5 items],
  "thematicHeadwinds": ["<specific sector or macro headwind>", ...3-5 items],
  "sourcedFrom": ["<source tag>", ...]
}

DATA:
${context}`;

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
            { role: 'system', content: marketSystem },
            { role: 'user', content: marketPrompt },
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
        system: marketSystem,
        messages: [{ role: 'user', content: marketPrompt }],
      });
      const content = response.content[0];
      if (content?.type !== 'text') {
        return { success: false, error: 'Claude returned non-text response' };
      }
      responseText = content.text;
    }

    const research = parseMarketResearch(responseText);
    if (research === null) {
      return { success: false, error: 'Could not parse market research JSON' };
    }

    return { success: true, data: research };
  } catch (error: unknown) {
    return {
      success: false,
      error: `Market research call failed: ${String(error)}`,
    };
  }
}
