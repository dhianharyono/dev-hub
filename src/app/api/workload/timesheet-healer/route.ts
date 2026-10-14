import { NextResponse } from 'next/server';
import { z } from 'zod';
import { healTimesheetGap } from '@/lib/ai-assistant';
import { errorResponse } from '@/lib/http';
import { db } from '@/lib/db';
import { getSettings, splitList } from '@/lib/settings';
import { gl } from '@/lib/gitlab';

export const dynamic = 'force-dynamic';

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  missingHours: z.number().min(0.1).max(24),
  userStories: z
    .array(
      z.object({
        id: z.number(),
        ref: z.number(),
        subject: z.string(),
      }),
    )
    .default([]),
  projectSlug: z.string().optional(),
});

interface ConnectedGitlabUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  public_email?: string;
}

interface GLEventItem {
  id: number;
  created_at: string;
  action_name: string;
  project_id: number;
  push_data?: {
    commit_count: number;
    action: string;
    ref_type: string;
    commit_from: string | null;
    commit_to: string | null;
    ref: string;
    commit_title: string | null;
  };
}

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const s = getSettings();
    const d = db();

    // 1. Resolve connected user information (ID, username, name, emails)
    let connectedUser: ConnectedGitlabUser | null = null;
    try {
      const glUserRow = d
        .prepare("SELECT value FROM settings WHERE key='glUser'")
        .get() as { value: string } | undefined;
      if (glUserRow?.value) {
        connectedUser = JSON.parse(glUserRow.value);
      }
    } catch {}

    if (!connectedUser && s.gitlabToken) {
      try {
        connectedUser = await gl<ConnectedGitlabUser>('/user');
        if (connectedUser) {
          d.prepare(
            "INSERT INTO settings(key,value) VALUES('glUser',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          ).run(
            JSON.stringify({
              id: connectedUser.id,
              username: connectedUser.username,
              name: connectedUser.name,
              email: connectedUser.email,
            }),
          );
        }
      } catch (err) {
        console.warn('[Timesheet Healer] Failed to fetch current GitLab user:', err);
      }
    }

    const userEmails = splitList(s.identityEmails).map((e) => e.toLowerCase());
    if (connectedUser?.email) userEmails.push(connectedUser.email.toLowerCase());
    if (connectedUser?.public_email) userEmails.push(connectedUser.public_email.toLowerCase());

    const userNames = splitList(s.identityNames).map((n) => n.toLowerCase());
    if (connectedUser?.name) userNames.push(connectedUser.name.toLowerCase());
    if (connectedUser?.username) userNames.push(connectedUser.username.toLowerCase());
    if (s.gitlabUsername) userNames.push(s.gitlabUsername.toLowerCase());

    const seenShas = new Set<string>();
    const commits: Array<{
      sha: string;
      message: string;
      timestamp: string;
      project?: string;
      url?: string;
      is_fix?: number;
    }> = [];

    // Project metadata cache from local SQLite
    const projectCache = new Map<number, { path: string; web_url?: string }>();
    try {
      const projs = d.prepare('SELECT id, path, web_url FROM gl_projects').all() as Array<{
        id: number;
        path: string;
        web_url: string;
      }>;
      for (const p of projs) projectCache.set(p.id, { path: p.path, web_url: p.web_url });
    } catch {}

    // 2. Query live pushed events for the connected user on target date (guarantees ONLY this user's commits)
    if (s.gitlabToken && connectedUser?.id) {
      try {
        const targetD = new Date(b.date);
        const after = new Date(targetD.getTime() - 864e5).toISOString().slice(0, 10);
        const before = new Date(targetD.getTime() + 2 * 864e5).toISOString().slice(0, 10);

        const events = await gl<GLEventItem[]>(
          `/users/${connectedUser.id}/events?action=pushed&after=${after}&before=${before}&per_page=100`,
        );

        if (Array.isArray(events)) {
          for (const ev of events) {
            const createdAt = ev.created_at || '';
            const evIsoDate = createdAt.slice(0, 10);
            const evLocalDate = new Date(createdAt).toLocaleDateString('en-CA');
            if (evIsoDate !== b.date && evLocalDate !== b.date) continue;

            const title = ev.push_data?.commit_title?.trim();
            const sha = ev.push_data?.commit_to;
            if (!title || !sha || seenShas.has(sha)) continue;

            // Exclude merge commits
            const isMerge =
              title.toLowerCase().startsWith('merge branch') ||
              title.toLowerCase().startsWith('merge remote-tracking');
            if (isMerge) continue;

            seenShas.add(sha);

            let proj = projectCache.get(ev.project_id);
            if (!proj && s.gitlabToken) {
              try {
                const fetchedProj = await gl<{ id: number; path_with_namespace: string; web_url: string }>(
                  `/projects/${ev.project_id}?simple=true`,
                );
                if (fetchedProj) {
                  proj = { path: fetchedProj.path_with_namespace, web_url: fetchedProj.web_url };
                  projectCache.set(ev.project_id, proj);
                  d.prepare(
                    'INSERT OR REPLACE INTO gl_projects(id, path, web_url, last_error) VALUES (?,?,?,?)',
                  ).run(fetchedProj.id, fetchedProj.path_with_namespace, fetchedProj.web_url, null);
                }
              } catch {}
            }

            const isFix = /\b(fix(e[sd])?|hotfix|bugfix|revert|perbaik\w*|patch)\b/i.test(title) ? 1 : 0;
            commits.push({
              sha,
              message: title,
              timestamp: createdAt,
              project: proj?.path,
              url: proj?.web_url ? `${proj.web_url}/-/commit/${sha}` : undefined,
              is_fix: isFix,
            });
          }
        }
      } catch (err) {
        console.warn('[Timesheet Healer] Failed to fetch live GitLab push events for user:', err);
      }
    }

    // 3. Fallback / supplementary check: local SQLite gl_commits table, strictly filtered by author
    try {
      const rows = d
        .prepare(
          `SELECT 
            c.sha, 
            c.title as message, 
            c.authored_at as timestamp, 
            p.path as project, 
            c.web_url as url,
            c.is_fix,
            c.author_name,
            c.author_email
          FROM gl_commits c
          LEFT JOIN gl_projects p ON c.project_id = p.id
          WHERE c.authored_at LIKE ? AND c.is_merge = 0
          ORDER BY c.authored_at DESC
          LIMIT 30`,
        )
        .all(`${b.date}%`) as Array<{
          sha: string;
          message: string;
          timestamp: string;
          project?: string;
          url?: string;
          is_fix?: number;
          author_name?: string | null;
          author_email?: string | null;
        }>;

      for (const r of rows) {
        if (seenShas.has(r.sha)) continue;

        // Skip merge commits
        if (
          r.message.toLowerCase().startsWith('merge branch') ||
          r.message.toLowerCase().startsWith('merge remote-tracking')
        ) {
          continue;
        }

        // STRICT FILTER: Must belong to the connected user!
        const hasAuthorCol = Boolean(r.author_name || r.author_email);
        if (hasAuthorCol) {
          const matchEmail = r.author_email && userEmails.includes(r.author_email.toLowerCase());
          const matchName = r.author_name && userNames.includes(r.author_name.toLowerCase());
          if (!matchEmail && !matchName) {
            // Not the connected user - skip!
            continue;
          }
        }

        seenShas.add(r.sha);
        commits.push({
          sha: r.sha,
          message: r.message,
          timestamp: r.timestamp,
          project: r.project,
          url: r.url,
          is_fix: r.is_fix,
        });
      }
    } catch (dbErr) {
      console.warn('[Timesheet Healer] Failed to read commits from local gl_commits:', dbErr);
    }

    const result = await healTimesheetGap({
      date: b.date,
      missingHours: b.missingHours,
      userStories: b.userStories,
      commits,
      projectSlug: b.projectSlug,
    });

    return NextResponse.json({ ok: true, commits, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
