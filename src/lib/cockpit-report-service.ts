import { prisma } from "@/lib/db";
import { runCockpitEngine } from "@/lib/cockpit-engine";
import { synthesizeCockpit } from "@/lib/cockpit-narrative";
import type { CockpitReport } from "@/lib/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeCompanyId(company: string): string {
  return company.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function isCacheValid(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() < CACHE_TTL_MS;
}

async function getCachedReport(companyId: string): Promise<CockpitReport | null> {
  try {
    const row = await prisma.cockpitCache.findUnique({
      where: { companyId },
    });

    if (row === null) return null;
    if (!isCacheValid(row.updatedAt)) return null;

    const report = JSON.parse(row.data) as CockpitReport;
    if (report.fullMemo.includes('Analysis memo not available due to data synthesis error')) {
      return null;
    }

    return report;
  } catch (error: unknown) {
    console.error("[cockpit-service] cache read failed", { companyId, error: String(error) });
    return null;
  }
}

async function setCachedReport(companyId: string, report: CockpitReport): Promise<void> {
  try {
    await prisma.cockpitCache.upsert({
      where: { companyId },
      create: {
        id: companyId,
        companyId,
        data: JSON.stringify(report),
      },
      update: {
        data: JSON.stringify(report),
      },
    });
  } catch (error: unknown) {
    console.error("[cockpit-service] cache write failed", { companyId, error: String(error) });
  }
}

export async function getCockpitReport(company: string): Promise<{
  report: CockpitReport;
  cached: boolean;
}> {
  const companyId = normalizeCompanyId(company);
  const cachedReport = await getCachedReport(companyId);

  if (cachedReport !== null) {
    return { report: cachedReport, cached: true };
  }

  const cockpitData = await runCockpitEngine(company);
  const report = await synthesizeCockpit(cockpitData);
  await setCachedReport(companyId, report);

  return { report, cached: false };
}
