import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/http';
import { generateReleaseNote } from '@/lib/release-note/generate';

export const dynamic = 'force-dynamic';

const Body = z.object({
  projectId: z.number().int().positive(),
  releaseTitle: z.string().trim().min(1),
  service: z.string().trim().optional(),
  databaseName: z.string().trim().nullable().optional(),
  mrIids: z.array(z.number().int().positive()).min(1),
  targetBranch: z.string().trim().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const result = await generateReleaseNote(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
