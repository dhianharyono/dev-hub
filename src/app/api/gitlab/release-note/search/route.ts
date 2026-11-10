import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/http';
import { searchReleaseCandidates } from '@/lib/release-note/search';

export const dynamic = 'force-dynamic';

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.');

const Body = z
  .object({
    projectId: z.number().int().positive(),
    title: z.string().trim().min(1),
    since: DateString,
    until: DateString,
    targetBranch: z.string().trim().min(1).optional(),
  })
  .refine((body) => new Date(body.since) <= new Date(body.until), {
    message: 'Tanggal awal tidak boleh setelah tanggal akhir.',
  });

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const result = await searchReleaseCandidates(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
