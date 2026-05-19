import type { SourceLibraryProps } from "@/lib/types";

function scoreBadge(score: number) {
  if (score >= 75) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (score >= 50) return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-red-400/30 bg-red-400/10 text-red-100";
}

function statusIcon(status: "analyzed" | "not_analyzed" | "partial") {
  if (status === "analyzed") return "✅";
  if (status === "partial") return "⚠️";
  return "❌";
}

export default function SourceLibrary({ sources }: SourceLibraryProps) {
  if (sources.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-normal text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Publisher</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Freshness</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sources.map((source) => (
              <tr key={`${source.title}-${source.url}`}>
                <td className="max-w-xs px-4 py-3 font-medium text-white">{source.title}</td>
                <td className="px-4 py-3 text-zinc-300">{source.publisher}</td>
                <td className="px-4 py-3 text-zinc-300">{source.publicationDate}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-xs ${scoreBadge(source.freshnessScore)}`}>
                    {source.freshnessScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-xs ${scoreBadge(source.confidenceScore)}`}>
                    {source.confidenceScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300 underline-offset-4 hover:underline"
                  >
                    Open
                  </a>
                </td>
                <td className="px-4 py-3 text-zinc-300">{statusIcon(source.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
