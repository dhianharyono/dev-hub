import 'server-only';
import { getSettings, saveSettings } from '../settings';
import { TaigaError, cleanTaigaErrorMessage } from './types';
import {
  isCloudflareChallenge,
  executeTaigaViaChrome,
  isDirectFetchBlocked,
  markCloudflareBlocked,
  clearCloudflareBlocked,
} from './bridge';

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

export async function refreshToken(): Promise<string> {
  const s = getSettings();
  if (!s.taigaRefresh) {
    throw new TaigaError(
      'Token Taiga kedaluwarsa dan refresh token tidak ada. Perbarui di Settings.',
      401,
    );
  }

  let data: { auth_token: string; refresh: string } | null = null;

  try {
    const res = await fetch(`${s.taigaBaseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: s.taigaRefresh }),
    });

    if (isCloudflareChallenge(res.status, res.headers)) {
      const bridge = await executeTaigaViaChrome<{
        auth_token: string;
        refresh: string;
      }>({
        baseUrl: s.taigaBaseUrl,
        path: '/auth/refresh',
        method: 'POST',
        body: { refresh: s.taigaRefresh },
      });
      data = bridge.data;
    } else if (res.ok) {
      data = (await res.json()) as { auth_token: string; refresh: string };
    }
  } catch {
    // If fetch failed completely, try Chrome bridge fallback
    if (process.platform === 'darwin') {
      const bridge = await executeTaigaViaChrome<{
        auth_token: string;
        refresh: string;
      }>({
        baseUrl: s.taigaBaseUrl,
        path: '/auth/refresh',
        method: 'POST',
        body: { refresh: s.taigaRefresh },
      });
      data = bridge.data;
    }
  }

  if (!data?.auth_token) {
    throw new TaigaError(
      'Gagal refresh token Taiga. Login ulang via SSO lalu perbarui token di Settings.',
      401,
    );
  }

  saveSettings({ taigaToken: data.auth_token, taigaRefresh: data.refresh });
  return data.auth_token;
}

export async function taiga<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const s = getSettings();
  if (!s.taigaToken) {
    throw new TaigaError('Token Taiga belum diatur. Buka Settings.', 401);
  }

  const customHeaders = normalizeHeaders(init.headers);

  // Fast path: if direct network is known to be blocked by Cloudflare, skip the failing network fetch
  if (isDirectFetchBlocked()) {
    const bridge = await executeTaigaViaChrome<T>({
      baseUrl: s.taigaBaseUrl,
      path,
      method: init.method,
      token: s.taigaToken,
      headers: customHeaders,
      body: init.body,
    });
    return bridge.data;
  }

  let res: Response | null = null;
  let bodyPreview = '';

  try {
    res = await fetch(`${s.taigaBaseUrl}/api/v1${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s.taigaToken}`,
        'x-disable-pagination': 'True',
        'Accept-Language': 'en',
        ...customHeaders,
      },
      cache: 'no-store',
    });

    if (res.status === 403 || res.status === 503) {
      try {
        const cloned = res.clone();
        bodyPreview = (await cloned.text()).slice(0, 500);
      } catch {}
    }
  } catch (err) {
    // If direct fetch fails (network blocked or connection refused), fallback to Chrome on macOS
    if (process.platform === 'darwin') {
      const bridge = await executeTaigaViaChrome<T>({
        baseUrl: s.taigaBaseUrl,
        path,
        method: init.method,
        token: s.taigaToken,
        headers: customHeaders,
        body: init.body,
      });
      return bridge.data;
    }
    throw err;
  }

  // If Cloudflare blocked direct request, seamlessly route through active Chrome tab
  if (res && isCloudflareChallenge(res.status, res.headers, bodyPreview)) {
    markCloudflareBlocked();
    if (process.platform === 'darwin') {
      const bridge = await executeTaigaViaChrome<T>({
        baseUrl: s.taigaBaseUrl,
        path,
        method: init.method,
        token: s.taigaToken,
        headers: customHeaders,
        body: init.body,
      });
      return bridge.data;
    }
  }

  if (res.status === 401 && !retried) {
    await refreshToken();
    return taiga<T>(path, init, true);
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg =
        j._error_message || (j.detail ? String(j.detail) : JSON.stringify(j));
    } catch {
      try {
        const raw = await res.text();
        if (raw) msg = cleanTaigaErrorMessage(raw, res.status);
      } catch {}
    }
    const cleanMsg = cleanTaigaErrorMessage(msg, res.status);
    throw new TaigaError(cleanMsg.startsWith('Taiga') ? cleanMsg : `Taiga: ${cleanMsg}`, res.status);
  }

  clearCloudflareBlocked();
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
