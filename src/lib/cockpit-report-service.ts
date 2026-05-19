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

function isCachedReportUsable(report: CockpitReport): boolean {
  if (report.kpiBand.length === 0) return false;
  if (report.scenarios.length < 4) return false;
  if (report.sourceLibrary.length === 0) return false;
  if (report.thesisQuadrant.marketLikes.length === 0) return false;
  if (report.fullMemo.length < 3000) return false;
  return true;
}

async function deleteCachedReport(companyId: string): Promise<void> {
  try {
    await prisma.cockpitCache.delete({ where: { companyId } });
    console.warn('[cockpit-service] deleted stale/thin cache row', { companyId });
  } catch {
    // row may not exist — ignore
  }
}

async function getCachedReport(companyId: string): Promise<CockpitReport | null> {
  try {
    const row = await prisma.cockpitCache.findUnique({
      where: { companyId },
    });

    if (row === null) return null;
    if (!isCacheValid(row.updatedAt)) {
      await deleteCachedReport(companyId);
      return null;
    }

    const report = JSON.parse(row.data) as CockpitReport;

    if (!isCachedReportUsable(report)) {
      await deleteCachedReport(companyId);
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

  const isThinReport =
    report.fullMemo.length < 3000 ||
    report.scenarios.length < 4 ||
    report.sourceLibrary.length === 0;

  if (isThinReport) {
    console.warn(
      '[cockpit-service] Quality gate: thin synthesis result — fullMemo:',
      report.fullMemo.length,
      'scenarios:',
      report.scenarios.length,
      'sources:',
      report.sourceLibrary.length,
      '— not caching; retry with more IR docs'
    );
    // Do not cache thin results — return them but warn
  } else {
    await setCachedReport(companyId, report);
  }

  return { report, cached: false };
}
