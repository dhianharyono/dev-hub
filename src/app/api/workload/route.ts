import { NextResponse } from "next/server";
import { getWorkloadData } from "@/lib/workload";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month") || undefined;
    const data = await getWorkloadData(month);
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
