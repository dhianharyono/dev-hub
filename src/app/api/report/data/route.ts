import { NextResponse } from 'next/server';
import { getLiveReportData } from '@/lib/report-live';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number.isFinite(Number(searchParams.get('days'))) ? Number(searchParams.get('days')) : 0;
    const data = getLiveReportData(days);
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
