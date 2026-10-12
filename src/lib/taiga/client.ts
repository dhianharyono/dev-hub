import "server-only";
import { getSettings, saveSettings } from "../settings";
import { TaigaError } from "./types";

export async function refreshToken(): Promise<string> {
  const s = getSettings();
  if (!s.taigaRefresh) {
    throw new TaigaError(
      "Token Taiga kedaluwarsa dan refresh token tidak ada. Perbarui di Settings.",
      401,
    );
  }
  const res = await fetch(`${s.taigaBaseUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: s.taigaRefresh }),
  });
  if (!res.ok) {
    throw new TaigaError(
      "Gagal refresh token Taiga. Login ulang via SSO lalu perbarui token di Settings.",
      401,
    );
  }
  const data = (await res.json()) as { auth_token: string; refresh: string };
  saveSettings({ taigaToken: data.auth_token, taigaRefresh: data.refresh });
  return data.auth_token;
}

export async function taiga<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const s = getSettings();
  if (!s.taigaToken) {
    throw new TaigaError("Token Taiga belum diatur. Buka Settings.", 401);
  }
  const res = await fetch(`${s.taigaBaseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.taigaToken}`,
      "x-disable-pagination": "True",
      "Accept-Language": "en",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 401 && !retried) {
    await refreshToken();
    return taiga<T>(path, init, true);
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j._error_message || JSON.stringify(j);
    } catch {}
    throw new TaigaError(`Taiga: ${msg}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
