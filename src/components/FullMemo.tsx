import type { FullMemoProps } from "@/lib/types";
import type { ReactNode } from "react";

// ── Inline markdown: **bold**, *italic*, [text](url) ──────────────────────────
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Matches **bold**, *italic*, [label](url) in order
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]?.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>);
    } else if (match[1]?.startsWith("*")) {
      parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    } else if (match[4] && match[5]) {
      parts.push(
        <a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer"
          className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
          {match[4]}
        </a>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Table rendering ────────────────────────────────────────────────────────────
function isTableRow(line: string) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function isSeparatorRow(line: string) {
  return isTableRow(line) && /^\|[-| :]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line.trim().slice(1, -1).split("|").map((c) => c.trim());
}

function renderTable(rows: string[], startIndex: number): ReactNode {
  const nonSep = rows.filter((r) => !isSeparatorRow(r));
  const [header, ...body] = nonSep;
  const headerCells = header ? parseTableRow(header) : [];

  return (
    <div key={startIndex} className="my-3 overflow-x-auto rounded border border-white/10">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/5">
          <tr>
            {headerCells.map((cell, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-white whitespace-nowrap">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-t border-white/5 odd:bg-white/[0.02]">
              {parseTableRow(row).map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-zinc-300">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Line-level renderer ────────────────────────────────────────────────────────
function renderLine(line: string, index: number): ReactNode {
  if (line.startsWith("### ")) {
    return (
      <h4 key={index} className="mt-5 text-sm font-semibold text-white">
        {renderInline(line.slice(4))}
      </h4>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h3 key={index} className="mt-6 text-base font-semibold text-white">
        {renderInline(line.slice(3))}
      </h3>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h2 key={index} className="mt-6 text-lg font-semibold text-white">
        {renderInline(line.slice(2))}
      </h2>
    );
  }
  // Bullet: "- " or "* " (Claude uses both)
  if (/^[-*] /.test(line)) {
    return (
      <li key={index} className="ml-5 list-disc text-zinc-300 leading-7">
        {renderInline(line.slice(2))}
      </li>
    );
  }
  // Numbered list: "1. " "2. " etc.
  if (/^\d+\. /.test(line)) {
    const text = line.replace(/^\d+\. /, "");
    return (
      <li key={index} className="ml-5 list-decimal text-zinc-300 leading-7">
        {renderInline(text)}
      </li>
    );
  }
  if (line.trim() === "") return <div key={index} className="h-3" />;

  return (
    <p key={index} className="leading-7 text-zinc-300">
      {renderInline(line)}
    </p>
  );
}

// ── Group consecutive table rows, render the rest line-by-line ─────────────────
function renderLines(lines: string[]): ReactNode[] {
  const output: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (isTableRow(line)) {
      const tableRows: string[] = [];
      while (i < lines.length && isTableRow(lines[i]!)) {
        tableRows.push(lines[i]!);
        i++;
      }
      output.push(renderTable(tableRows, output.length));
    } else {
      output.push(renderLine(line, i));
      i++;
    }
  }

  return output;
}

// ── Component ──────────────────────────────────────────────────────────────────
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
            {renderLines(lines)}
          </div>
        </div>
      </div>
    </details>
  );
}
