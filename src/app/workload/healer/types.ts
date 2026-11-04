import type { WorkloadDaySummary } from '@/lib/workload';
import { TIME_SLOTS } from '@/app/tasks/smart-task/types';

export interface ProjectRef {
  id: number;
  name: string;
  slug: string;
}

export interface MetaData {
  projectId: number;
  projectSlug: string;
  milestoneId: number | null;
  me?: { id: number; username: string; full_name_display?: string } | null;
  projects: ProjectRef[];
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

export interface HealerSuggestion {
  subject: string;
  description: string;
  activityDate: string;
  startTime: string;
  durationHours: number;
  totalTimeSpentMinutes: number;
  parentUserStoryId: number | null;
  tags: string[];
  projectId?: number | null;
  projectSlug?: string;
  statusId?: number | null;
}

export function normalizeMeta(raw: unknown): MetaData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const proj = r.project as { id?: number; name?: string; slug?: string } | undefined;
  const sp = r.sprint as { id?: number; name?: string; slug?: string } | null | undefined;
  const pId = r.projectId ?? proj?.id;
  const pSlug = r.projectSlug ?? proj?.slug ?? '';
  const mId = r.milestoneId ?? sp?.id ?? null;
  if (!pId) return null;
  return {
    projectId: Number(pId),
    projectSlug: String(pSlug),
    milestoneId: mId ? Number(mId) : null,
    me: (r.me as MetaData['me']) ?? null,
    projects: (Array.isArray(r.projects)
      ? r.projects
      : proj && proj.name
        ? [proj]
        : []) as ProjectRef[],
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

export { TIME_SLOTS };
export type { WorkloadDaySummary };
