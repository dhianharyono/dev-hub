import "server-only";
import { getSettings } from "./settings";

export class GitLabError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export async function gl<T>(path: string, init?: RequestInit): Promise<T> {
  const s = getSettings();
  if (!s.gitlabToken) throw new GitLabError("Token GitLab belum diatur. Buka Settings.", 401);
  const headers: Record<string, string> = {
    "PRIVATE-TOKEN": s.gitlabToken,
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${s.gitlabBaseUrl}/api/v4${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    if (res.status === 429 && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json();
        msg =
          typeof j.message === "string"
            ? j.message
            : j.message
              ? JSON.stringify(j.message)
              : j.error || JSON.stringify(j);
      } catch {}
      throw new GitLabError(`GitLab ${res.status} ${path.split("?")[0]}: ${msg}`, res.status);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

/** Fetch all pages (uses per_page=100 and keeps going while page is full). */
export async function glAll<T>(path: string, maxPages = 50): Promise<T[]> {
  const out: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= maxPages; page++) {
    const batch = await gl<T[]>(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

export async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

/** Simple glob → RegExp (supports * and dir/* prefix). */
export function globToRegex(glob: string): RegExp {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return glob.includes("/") ? new RegExp(`(^|/)${esc}`, "i") : new RegExp(`(^|/)${esc}$`, "i");
}

export function isExcluded(filePath: string, patterns: RegExp[]) {
  return patterns.some((p) => p.test(filePath));
}

/** Count +/- lines of a unified diff string. */
export function countDiff(diff: string) {
  let add = 0,
    del = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) add++;
    else if (line.startsWith("-") && !line.startsWith("---")) del++;
  }
  return { add, del };
}
