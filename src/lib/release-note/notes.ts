import 'server-only';
import { taiga, resolveEpicId } from '@/lib/taiga';
import { readTaskTimesheet } from '@/lib/taiga/timesheet';
import { getSettings } from '@/lib/settings';
import {
  emptyReleaseNoteList,
  isAssignedTo,
  sortReleaseNotes,
  toReleaseNoteSummary,
  type RawReleaseNoteStory,
  type ReleaseNoteDetail,
  type ReleaseNoteList,
  type ReleaseNoteSource,
  type ReleaseNoteSummary,
} from './model';

/** Project SPA: sumber epic release note. */
export const RELEASE_NOTE_PROJECT_ID = 269;

/** Dua epic acuan: deployment Staging dan Production. */
export const RELEASE_NOTE_EPICS: { source: ReleaseNoteSource; epicRef: number }[] =
  [
    { source: 'Staging', epicRef: 67174 },
    { source: 'Production', epicRef: 67170 },
  ];

interface RawTask {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  status: number;
  status_extra_info?: { name: string; color: string; is_closed?: boolean };
  is_closed: boolean;
}

async function projectContext() {
  const settings = getSettings();
  const [me, project] = await Promise.all([
    taiga<{ id: number; full_name_display?: string; username: string }>(
      '/users/me',
    ),
    taiga<{ id: number; name: string; slug: string }>(
      `/projects/${RELEASE_NOTE_PROJECT_ID}`,
    ),
  ]);
  return {
    me,
    project,
    ctx: {
      baseUrl: settings.taigaBaseUrl,
      projectSlug:
        project.slug || settings.taigaProjectSlug || String(project.id),
    },
  };
}

/** User story milik satu epic; kosong bila epic tidak dapat diakses. */
async function epicStories(epicId: number): Promise<RawReleaseNoteStory[]> {
  return taiga<RawReleaseNoteStory[]>(
    `/userstories?project=${RELEASE_NOTE_PROJECT_ID}&epic=${epicId}`,
    { headers: { 'x-disable-pagination': 'true' } },
  ).catch(() => [] as RawReleaseNoteStory[]);
}

/** Release note dari epic Staging dan Production milik user Taiga aktif. */
export async function getReleaseNotes(): Promise<ReleaseNoteList> {
  const settings = getSettings();
  if (!settings.taigaToken) {
    return emptyReleaseNoteList(RELEASE_NOTE_EPICS);
  }

  const { me, project, ctx } = await projectContext();

  const [stagingId, productionId] = await Promise.all([
    resolveEpicId(project.id, RELEASE_NOTE_EPICS[0].epicRef),
    resolveEpicId(project.id, RELEASE_NOTE_EPICS[1].epicRef),
  ]);

  const storiesPerEpic = await Promise.all(
    [stagingId, productionId].map(epicStories),
  );
  const minePerEpic = storiesPerEpic.map((stories) =>
    stories.filter((story) => isAssignedTo(story, me.id)),
  );

  const seen = new Set<number>();
  const notes: ReleaseNoteSummary[] = [];
  minePerEpic.forEach((stories, index) => {
    for (const story of stories) {
      if (seen.has(story.id)) continue;
      seen.add(story.id);
      notes.push(
        toReleaseNoteSummary(story, ctx, RELEASE_NOTE_EPICS[index].source),
      );
    }
  });

  return {
    project: { id: project.id, name: project.name, slug: project.slug },
    assignee: { id: me.id, name: me.full_name_display || me.username },
    epics: RELEASE_NOTE_EPICS.map((epic, index) => ({
      source: epic.source,
      epicRef: epic.epicRef,
      count: minePerEpic[index].length,
    })),
    notes: sortReleaseNotes(notes),
    needsLogin: false,
  };
}

/** Satu release note beserta task deployment-nya. */
export async function getReleaseNote(
  ref: number,
): Promise<ReleaseNoteDetail | null> {
  const { project, ctx } = await projectContext();
  const story = await taiga<RawReleaseNoteStory>(
    `/userstories/by_ref?ref=${ref}&project=${project.id}`,
  ).catch(() => null);
  if (!story) return null;

  const tasks = await taiga<RawTask[]>(`/tasks?user_story=${story.id}`, {
    headers: { 'x-disable-pagination': 'true' },
  }).catch(() => [] as RawTask[]);

  const timesheets = await Promise.all(
    tasks.map((task) => readTaskTimesheet(task.id, project.id)),
  );

  const source =
    RELEASE_NOTE_EPICS.find((epic) =>
      story.epics?.some((item) => item.ref === epic.epicRef),
    )?.source ?? RELEASE_NOTE_EPICS[0].source;

  return {
    ...toReleaseNoteSummary(story, ctx, source),
    statusId: story.status,
    projectId: project.id,
    description: story.description ?? '',
    tasks: tasks
      .map((task, index) => ({
        id: task.id,
        ref: task.ref,
        subject: task.subject,
        description: task.description ?? '',
        statusId: task.status,
        ...timesheets[index],
        status: {
          name: task.status_extra_info?.name ?? 'Unknown',
          color: task.status_extra_info?.color ?? '#94a3b8',
          isClosed: Boolean(task.is_closed || task.status_extra_info?.is_closed),
        },
        url: `${ctx.baseUrl}/project/${ctx.projectSlug}/task/${task.ref}`,
      }))
      .sort((a, b) => a.ref - b.ref),
  };
}
