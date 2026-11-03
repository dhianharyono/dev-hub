import "server-only";
import { execFile } from "node:child_process";
import { TaigaError, cleanTaigaErrorMessage } from "./types";
import { saveSettings } from "../settings";

export { cleanTaigaErrorMessage };

export interface ChromeBridgeOptions {
  baseUrl: string;
  path: string;
  method?: string;
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ChromeBridgeResult<T> {
  status: number;
  data: T;
  text: string;
  tokenFromBrowser?: string;
  refreshFromBrowser?: string;
}

let lastCloudflareDetected = 0;
const CLOUDFLARE_CACHE_MS = 90_000; // 90 seconds

export function markCloudflareBlocked() {
  lastCloudflareDetected = Date.now();
}

export function clearCloudflareBlocked() {
  lastCloudflareDetected = 0;
}

export function isDirectFetchBlocked(): boolean {
  if (process.platform !== "darwin") return false;
  return Date.now() - lastCloudflareDetected < CLOUDFLARE_CACHE_MS;
}

function runAppleScript(script: string, timeoutMs = 25000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "osascript",
      ["-e", script],
      { maxBuffer: 30 * 1024 * 1024, timeout: timeoutMs },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr?.trim() || err.message));
        }
        resolve(stdout.trim());
      },
    );
  });
}

/**
 * Checks if an HTTP response is blocked by Cloudflare (WAF Managed Challenge / Turnstile / 403 Forbidden).
 */
export function isCloudflareChallenge(status: number, headers: Headers, bodyPreview?: string): boolean {
  if (status !== 403 && status !== 503) return false;
  const server = headers.get("server")?.toLowerCase() || "";
  const cfMitigated = headers.get("cf-mitigated");
  const cfRay = headers.get("cf-ray");
  const contentType = headers.get("content-type")?.toLowerCase() || "";

  if (cfMitigated || (server.includes("cloudflare") && cfRay)) {
    return true;
  }
  if (contentType.includes("text/html")) {
    return true;
  }
  if (bodyPreview && (bodyPreview.includes("Just a moment...") || bodyPreview.includes("challenges.cloudflare.com"))) {
    return true;
  }
  return false;
}

/**
 * Executes a Taiga API request inside Google Chrome using native fetch with credentials: 'include'.
 * This completely bypasses Cloudflare WAF / Managed Challenge because requests originate
 * from the verified, authenticated browser tab with genuine TLS fingerprint and cf_clearance.
 */
