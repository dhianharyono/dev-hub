import 'server-only';
import { getSettings } from './settings';
import { refreshToken } from './taiga/client';

export interface IntegrationServiceStatus {
  connected: boolean;
  configured: boolean;
  username?: string;
  error?: string;
}

export interface IntegrationStatus {
  gitlab: IntegrationServiceStatus;
  taiga: IntegrationServiceStatus;
  wad: IntegrationServiceStatus;
}

let cachedStatus: { data: IntegrationStatus; timestamp: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

export function invalidateIntegrationCache() {
  cachedStatus = null;
}

export async function checkIntegrationsStatus(force = false): Promise<IntegrationStatus> {
  const now = Date.now();
  if (!force && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return cachedStatus.data;
  }

  const s = getSettings();

  // 1. Check GitLab
  let gitlabConnected = false;
  let gitlabUsername = s.gitlabUsername || '';
  let gitlabError = '';
  const gitlabConfigured = Boolean(s.gitlabToken && s.gitlabToken.trim());

  if (gitlabConfigured) {
    try {
      const baseUrl = (s.gitlabBaseUrl || 'https://gitlab.playcourt.id').trim().replace(/\/+$/, '');
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${baseUrl}/api/v4/user`, {
        headers: { 'PRIVATE-TOKEN': s.gitlabToken },
        signal: ctrl.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const u = (await res.json()) as { username?: string };
        gitlabConnected = true;
        if (u.username) gitlabUsername = u.username;
      } else {
        gitlabConnected = false;
        gitlabError = res.status === 401 ? 'Token GitLab tidak valid atau dicabut' : `HTTP ${res.status}`;
      }
    } catch (err) {
      gitlabConnected = false;
      gitlabError = (err as Error).name === 'AbortError' ? 'Koneksi GitLab timeout' : (err as Error).message;
    }
  } else {
    gitlabError = 'Token belum diatur';
  }

  // 2. Check Taiga
  let taigaConnected = false;
  let taigaUsername = '';
  let taigaError = '';
  const taigaConfigured = Boolean(s.taigaToken && s.taigaToken.trim());

  if (taigaConfigured) {
    try {
      const baseUrl = (s.taigaBaseUrl || 'https://tree.taiga.io').trim().replace(/\/+$/, '');
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 4000);
      let res = await fetch(`${baseUrl}/api/v1/users/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.taigaToken}`,
          'x-disable-pagination': 'True',
        },
        signal: ctrl.signal,
        cache: 'no-store',
      });

      if (res.status === 401 && s.taigaRefresh) {
        try {
          const newToken = await refreshToken();
          res = await fetch(`${baseUrl}/api/v1/users/me`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              'x-disable-pagination': 'True',
            },
            signal: ctrl.signal,
            cache: 'no-store',
          });
        } catch {
          // Token refresh failed
        }
      }
      clearTimeout(timeout);

      if (res.ok) {
        const me = (await res.json()) as { username?: string };
        taigaConnected = true;
        if (me.username) taigaUsername = me.username;
      } else {
        taigaConnected = false;
        taigaError = res.status === 401 ? 'Sesi Taiga kedaluwarsa atau tidak valid' : `HTTP ${res.status}`;
      }
    } catch (err) {
      taigaConnected = false;
      taigaError = (err as Error).name === 'AbortError' ? 'Koneksi Taiga timeout' : (err as Error).message;
    }
  } else {
    taigaError = 'Token belum diatur';
  }

  // 3. WAD depends on Taiga connectivity
  const wadConnected = taigaConnected;
  const wadConfigured = taigaConfigured;
  const wadError = taigaConnected ? '' : (taigaError || 'Memerlukan koneksi Taiga yang aktif');

  const result: IntegrationStatus = {
    gitlab: {
      connected: gitlabConnected,
      configured: gitlabConfigured,
      username: gitlabUsername,
      error: gitlabError,
    },
    taiga: {
      connected: taigaConnected,
      configured: taigaConfigured,
      username: taigaUsername,
      error: taigaError,
    },
    wad: {
      connected: wadConnected,
      configured: wadConfigured,
      error: wadError,
    },
  };

  cachedStatus = { data: result, timestamp: Date.now() };
  return result;
}
