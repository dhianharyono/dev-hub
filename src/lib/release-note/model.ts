export type ReleaseNoteSource = 'Staging' | 'Production';

export interface ReleaseNoteSummary {
  id: number;
  ref: number;
  subject: string;
  source: ReleaseNoteSource;
  status: { name: string; color: string; isClosed: boolean };
  milestone: string | null;
  createdDate: string;
  modifiedDate: string;
  url: string;
}

export interface ReleaseNoteTask {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  statusId?: number;
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number | null;
  status: { name: string; color: string; isClosed: boolean };
  url: string;
}

export interface ReleaseNoteDetail extends ReleaseNoteSummary {
  statusId?: number;
  description: string;
  tasks: ReleaseNoteTask[];
}

export interface ReleaseNoteList {
  project: { id: number; name: string; slug: string } | null;
  assignee: { id: number; name: string } | null;
  epics: { source: ReleaseNoteSource; epicRef: number; count: number }[];
  notes: ReleaseNoteSummary[];
  /** True bila sesi Taiga belum ada; daftar sengaja dikosongkan. */
  needsLogin: boolean;
}

export interface RawReleaseNoteStory {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  status: number;
  status_extra_info?: { name: string; color: string; is_closed?: boolean };
  milestone: number | null;
  milestone_extra_info?: { name: string } | null;
  milestone_name?: string | null;
  epics?: { id: number; ref: number }[];
  assigned_to?: number | null;
  assigned_users?: number[] | null;
  is_closed: boolean;
  created_date: string;
  modified_date: string;
}

/** True bila tiket di-assign ke user Taiga tertentu. */
export function isAssignedTo(
  story: Pick<RawReleaseNoteStory, 'assigned_to' | 'assigned_users'>,
  userId: number,
): boolean {
  if (story.assigned_to === userId) return true;
  return (
    Array.isArray(story.assigned_users) && story.assigned_users.includes(userId)
  );
}

/** Daftar kosong saat sesi Taiga belum tersedia. */
export function emptyReleaseNoteList(
  epics: { source: ReleaseNoteSource; epicRef: number }[],
): ReleaseNoteList {
  return {
    project: null,
    assignee: null,
    epics: epics.map((epic) => ({ ...epic, count: 0 })),
    notes: [],
    needsLogin: true,
  };
}

/** Ubah user story Taiga menjadi baris daftar release note. */
export function toReleaseNoteSummary(
  story: RawReleaseNoteStory,
  ctx: { baseUrl: string; projectSlug: string },
  source: ReleaseNoteSource,
): ReleaseNoteSummary {
  return {
    id: story.id,
    ref: story.ref,
    subject: story.subject,
    source,
    status: {
      name: story.status_extra_info?.name ?? 'Unknown',
      color: story.status_extra_info?.color ?? '#94a3b8',
      isClosed: Boolean(story.is_closed || story.status_extra_info?.is_closed),
    },
    milestone:
      story.milestone_extra_info?.name ?? story.milestone_name ?? null,
    createdDate: story.created_date,
    modifiedDate: story.modified_date,
    url: `${ctx.baseUrl}/project/${ctx.projectSlug}/us/${story.ref}`,
  };
}

/** Urutkan release note: yang terbaru dibuat di atas. */
export function sortReleaseNotes<T extends { createdDate: string }>(
  notes: T[],
): T[] {
  return [...notes].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
}
