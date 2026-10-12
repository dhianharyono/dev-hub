import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

interface GLChange {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  diff: string;
}

interface GLMrChangesResponse {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  changes_count: string | number;
  changes: GLChange[];
  source_branch: string;
  target_branch: string;
  web_url: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const mrIid = url.searchParams.get('mrIid');

    if (!projectId || !mrIid) {
      return NextResponse.json(
        { ok: false, error: 'Parameter projectId dan mrIid wajib disertakan.' },
        { status: 400 },
      );
    }

    const data = await gl<GLMrChangesResponse>(
      `/projects/${projectId}/merge_requests/${mrIid}/changes`,
    );

    const changes = data.changes || [];

    // Assemble unified diff format for AI audit
    let combinedDiff = '';
    const files: { path: string; isNew: boolean; isDeleted: boolean; isRenamed: boolean }[] = [];

    for (const c of changes) {
      files.push({
        path: c.new_path || c.old_path,
        isNew: Boolean(c.new_file),
        isDeleted: Boolean(c.deleted_file),
        isRenamed: Boolean(c.renamed_file),
      });

      combinedDiff += `diff --git a/${c.old_path} b/${c.new_path}\n`;
      if (c.new_file) combinedDiff += `new file mode 100644\n`;
      if (c.deleted_file) combinedDiff += `deleted file mode 100644\n`;
      if (c.renamed_file) combinedDiff += `similarity index 90%\nrename from ${c.old_path}\nrename to ${c.new_path}\n`;
      combinedDiff += `--- a/${c.old_path}\n+++ b/${c.new_path}\n`;
      combinedDiff += (c.diff || '') + '\n\n';
    }

    return NextResponse.json({
      ok: true,
      title: data.title,
      description: data.description,
      sourceBranch: data.source_branch,
      targetBranch: data.target_branch,
      webUrl: data.web_url,
      filesCount: files.length,
      files,
      diff: combinedDiff,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
