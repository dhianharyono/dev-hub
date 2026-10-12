import { NextResponse } from 'next/server';
import { z } from 'zod';
import { healTimesheetGap } from '@/lib/ai-assistant';
import { errorResponse } from '@/lib/http';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  missingHours: z.number().min(0.1).max(24),
  userStories: z
    .array(
      z.object({
        id: z.number(),
        ref: z.number(),
        subject: z.string(),
      }),
    )
    .default([]),
  projectSlug: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());

    // Look for commits on this date from local SQLite db (table gl_commits joined with gl_projects)
    let commits: Array<{
      sha: string;
      message: string;
      timestamp: string;
      project?: string;
      url?: string;
      is_fix?: number;
    }> = [];

    try {
      const rows = db()
        .prepare(
          `SELECT 
            c.sha, 
            c.title as message, 
            c.authored_at as timestamp, 
            p.path as project, 
            c.web_url as url,
            c.is_fix
          FROM gl_commits c
          LEFT JOIN gl_projects p ON c.project_id = p.id
          WHERE c.authored_at LIKE ? AND c.is_merge = 0
          ORDER BY c.authored_at DESC
          LIMIT 15`,
        )
        .all(`${b.date}%`) as Array<{
          sha: string;
          message: string;
          timestamp: string;
          project?: string;
          url?: string;
          is_fix?: number;
        }>;

      if (rows && rows.length > 0) {
        commits = rows;
      }
    } catch (dbErr) {
      console.warn('[Timesheet Healer] Failed to read commits from gl_commits:', dbErr);
    }

    const result = await healTimesheetGap({
      date: b.date,
      missingHours: b.missingHours,
      userStories: b.userStories,
      commits,
      projectSlug: b.projectSlug,
    });

    return NextResponse.json({ ok: true, commits, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
