import { NextResponse } from "next/server";
import {
  loadHotspotDetail,
  loadLanguageDetail,
  loadRecurringDetail,
} from "@/lib/stats";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

const RECURRING_KEYS = ["fixOnFix", "repeatedFix", "backAndForth", "revert"] as const;
type RecurringKey = (typeof RECURRING_KEYS)[number];

/** Detail satu baris kartu produktivitas: bahasa, isu berulang, atau hotspot. */
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const raw = params.get("days");
    const days = raw === null ? 0 : Number(raw);
    const period = Number.isFinite(days) ? days : 0;
    const kind = params.get("kind");

    if (kind === "language") {
      const language = params.get("language");
      if (!language) return NextResponse.json({ error: "Bahasa wajib diisi" }, { status: 400 });
      return NextResponse.json(loadLanguageDetail(language, period));
    }

    if (kind === "recurring") {
      const key = params.get("key") as RecurringKey | null;
      if (!key || !RECURRING_KEYS.includes(key)) {
        return NextResponse.json({ error: "Isu berulang tidak dikenal" }, { status: 400 });
      }
      return NextResponse.json(loadRecurringDetail(key, period));
    }

    if (kind === "hotspot") {
      const path = params.get("path");
      if (!path) return NextResponse.json({ error: "Path wajib diisi" }, { status: 400 });
      return NextResponse.json(loadHotspotDetail(path, period));
    }

    return NextResponse.json({ error: "Jenis detail tidak dikenal" }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}
