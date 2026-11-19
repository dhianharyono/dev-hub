import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/http';
import { getReleaseNotes } from '@/lib/release-note/notes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getReleaseNotes());
  } catch (error) {
    return errorResponse(error);
  }
}
