import { NextResponse } from "next/server";
import { getPublicSettings, isMasked, saveSettings, type Settings } from "@/lib/settings";
import { invalidateIntegrationCache } from "@/lib/integrations";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

function validateBaseUrl(urlStr: string, name: string) {
  try {
    const parsed = new URL(urlStr);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      throw new Error(`Protokol ${name} harus https:// atau http://`);
    }
    if (parsed.hostname === "169.254.169.254" || parsed.hostname === "metadata.google.internal") {
      throw new Error(`Host metadata cloud tidak diizinkan untuk ${name}`);
    }
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(`URL ${name} tidak valid`);
  }
}

export async function GET() {
  return NextResponse.json(getPublicSettings());
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<Settings> & { taigaSession?: string };
    const patch: Partial<Settings> = {};
    for (const [k, v] of Object.entries(body)) {
      if (k === "taigaSession" || isMasked(v)) continue;
      (patch as Record<string, unknown>)[k] = typeof v === "string" ? v.trim() : v;
    }

    if (patch.gitlabBaseUrl) validateBaseUrl(patch.gitlabBaseUrl, "GitLab Base URL");
    if (patch.taigaBaseUrl) validateBaseUrl(patch.taigaBaseUrl, "Taiga Base URL");

    // Accept the JSON blob copied from the browser console or bookmarklet after SSO login
    if (body.taigaSession) {
      let token = "";
      let refresh = "";
      try {
        const parsed = JSON.parse(body.taigaSession);
        if (typeof parsed === "object" && parsed !== null) {
          token = String(parsed.token || "");
          refresh = String(parsed.refresh || "");
        } else if (typeof parsed === "string") {
          token = parsed;
        }
      } catch {
        token = body.taigaSession.trim();
      }
      token = token.replace(/^["']+|["']+$/g, "").trim();
      refresh = refresh.replace(/^["']+|["']+$/g, "").trim();
      if (!token) throw new Error("Format session Taiga tidak valid (butuh field token).");
      patch.taigaToken = token;
      if (refresh) patch.taigaRefresh = refresh;
    }

    if (patch.taigaToken) {
      patch.taigaToken = patch.taigaToken.replace(/^["']+|["']+$/g, "").trim();
    }
    if (patch.taigaRefresh) {
      patch.taigaRefresh = patch.taigaRefresh.replace(/^["']+|["']+$/g, "").trim();
    }

    saveSettings(patch);
    invalidateIntegrationCache();
    return NextResponse.json(getPublicSettings());
  } catch (e) {
    return errorResponse(e);
  }
}
