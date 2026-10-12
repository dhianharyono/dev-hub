import { NextResponse } from "next/server";
import { z } from "zod";
import { createItem, updateTask } from "@/lib/taiga";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

const Body = z.object({
  projectId: z.number(),
  projectSlug: z.string().optional(),
  milestoneId: z.number().nullable().optional(),
  rawInput: z.string().optional(),
  items: z.array(
    z.object({
      kind: z.enum(["userstory", "task"]),
      subject: z.string().min(1),
      description: z.string().optional(),
      userStoryId: z.number().nullable().optional(),
      statusId: z.number().nullable().optional(),
      assignedTo: z.number().nullable().optional(),
      tags: z.array(z.string()).optional(),
      activityDate: z.string().optional(),
      startTime: z.string().optional(),
      totalTimeSpentMinutes: z.number().nullable().optional(),
    }),
  ),
});

const UpdateBody = z.object({
  taskId: z.number(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  statusId: z.number().nullable().optional(),
  assignedTo: z.number().nullable().optional(),
  userStoryId: z.number().nullable().optional(),
  activityDate: z.string().optional(),
  startTime: z.string().optional(),
  totalTimeSpentMinutes: z.number().nullable().optional(),
  isClosed: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const ins = db().prepare(
      "INSERT INTO task_log(created_at, kind, subject, taiga_id, taiga_ref, url, raw_input) VALUES (?,?,?,?,?,?,?)",
    );
    const results: { ok: boolean; subject: string; url?: string; ref?: number; error?: string }[] = [];
    // sequential to keep Taiga refs in input order
    for (const it of body.items) {
      try {
        const r = await createItem(body.projectId, {
          ...it,
          milestoneId: body.milestoneId,
          projectSlug: body.projectSlug,
          activityDate: it.activityDate,
          startTime: it.startTime,
          totalTimeSpentMinutes: it.totalTimeSpentMinutes ?? undefined,
        });
        ins.run(new Date().toISOString(), it.kind, it.subject, r.id, r.ref, r.url, body.rawInput ?? null);
        results.push({ ok: true, subject: it.subject, url: r.url, ref: r.ref });
      } catch (e) {
        results.push({ ok: false, subject: it.subject, error: (e as Error).message });
      }
    }
    return NextResponse.json({ results });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = UpdateBody.parse(await req.json());
    const r = await updateTask(body.taskId, body);
    if (body.subject) {
      try {
        db().prepare("UPDATE task_log SET subject = ? WHERE taiga_id = ?").run(body.subject, body.taskId);
      } catch {}
    }
    return NextResponse.json({ ok: true, task: r });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  const rows = db().prepare("SELECT * FROM task_log ORDER BY id DESC LIMIT 50").all();
  return NextResponse.json(rows);
}
