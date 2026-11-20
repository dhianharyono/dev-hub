import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/http';
import { getReleaseOptions } from '@/lib/release-deployment/project';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getReleaseOptions());
  } catch (error) {
    return errorResponse(error);
  }
}
