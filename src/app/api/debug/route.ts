import { NextResponse } from 'next/server';
import { synthesizeCockpit } from '@/lib/cockpit-narrative';
import type { CockpitData } from '@/lib/types';

export const maxDuration = 300;

export async function GET(): Promise<NextResponse> {
  // Minimal mock CockpitData to test synthesis
  const mockData: CockpitData = {
    company: 'Affirm Holdings Inc',
    ticker: 'AFRM',
    exchange: 'NASDAQ',
    price: 64.41,
    priceAsOf: '2026-05-19',
    lastCoreSourceDate: '2026-05-15',
    dataConfidenceClass: 'medium',
    fmp: null,
    finnhub: null,
    sec: null,
    companiesHouse: null,
    gleif: null,
    exaDeep: null,
    irDocuments: [],
    pdfExtracts: [],
    earningsAnalysis: null,
    marketResearch: null,
  };

  try {
    const report = await synthesizeCockpit(mockData);
    return NextResponse.json({
      ok: true,
      verdict: report.verdict,
      kpiBandCount: report.kpiBand.length,
      scenariosCount: report.scenarios.length,
      sourceLibraryCount: report.sourceLibrary.length,
      fullMemoLength: report.fullMemo.length,
      fullMemoStart: report.fullMemo.substring(0, 100),
    });
  } catch (error: unknown) {
    return NextResponse.json({
      ok: false,
      error: String(error).substring(0, 500),
    });
  }
}
