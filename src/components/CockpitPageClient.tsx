"use client";

import { useState } from "react";
import CockpitView from "@/components/CockpitView";
import SearchBar from "@/components/SearchBar";
import type { CockpitReport, CockpitResponse } from "@/lib/types";

export default function CockpitPageClient({
  initialQuery = "",
  initialReport = null,
  initialError = null,
}: Readonly<{
  initialQuery?: string;
  initialReport?: CockpitReport | null;
  initialError?: string | null;
}>) {
  const [report, setReport] = useState<CockpitReport | null>(initialReport);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSearch(query: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cockpit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: query }),
      });

      const json = (await res.json()) as CockpitResponse | { error?: string; detail?: string };

      if (!res.ok || !("report" in json)) {
        const message =
          "detail" in json && typeof json.detail === "string"
            ? json.detail
            : "error" in json && typeof json.error === "string"
              ? json.error
              : `Cockpit request failed with ${res.status}`;
        throw new Error(message);
      }

      setReport(json.report);
    } catch (error: unknown) {
      console.error("[cockpit] search failed", error);
      setError(error instanceof Error ? error.message : "Unable to build cockpit report");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-normal text-sky-300">Investment Cockpit</p>
          <h1 className="text-3xl font-semibold text-white">Diligence-grade equity briefing</h1>
        </header>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={initialQuery} />
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
        {report !== null && <CockpitView report={report} />}
      </div>
    </main>
  );
}