export async function executeTaigaViaChrome<T>(options: ChromeBridgeOptions): Promise<ChromeBridgeResult<T>> {
  if (process.platform !== "darwin") {
    throw new TaigaError("Chrome Bridge hanya didukung pada sistem macOS.", 500);
  }

  const cleanBaseUrl = options.baseUrl.replace(/\/+$/, "");
  const method = (options.method || "GET").toUpperCase();
  const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const fullApiPath = `/api/v1${path}`;
  const reqId = `__tb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  let bodyStr: string | null = null;
  if (options.body !== undefined && options.body !== null) {
    bodyStr = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const payload = {
    method,
    path: fullApiPath,
    headers: {
      "Content-Type": "application/json",
      "x-disable-pagination": "True",
      "Accept-Language": "en",
      ...(options.headers || {}),
    } as Record<string, string>,
    body: bodyStr,
  };

  if (options.token) {
    payload.headers["Authorization"] = `Bearer ${options.token.replace(/^["']+|["']+$/g, "").trim()}`;
  }

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const injectedCode = `(function(){
    var rId = '${reqId}';
    window[rId] = null;
    try {
      var req = JSON.parse(decodeURIComponent(escape(atob('${base64Payload}'))));
      var lsToken = localStorage.getItem('token') || localStorage.token;
      var lsRefresh = localStorage.getItem('refresh') || localStorage.refresh;
      if (!req.headers['Authorization'] && lsToken) {
        req.headers['Authorization'] = 'Bearer ' + String(lsToken).replace(/^[\\"]+|[\\"]+$/g, '').trim();
      }
      var opt = {
        method: req.method,
        headers: req.headers,
        credentials: 'include'
      };
      if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
        opt.body = req.body;
      }
      fetch(req.path, opt).then(function(res) {
        return res.text().then(function(txt) {
          window[rId] = JSON.stringify({
            status: res.status,
            body: txt,
            browserToken: lsToken ? String(lsToken).replace(/^[\\"]+|[\\"]+$/g, '').trim() : null,
            browserRefresh: lsRefresh ? String(lsRefresh).replace(/^[\\"]+|[\\"]+$/g, '').trim() : null
          });
        });
      }).catch(function(err) {
        window[rId] = JSON.stringify({ status: 500, error: err.message });
      });
    } catch(e) {
      window[rId] = JSON.stringify({ status: 500, error: e.message });
    }
  })()`;

  const escapedJs = injectedCode.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = `
    tell application "Google Chrome"
      set targetTab to missing value
      repeat with w in windows
        repeat with t in tabs of w
          if URL of t starts with "${cleanBaseUrl}" then
            set targetTab to t
            exit repeat
          end if
        end repeat
        if targetTab is not missing value then exit repeat
      end repeat

      if targetTab is missing value then
        if (count of windows) is 0 then
          make new window
        end if
        set targetTab to make new tab at end of tabs of window 1 with properties {URL:"${cleanBaseUrl}"}
        set maxWait to 12
        repeat while maxWait > 0
          delay 0.5
          set maxWait to maxWait - 0.5
          if (loading of targetTab is false) and (URL of targetTab starts with "${cleanBaseUrl}") then
            exit repeat
          end if
        end repeat
      end if

      execute targetTab javascript "${escapedJs}"

      set pollCount to 60
      repeat while pollCount > 0
        delay 0.1
        set pollCount to pollCount - 1
        set checkRes to execute targetTab javascript "window['${reqId}']"
        if checkRes is not "" and checkRes is not missing value then
          execute targetTab javascript "delete window['${reqId}']"
          return checkRes
        end if
      end repeat
      return "TIMEOUT"
    end tell
  `;

  let rawOutput = "";
  try {
    rawOutput = await runAppleScript(appleScript);
  } catch (err) {
    throw new TaigaError(
      `Gagal mengakses Google Chrome: ${(err as Error).message}. Pastikan Google Chrome berjalan dan izin Apple Events diaktifkan.`,
      502,
    );
  }

  if (rawOutput === "TIMEOUT") {
    throw new TaigaError("Timeout menunggu respon Taiga dari browser Chrome.", 504);
  }

  interface BridgeResponse {
    status: number;
    body?: string;
    error?: string;
    browserToken?: string | null;
    browserRefresh?: string | null;
  }

  let parsed: BridgeResponse;
  try {
    parsed = JSON.parse(rawOutput) as BridgeResponse;
  } catch {
    const cleanOutput = cleanTaigaErrorMessage(rawOutput);
    throw new TaigaError(`Respon bridge tidak valid dari Google Chrome: ${cleanOutput.slice(0, 200)}`, 502);
  }

  if (parsed.error) {
    const cleanErr = cleanTaigaErrorMessage(parsed.error, parsed.status);
    throw new TaigaError(cleanErr.startsWith('Taiga') ? cleanErr : `Taiga: ${cleanErr}`, parsed.status || 500);
  }

  const status = parsed.status;
  const text = parsed.body || "";

  // Auto-sync token if browser has a valid token
  if (parsed.browserToken && parsed.browserToken !== options.token) {
    try {
      saveSettings({
        taigaToken: parsed.browserToken,
        ...(parsed.browserRefresh ? { taigaRefresh: parsed.browserRefresh } : {}),
      });
    } catch {}
  }

  if (status >= 400) {
    let msg = `${status} Request Gagal`;
    try {
      const j = JSON.parse(text);
      msg = j._error_message || (j.detail ? String(j.detail) : JSON.stringify(j));
    } catch {
      if (text) msg = cleanTaigaErrorMessage(text, status);
    }
    const cleanMsg = cleanTaigaErrorMessage(msg, status);
    throw new TaigaError(cleanMsg.startsWith('Taiga') ? cleanMsg : `Taiga: ${cleanMsg}`, status);
  }

  let data = undefined as T;
  if (status !== 204 && text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as unknown as T;
    }
  }

  markCloudflareBlocked();

  return {
    status,
    data,
    text,
    tokenFromBrowser: parsed.browserToken || undefined,
    refreshFromBrowser: parsed.browserRefresh || undefined,
  };
}

/**
 * Batches multiple task custom-attributes-values requests directly inside the Chrome tab.
 * Uses Chrome's multiplexed HTTP/2 connection pooling to retrieve dozens of CAVs in parallel
 * in a single AppleScript call (~1-2 seconds vs 20-30 seconds of individual roundtrips).
 */
export async function executeBatchCavViaChrome(
  baseUrl: string,
  taskIds: number[],
  token?: string,
): Promise<Record<number, Record<string, unknown>>> {
  if (taskIds.length === 0) return {};
  if (process.platform !== "darwin") return {};

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const reqId = `__tb_cav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const payload = { taskIds, token };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const injectedCode = `(function(){
    var rId = '${reqId}';
    window[rId] = null;
    try {
      var req = JSON.parse(decodeURIComponent(escape(atob('${base64Payload}'))));
      var tIds = req.taskIds || [];
      var lsToken = localStorage.getItem('token') || localStorage.token;
      var tok = req.token || (lsToken ? String(lsToken).replace(/^[\\"]+|[\\"]+$/g, '').trim() : '');
      var promises = tIds.map(function(id) {
        return fetch('/api/v1/tasks/custom-attributes-values/' + id, {
          credentials: 'include',
          headers: { 'Authorization': 'Bearer ' + tok, 'x-disable-pagination': 'True' }
        }).then(function(r) {
          return r.json();
        }).then(function(d) {
          return { id: id, vals: d.attributes_values || {} };
        }).catch(function() {
          return { id: id, vals: {} };
        });
      });
      Promise.all(promises).then(function(results) {
        var out = {};
        results.forEach(function(r) { out[r.id] = r.vals; });
        window[rId] = JSON.stringify({ ok: true, data: out });
      }).catch(function(err) {
        window[rId] = JSON.stringify({ ok: false, error: err.message });
      });
    } catch(e) {
      window[rId] = JSON.stringify({ ok: false, error: e.message });
    }
  })()`;

  const escapedJs = injectedCode.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = `
    tell application "Google Chrome"
      set targetTab to missing value
      repeat with w in windows
        repeat with t in tabs of w
          if URL of t starts with "${cleanBaseUrl}" then
            set targetTab to t
            exit repeat
          end if
        end repeat
        if targetTab is not missing value then exit repeat
      end repeat

      if targetTab is missing value then
        return "TAB_NOT_FOUND"
      end if

      execute targetTab javascript "${escapedJs}"

      set pollCount to 100
      repeat while pollCount > 0
        delay 0.1
        set pollCount to pollCount - 1
        set checkRes to execute targetTab javascript "window['${reqId}']"
        if checkRes is not "" and checkRes is not missing value then
          execute targetTab javascript "delete window['${reqId}']"
          return checkRes
        end if
      end repeat
      return "TIMEOUT"
    end tell
  `;

  try {
    const rawOutput = await runAppleScript(appleScript, 35000);
    if (rawOutput === "TIMEOUT" || rawOutput === "TAB_NOT_FOUND") return {};
    const parsed = JSON.parse(rawOutput);
    if (parsed.ok && parsed.data) {
      markCloudflareBlocked();
      return parsed.data;
    }
  } catch {}
  return {};
}
