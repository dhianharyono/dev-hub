import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/http';
import { getReleaseNote } from '@/lib/release-note/notes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const ref = Number(new URL(request.url).searchParams.get('ref'));
  if (!Number.isInteger(ref) || ref <= 0) {
    return NextResponse.json({ error: 'Nomor release note tidak valid.' }, { status: 400 });
  }

  try {
    const note = await getReleaseNote(ref);
    if (!note) {
      return NextResponse.json(
        { error: `Release note #${ref} tidak ditemukan.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ note });
  } catch (error) {
    return errorResponse(error);
  }
}
