import { NextResponse } from 'next/server';
import { getLiveReportData } from '@/lib/report-live';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getLiveReportData();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
