import { NextResponse } from "next/server";
import { getMeta } from "@/lib/taiga";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const project = new URL(req.url).searchParams.get("project") ?? undefined;
    const sprint = new URL(req.url).searchParams.get("sprint") ?? undefined;
    return NextResponse.json(await getMeta(project, sprint));
  } catch (e) {
    return errorResponse(e);
  }
}
