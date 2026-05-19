import type { AnalystConsensusProps } from "@/lib/types";

const bars = [
  ["Strong Buy", "strongBuy", "bg-emerald-300"],
  ["Buy", "buy", "bg-emerald-500"],
  ["Hold", "hold", "bg-amber-300"],
  ["Sell", "sell", "bg-red-400"],
  ["Strong Sell", "strongSell", "bg-red-600"],
] as const;

function money(value: number | null) {
  if (value === null) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AnalystConsensus({ consensus }: AnalystConsensusProps) {
  const total = bars.reduce((sum, [, key]) => sum + consensus[key], 0);

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900/80 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Analyst Consensus</h2>
          <p className="mt-1 text-sm text-zinc-400">{consensus.consensusLabel} across {total} ratings</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-zinc-500">Median PT</div>
            <div className="font-semibold text-white">{money(consensus.medianPT)}</div>
          </div>
          <div>
            <div className="text-zinc-500">High</div>
            <div className="font-semibold text-white">{money(consensus.highPT)}</div>
          </div>
          <div>
            <div className="text-zinc-500">Low</div>
            <div className="font-semibold text-white">{money(consensus.lowPT)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {bars.map(([label, key, color]) => {
          const count = consensus[key];
          const width = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={key} className="grid grid-cols-[96px_1fr_32px] items-center gap-3 text-sm">
              <span className="text-zinc-400">{label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
              </div>
              <span className="text-right font-medium text-white">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
