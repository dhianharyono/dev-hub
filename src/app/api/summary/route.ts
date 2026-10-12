import { NextResponse } from "next/server";
import { weeklySummary } from "@/lib/ai";
import { loadMetrics } from "@/lib/stats";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const days = Number(new URL(req.url).searchParams.get("days") ?? 7);
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const m = loadMetrics(days);
    const d = db();
    const commits = d
      .prepare(
        `SELECT p.path AS project, c.title FROM gl_commits c LEFT JOIN gl_projects p ON p.id=c.project_id
         WHERE c.is_merge=0 AND c.authored_at>=? ORDER BY c.authored_at`,
      )
      .all(since);
    const mrs = d
      .prepare(
        `SELECT p.path AS project, m.title, m.state, m.role FROM gl_mrs m LEFT JOIN gl_projects p ON p.id=m.project_id
         WHERE m.created_at>=? OR m.merged_at>=?`,
      )
      .all(since, since);
    const tasks = d.prepare("SELECT kind, subject FROM task_log WHERE created_at>=?").all(since);
    const text = await weeklySummary({ periodeHari: days, kpi: m.kpis, skor: m.scores, commits, mergeRequests: mrs, taigaItems: tasks });
    return NextResponse.json({ text });
  } catch (e) {
    return errorResponse(e);
  }
}
