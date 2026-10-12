import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, mrIid, discussionId, comment } = body;

    if (!projectId || !mrIid || !discussionId || !comment?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Parameter projectId, mrIid, discussionId, dan comment wajib diisi.' },
        { status: 400 },
      );
    }

    const res = await gl(
      `/projects/${projectId}/merge_requests/${mrIid}/discussions/${discussionId}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ body: comment.trim() }),
      },
    );

    return NextResponse.json({ ok: true, note: res });
  } catch (e) {
    return errorResponse(e);
  }
}
