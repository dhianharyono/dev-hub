import { NextResponse } from "next/server";
import { ISSUE_KEYS, type IssueKey } from "@/lib/code-issues";
import { loadIssueLocations } from "@/lib/stats";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Detail lokasi satu kategori isu, dibatasi 50 baris oleh loadIssueLocations. */
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const key = params.get("key") as IssueKey | null;
    if (!key || !ISSUE_KEYS.includes(key)) {
      return NextResponse.json({ error: "Kategori isu tidak dikenal" }, { status: 400 });
    }
    const raw = params.get("days");
    const days = raw === null ? 0 : Number(raw);
    return NextResponse.json(loadIssueLocations(key, Number.isFinite(days) ? days : 0));
  } catch (e) {
    return errorResponse(e);
  }
}
