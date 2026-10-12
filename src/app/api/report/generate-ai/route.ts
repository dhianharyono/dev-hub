import { NextResponse } from 'next/server';
import { generateLiveReportAi, getCachedReportAiAnalysis } from '@/lib/report-live';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const aiResult = await generateLiveReportAi();
    return NextResponse.json({
      ok: true,
      data: aiResult,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET() {
  try {
    const cached = getCachedReportAiAnalysis();
    return NextResponse.json({
      ok: true,
      data: cached,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
