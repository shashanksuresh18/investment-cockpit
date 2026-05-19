import type { ThesisQuadrantProps } from "@/lib/types";

const quadrants = [
  ["Market Likes", "marketLikes", "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"],
  ["Market Dislikes", "marketDislikes", "border-red-400/20 bg-red-400/10 text-red-100"],
  ["What Is Priced In", "whatIsPricedIn", "border-sky-400/20 bg-sky-400/10 text-sky-100"],
  ["Why Under Pressure", "whyUnderPressure", "border-amber-300/20 bg-amber-300/10 text-amber-100"],
] as const;

export default function ThesisQuadrant({ quadrant }: ThesisQuadrantProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {quadrants.map(([title, key, tone]) => (
        <article key={key} className={`rounded-lg border p-5 ${tone}`}>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-200">
            {quadrant[key].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
