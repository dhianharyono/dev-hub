import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { errorResponse } from '@/lib/http';
import type { SavedReleaseNote } from '@/lib/release-note/types';

export const dynamic = 'force-dynamic';

interface ReleaseNoteRow {
  id: number;
  project_id: number;
  project_path: string;
  release_title: string;
  feature_name: string;
  service: string;
  deploy_at: string;
  mr_iids: string;
  content: string;
  target_branch: string | null;
  created_at: string;
}

function toSavedNote(row: ReleaseNoteRow): SavedReleaseNote {
  let mrIids: number[] = [];
  try {
    const parsed = JSON.parse(row.mr_iids);
    if (Array.isArray(parsed)) {
      mrIids = parsed.filter((v): v is number => typeof v === 'number');
    }
  } catch {
    mrIids = [];
  }
  return {
    id: row.id,
    projectId: row.project_id,
    projectPath: row.project_path,
    releaseTitle: row.release_title || row.feature_name,
    featureName: row.feature_name,
    service: row.service,
    deployAt: row.deploy_at,
    mrIids,
    content: row.content,
    targetBranch: row.target_branch || null,
    createdAt: row.created_at,
  };
}

const SaveBody = z.object({
  projectId: z.number().int().positive(),
  projectPath: z.string().trim().min(1),
  releaseTitle: z.string().trim().min(1),
  service: z.string().trim().min(1),
  deployAt: z.string().trim().min(1),
  mrIids: z.array(z.number().int().positive()),
  content: z.string().min(1),
  targetBranch: z.string().trim().min(1).nullable().optional(),
});

export async function GET() {
  try {
    const rows = db()
      .prepare(
        'SELECT * FROM release_notes ORDER BY created_at DESC, id DESC LIMIT 100',
      )
      .all() as unknown as ReleaseNoteRow[];
    return NextResponse.json({ ok: true, notes: rows.map(toSavedNote) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = SaveBody.parse(await req.json());
    const createdAt = new Date().toISOString();
    const result = db()
      .prepare(
        `INSERT INTO release_notes
          (project_id, project_path, release_title, feature_name, service, deploy_at, mr_iids, content, target_branch, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        body.projectId,
        body.projectPath,
        body.releaseTitle,
        body.releaseTitle,
        body.service,
        body.deployAt,
        JSON.stringify(body.mrIids),
        body.content,
        body.targetBranch ?? null,
        createdAt,
      );

    const id = Number(result.lastInsertRowid);
    const row = db()
      .prepare('SELECT * FROM release_notes WHERE id = ?')
      .get(id) as unknown as ReleaseNoteRow | undefined;

    return NextResponse.json({
      ok: true,
      note: row ? toSavedNote(row) : null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get('id');
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'id tidak valid.' }, { status: 400 });
    }
    const result = db()
      .prepare('DELETE FROM release_notes WHERE id = ?')
      .run(id);
    return NextResponse.json({ ok: true, deleted: Number(result.changes) });
  } catch (e) {
    return errorResponse(e);
  }
}
