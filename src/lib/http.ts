import { NextResponse } from "next/server";

export function errorResponse(e: unknown) {
  const err = e as Error & { status?: number };
  const status = typeof err.status === "number" && err.status >= 400 ? err.status : 500;
  return NextResponse.json({ error: err.message ?? "Unknown error" }, { status });
}
