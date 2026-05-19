import CockpitPageClient from "@/components/CockpitPageClient";
import { getCockpitReport } from "@/lib/cockpit-report-service";
import type { CockpitReport } from "@/lib/types";

type PageProps = {
  readonly searchParams?: Promise<{
    readonly company?: string | string[];
  }>;
};

function getCompanyParam(company: string | string[] | undefined): string {
  if (Array.isArray(company)) return company[0]?.trim() ?? "";
  return company?.trim() ?? "";
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = getCompanyParam(resolvedSearchParams?.company);
  let initialReport: CockpitReport | null = null;
  let initialError: string | null = null;

  if (initialQuery.length > 0) {
    try {
      const result = await getCockpitReport(initialQuery);
      initialReport = result.report;
    } catch (error: unknown) {
      console.error("[cockpit-page] initial report failed", {
        company: initialQuery,
        error: String(error),
      });
      initialError = error instanceof Error ? error.message : "Unable to build cockpit report";
    }
  }

  return (
    <CockpitPageClient
      initialQuery={initialQuery}
      initialReport={initialReport}
      initialError={initialError}
    />
  );
}
