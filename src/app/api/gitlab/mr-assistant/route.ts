import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMrDescription } from '@/lib/ai-assistant';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  title: z.string().optional(),
  branch: z.string().optional(),
  targetBranch: z.string().optional(),
  diff: z.string().optional(),
  commits: z.array(z.string()).optional(),
  targetStoryRef: z.number().nullable().optional(),
  targetStorySubject: z.string().nullable().optional(),
  targetTaskRef: z.number().nullable().optional(),
  targetTaskSubject: z.string().nullable().optional(),
  ticketType: z.enum(['task', 'story', 'both']).nullable().optional(),
  assignee: z.string().nullable().optional(),
  reviewer: z.string().nullable().optional(),
  projectSlug: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const result = await generateMrDescription(b);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
