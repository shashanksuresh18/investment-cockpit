import AnalystConsensus from "@/components/AnalystConsensus";
import FullMemo from "@/components/FullMemo";
import KPIBand from "@/components/KPIBand";
import PeerCompTable from "@/components/PeerCompTable";
import ScenarioGrid from "@/components/ScenarioGrid";
import ScoreCards from "@/components/ScoreCards";
import SourceLibrary from "@/components/SourceLibrary";
import ThesisQuadrant from "@/components/ThesisQuadrant";
import VerdictHeader from "@/components/VerdictHeader";
import type { CockpitViewProps, ValuationData } from "@/lib/types";

function money(value: number | null) {
  if (value === null) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000_000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

function multiple(value: number | null) {
  if (value === null) return "n/a";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}x`;
}

function percent(value: number | null) {
  if (value === null) return "n/a";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

function ValuationPanel({ valuation }: Readonly<{ valuation: ValuationData }>) {
  const items = [
    ["Market Cap", money(valuation.marketCap)],
    ["Enterprise Value", money(valuation.enterpriseValue)],
    ["EV/Revenue", multiple(valuation.evRevenue)],
    ["EV/EBITDA", multiple(valuation.evEbitda)],
    ["P/E", multiple(valuation.pe)],
    ["52W Range", `${money(valuation.week52Low)} - ${money(valuation.week52High)}`],
    ["Analyst Median PT", money(valuation.analystMedianPT)],
    ["Analyst Upside", percent(valuation.analystUpside)],
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-zinc-900/80 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="mt-2 text-lg font-semibold text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function CockpitView({ report }: CockpitViewProps) {
  return (
    <div className="space-y-8">
      <VerdictHeader
        company={report.company}
        ticker={report.ticker}
        exchange={report.exchange}
        verdict={report.verdict}
        verdictDetail={report.verdictDetail}
        price={report.price}
        priceAsOf={report.priceAsOf}
        lastCoreSourceDate={report.lastCoreSourceDate}
      />

      <ScoreCards scores={report.scores} />
      <KPIBand kpiBand={report.kpiBand} />

      <Section title="Core Debate">
        <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-5">
          <p className="text-base leading-7 text-zinc-200">{report.coreDebate}</p>
        </div>
      </Section>

      <Section title="Thesis Quadrant">
        <ThesisQuadrant quadrant={report.thesisQuadrant} />
      </Section>

      <Section title="Scenario Grid">
        <ScenarioGrid scenarios={report.scenarios} />
      </Section>

      {report.valuation && (
        <Section title="Valuation">
          <ValuationPanel valuation={report.valuation} />
        </Section>
      )}

      <Section title="Peer Comparables">
        <PeerCompTable peerComps={report.peerComps} />
      </Section>

      {report.analystConsensus && (
        <Section title="Analyst View">
          <AnalystConsensus consensus={report.analystConsensus} />
        </Section>
      )}

      {report.missingData.length > 0 && (
        <Section title="Missing Data">
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
            <ul className="space-y-2 text-sm leading-6 text-amber-50">
              {report.missingData.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {report.nextCatalyst && (
        <Section title="Next Catalyst">
          <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-white">{report.nextCatalyst.eventName}</h3>
              <span className="text-sm text-zinc-400">{report.nextCatalyst.expectedDate}</span>
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-300 md:grid-cols-2">
              {report.nextCatalyst.watchItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      <Section title="Source Library">
        <SourceLibrary sources={report.sourceLibrary} />
      </Section>

      <FullMemo memo={report.fullMemo} />
    </div>
  );
}
