import { NextResponse } from "next/server";
import { startSync, syncStatus } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(syncStatus());
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 180);
  const full = url.searchParams.get("full") === "1";
  return NextResponse.json(startSync(days, full));
}
