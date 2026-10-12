import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { projectId, mrIid, discussionId, resolved } = body;

    if (!projectId || !mrIid || !discussionId || resolved === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Parameter projectId, mrIid, discussionId, dan resolved wajib diisi.' },
        { status: 400 },
      );
    }

    const res = await gl(
      `/projects/${projectId}/merge_requests/${mrIid}/discussions/${discussionId}?resolved=${Boolean(resolved)}`,
      { method: 'PUT' },
    );

    return NextResponse.json({ ok: true, discussion: res });
  } catch (e) {
    return errorResponse(e);
  }
}
