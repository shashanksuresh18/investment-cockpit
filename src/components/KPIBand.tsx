import type { KPIBandProps } from "@/lib/types";

export default function KPIBand({ kpiBand }: KPIBandProps) {
  if (kpiBand.length === 0) return null;

  return (
    <section className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {kpiBand.map((kpi) => (
          <article
            key={`${kpi.metric}-${kpi.value}`}
            className="w-64 rounded-lg border border-white/10 bg-zinc-900/80 p-5"
          >
            <div className="text-xs font-medium uppercase tracking-normal text-zinc-500">{kpi.metric}</div>
            <div className="mt-3 text-2xl font-semibold text-white">{kpi.value}</div>
            <p className="mt-2 text-sm leading-5 text-zinc-400">{kpi.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
