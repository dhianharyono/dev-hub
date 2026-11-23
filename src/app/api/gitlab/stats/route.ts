import { NextResponse } from "next/server";
import { loadMetrics } from "@/lib/stats";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const days = Number(params.get("days") ?? 90);
    const scope = params.get("scope") === "identity" ? "identity" : "all";
    return NextResponse.json(loadMetrics(days, new Date(), { scope }));
  } catch (e) {
    return errorResponse(e);
  }
}
