import { NextResponse } from "next/server";
import { reviewStatus, startReview } from "@/lib/review-runner";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const st = reviewStatus();
  const s = getSettings();
  const apiKey = (s.geminiApiKey || "").trim();
  return NextResponse.json({
    ...st,
    configured: Boolean(apiKey),
    model: apiKey ? (s.geminiModel || "gemini-3.8-flash").trim() : null,
  });
}

/** Review manual sebagian commit (kuota aman): maksimal 50 per panggilan. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 5);
  const days = Number(url.searchParams.get("days") ?? 365);
  return NextResponse.json(startReview({ limit, days }));
}
