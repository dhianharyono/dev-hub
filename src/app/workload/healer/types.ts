import type { WorkloadDaySummary } from '@/lib/workload';
import type { HealerSuggestion } from '@/lib/ai-assistant';

export interface MetaData {
  projectId: number;
  projectSlug: string;
  milestoneId: number | null;
  me?: { id: number; username: string; full_name_display?: string } | null;
  userStories: { id: number; ref: number; subject: string }[];
  statuses: { id: number; name: string; slug?: string }[];
  taskStatuses: { id: number; name: string; slug?: string }[];
  project?: { id: number; name: string; slug: string };
  sprint?: { id: number; name: string; slug: string } | null;
}

export interface HealerDetectedCommit {
  sha: string;
  message: string;
  timestamp?: string;
  project?: string;
  url?: string;
}

export function normalizeMeta(raw: unknown): MetaData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const proj = r.project as { id?: number; slug?: string } | undefined;
  const sp = r.sprint as { id?: number; slug?: string } | null | undefined;
  const pId = r.projectId ?? proj?.id;
  const pSlug = r.projectSlug ?? proj?.slug ?? '';
  const mId = r.milestoneId ?? sp?.id ?? null;
  if (!pId) return null;
  return {
    projectId: Number(pId),
    projectSlug: String(pSlug),
    milestoneId: mId ? Number(mId) : null,
    me: (r.me as MetaData['me']) ?? null,
    userStories: (Array.isArray(r.userStories) ? r.userStories : []) as {
      id: number;
      ref: number;
      subject: string;
    }[],
    statuses: (Array.isArray(r.statuses)
      ? r.statuses
      : Array.isArray(r.taskStatuses)
        ? r.taskStatuses
        : []) as { id: number; name: string; slug?: string }[],
    taskStatuses: (Array.isArray(r.taskStatuses)
      ? r.taskStatuses
      : Array.isArray(r.statuses)
        ? r.statuses
        : []) as { id: number; name: string; slug?: string }[],
    project: proj as { id: number; name: string; slug: string } | undefined,
    sprint: sp as { id: number; name: string; slug: string } | null | undefined,
  };
}

export type { WorkloadDaySummary, HealerSuggestion };
