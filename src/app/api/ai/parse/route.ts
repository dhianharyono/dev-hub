import { NextResponse } from "next/server";
import { z } from "zod";
import { parseTasks } from "@/lib/ai";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

const Body = z.object({
  input: z.string().min(2),
  mode: z.enum(["auto", "userstory", "task"]).default("auto"),
  defaultParentId: z.number().nullable().optional(),
  userStories: z.array(z.object({ id: z.number(), ref: z.number(), subject: z.string() })).default([]),
  statuses: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    return NextResponse.json(await parseTasks(b.input, b));
  } catch (e) {
    return errorResponse(e);
  }
}
