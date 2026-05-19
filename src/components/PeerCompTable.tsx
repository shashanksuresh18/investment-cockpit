import type { PeerCompTableProps } from "@/lib/types";

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "n/a";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function formatMarketCap(value: number | null) {
  if (value === null) return "n/a";
  if (Math.abs(value) >= 1_000_000_000) return `$${formatNumber(value / 1_000_000_000)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${formatNumber(value / 1_000_000)}M`;
  return `$${formatNumber(value)}`;
}

export default function PeerCompTable({ peerComps }: PeerCompTableProps) {
  if (peerComps.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-normal text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Ticker</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Market Cap</th>
              <th className="px-4 py-3 font-medium">EV/Revenue</th>
              <th className="px-4 py-3 font-medium">EV/EBITDA</th>
              <th className="px-4 py-3 font-medium">P/E</th>
              <th className="px-4 py-3 font-medium">Rev Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {peerComps.map((peer, index) => (
              <tr key={`${peer.ticker}-${peer.companyName}`} className={index === 0 ? "bg-sky-400/10" : ""}>
                <td className="px-4 py-3 font-medium text-white">{peer.ticker}</td>
                <td className="px-4 py-3 text-zinc-300">{peer.companyName}</td>
                <td className="px-4 py-3 text-zinc-300">{formatMarketCap(peer.marketCap)}</td>
                <td className="px-4 py-3 text-zinc-300">{formatNumber(peer.evRevenue)}x</td>
                <td className="px-4 py-3 text-zinc-300">{formatNumber(peer.evEbitda)}x</td>
                <td className="px-4 py-3 text-zinc-300">{formatNumber(peer.pe)}x</td>
                <td className="px-4 py-3 text-zinc-300">{formatNumber(peer.revenueGrowth, "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
