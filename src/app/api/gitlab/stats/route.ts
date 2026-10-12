import { NextResponse } from "next/server";
import { loadMetrics } from "@/lib/stats";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const days = Number(new URL(req.url).searchParams.get("days") ?? 90);
    return NextResponse.json(loadMetrics(days));
  } catch (e) {
    return errorResponse(e);
  }
}
