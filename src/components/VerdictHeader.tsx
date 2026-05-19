import type { VerdictHeaderProps } from "@/lib/types";

const verdictStyles = {
  Buy: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  "Speculative Buy": "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  Watch: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  Sell: "border-red-400/40 bg-red-400/15 text-red-100",
  Avoid: "border-zinc-400/40 bg-zinc-400/15 text-zinc-100",
};

function formatPrice(price: number | null) {
  if (price === null) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function VerdictHeader({
  company,
  ticker,
  exchange,
  verdict,
  verdictDetail,
  price,
  priceAsOf,
  lastCoreSourceDate,
}: VerdictHeaderProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              {company}
            </h1>
            <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium uppercase tracking-normal text-zinc-300">
              {[ticker, exchange].filter(Boolean).join(" / ") || "Unlisted"}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-zinc-300">{verdictDetail}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <span
            className={`w-fit rounded-full border px-4 py-1.5 text-sm font-semibold ${verdictStyles[verdict]}`}
          >
            {verdict}
          </span>
          <div className="text-left lg:text-right">
            <div className="text-3xl font-semibold text-white">{formatPrice(price)}</div>
            <div className="mt-1 text-xs text-zinc-400">
              Price as of {priceAsOf ?? "unknown"} · Core source {lastCoreSourceDate ?? "unknown"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
