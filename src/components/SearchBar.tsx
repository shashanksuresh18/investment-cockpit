"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { SearchBarProps } from "@/lib/types";

export default function SearchBar({
  onSearch,
  isLoading = false,
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const trimmed = String(formData.get("company") ?? "").trim();
    if (trimmed.length === 0 || isLoading) return;
    setQuery(trimmed);
    onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-zinc-950/90 p-3 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="company"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search company or ticker"
          className="min-h-12 flex-1 rounded border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-400/60 focus:bg-white/10"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="min-h-12 rounded bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isLoading ? "Building cockpit..." : "Run cockpit"}
        </button>
      </div>
    </form>
  );
}
