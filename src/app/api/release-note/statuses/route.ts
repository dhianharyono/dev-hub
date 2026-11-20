import { NextResponse } from 'next/server';
import { taiga, type TaigaStatus } from '@/lib/taiga';
import { errorResponse } from '@/lib/http';
import { RELEASE_NOTE_PROJECT_ID } from '@/lib/release-note/notes';

export const dynamic = 'force-dynamic';

/** Status yang bisa dipakai saat mengedit release note dan task deployment. */
export async function GET() {
  try {
    const [userStory, task] = await Promise.all([
      taiga<TaigaStatus[]>(
        `/userstory-statuses?project=${RELEASE_NOTE_PROJECT_ID}`,
      ).catch(() => [] as TaigaStatus[]),
      taiga<TaigaStatus[]>(
        `/task-statuses?project=${RELEASE_NOTE_PROJECT_ID}`,
      ).catch(() => [] as TaigaStatus[]),
    ]);

    return NextResponse.json({
      userStory: [...userStory].sort((a, b) => a.order - b.order),
      task: [...task].sort((a, b) => a.order - b.order),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
