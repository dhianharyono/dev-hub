import { NextResponse } from "next/server";
import { loadScorecard } from "@/lib/stats";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("days");
    const days = raw === null ? 0 : Number(raw);
    return NextResponse.json(loadScorecard(Number.isFinite(days) ? days : 0));
  } catch (e) {
    return errorResponse(e);
  }
}
