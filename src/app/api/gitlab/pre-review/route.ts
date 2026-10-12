import { NextResponse } from 'next/server';
import { z } from 'zod';
import { preReviewCodeSecurity } from '@/lib/ai-assistant';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  codeOrDiff: z.string().min(5, 'Kode atau Git Diff minimal 5 karakter'),
  language: z.string().optional(),
  context: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const result = await preReviewCodeSecurity(b);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
