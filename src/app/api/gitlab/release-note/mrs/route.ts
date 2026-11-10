import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/http';
import {
  getProjectInfo,
  listMergedMrs,
} from '@/lib/release-note/generate';

export const dynamic = 'force-dynamic';

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.');

const Body = z
  .object({
    projectId: z.number().int().positive(),
    since: DateString,
    until: DateString,
  })
  .refine((body) => new Date(body.since) <= new Date(body.until), {
    message: 'Tanggal awal tidak boleh setelah tanggal akhir.',
  });

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const [project, mrs] = await Promise.all([
      getProjectInfo(body.projectId),
      listMergedMrs(body.projectId, body.since, body.until),
    ]);
    return NextResponse.json({ ok: true, project, mrs });
  } catch (e) {
    return errorResponse(e);
  }
}
