import { NextResponse } from 'next/server';
import { z } from 'zod';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  projectId: z.number(),
  sourceBranch: z.string().min(1),
  targetBranch: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  removeSourceBranch: z.boolean().optional().default(true),
  assigneeId: z.number().nullable().optional(),
  reviewerId: z.number().nullable().optional(),
});

export interface CreateMrResponse {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
}

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());

    const mrPayload: Record<string, unknown> = {
      source_branch: b.sourceBranch,
      target_branch: b.targetBranch,
      title: b.title,
      description: b.description,
      remove_source_branch: b.removeSourceBranch,
    };

    if (b.assigneeId) {
      mrPayload.assignee_id = b.assigneeId;
      mrPayload.assignee_ids = [b.assigneeId];
    }

    if (b.reviewerId) {
      mrPayload.reviewer_ids = [b.reviewerId];
    }

    const result = await gl<CreateMrResponse>(`/projects/${b.projectId}/merge_requests`, {
      method: 'POST',
      body: JSON.stringify(mrPayload),
    });

    return NextResponse.json({ ok: true, mr: result });
  } catch (e) {
    return errorResponse(e);
  }
}
