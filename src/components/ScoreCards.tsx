import type { ScoreCardsProps } from "@/lib/types";

const labels = [
  ["Conviction", "conviction"],
  ["Data Confidence", "dataConfidence"],
  ["Source Freshness", "sourceFreshness"],
] as const;

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-400";
  if (score >= 50) return "bg-amber-300";
  return "bg-red-400";
}

export default function ScoreCards({ scores }: ScoreCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {labels.map(([label, key]) => {
        const item = scores[key];
        const score = Math.max(0, Math.min(100, item.score));

        return (
          <article key={key} className="rounded-lg border border-white/10 bg-zinc-900/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-sm font-medium text-zinc-300">{label}</h2>
              <span className="text-2xl font-semibold text-white">{score}/100</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${scoreTone(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{item.detail}</p>
          </article>
        );
      })}
    </section>
  );
}
