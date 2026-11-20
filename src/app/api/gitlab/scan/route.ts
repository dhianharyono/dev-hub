import { NextResponse } from "next/server";
import { startRetroScan, syncStatus } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(syncStatus());
}

/** Pindai ulang commit lama yang belum punya hasil pemindai statis. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 365);
  return NextResponse.json(startRetroScan(days));
}
