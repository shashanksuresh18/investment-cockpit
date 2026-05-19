import type { FullMemoProps } from "@/lib/types";

function renderLine(line: string, index: number) {
  if (line.startsWith("### ")) {
    return <h4 key={index} className="mt-5 text-base font-semibold text-white">{line.slice(4)}</h4>;
  }

  if (line.startsWith("## ")) {
    return <h3 key={index} className="mt-6 text-lg font-semibold text-white">{line.slice(3)}</h3>;
  }

  if (line.startsWith("# ")) {
    return <h2 key={index} className="mt-6 text-xl font-semibold text-white">{line.slice(2)}</h2>;
  }

  if (line.startsWith("- ")) {
    return (
      <li key={index} className="ml-5 list-disc text-zinc-300">
        {line.slice(2)}
      </li>
    );
  }

  if (line.trim() === "") return <div key={index} className="h-3" />;

  return <p key={index} className="leading-7 text-zinc-300">{line}</p>;
}

export default function FullMemo({ memo }: FullMemoProps) {
  const lines = memo.trim().length > 0 ? memo.split(/\r?\n/) : ["Memo unavailable."];

  return (
    <details className="group rounded-lg border border-white/10 bg-zinc-900/80 p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-white">Full Memo</h2>
        <span className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10">
          <span className="group-open:hidden">Read full memo</span>
          <span className="hidden group-open:inline">Collapse memo</span>
        </span>
      </summary>
      <div className="grid grid-rows-[0fr] transition-all group-open:grid-rows-[1fr]">
        <div className="overflow-hidden">
        <div className="mt-5 max-w-none space-y-1 text-sm">
          {lines.map(renderLine)}
        </div>
        </div>
      </div>
    </details>
  );
}
