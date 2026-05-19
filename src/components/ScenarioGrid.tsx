import type { ScenarioGridProps } from "@/lib/types";

const scenarioStyles = {
  Bull: "border-emerald-400/25 bg-emerald-400/10",
  Base: "border-sky-400/25 bg-sky-400/10",
  Bear: "border-amber-300/25 bg-amber-300/10",
  Kill: "border-red-400/25 bg-red-400/10",
};

export default function ScenarioGrid({ scenarios }: ScenarioGridProps) {
  if (scenarios.length === 0) return null;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {scenarios.map((scenario) => (
        <details
          key={scenario.name}
          className={`group rounded-lg border p-5 ${scenarioStyles[scenario.name]}`}
        >
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">{scenario.name}</h2>
              {scenario.priceRange && (
                <span className="text-xs text-zinc-400 group-open:hidden">Range</span>
              )}
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{scenario.stance}</div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{scenario.summary}</p>
          </summary>
          {scenario.priceRange && (
            <div className="mt-4 rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
              Price range: {scenario.priceRange}
            </div>
          )}
        </details>
      ))}
    </section>
  );
}
