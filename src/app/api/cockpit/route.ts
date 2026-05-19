import { NextRequest, NextResponse } from 'next/server';
import { getCockpitReport } from '@/lib/cockpit-report-service';
import type { CockpitRequest, CockpitResponse } from '@/lib/types';

// Allow up to 5 minutes for synthesis (Opus-4 with large prompts)
export const maxDuration = 300;

function validateRequest(body: unknown): body is CockpitRequest {
  if (typeof body !== 'object' || body === null) return false;
  const record = body as Record<string, unknown>;
  return typeof record['company'] === 'string' && record['company'].trim().length > 0;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!validateRequest(body)) {
    return NextResponse.json(
      { error: 'Missing required field: company (string)' },
      { status: 400 }
    );
  }

  const company = body.company.trim();
  try {
    const response: CockpitResponse = await getCockpitReport(company);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[cockpit-route] engine/synthesis failed', {
      company,
      error: String(error),
    });
    return NextResponse.json(
      { error: 'Failed to generate cockpit report', detail: String(error) },
      { status: 500 }
    );
  }
}
