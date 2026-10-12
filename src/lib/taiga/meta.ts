import "server-only";
import { getSettings } from "../settings";
import { taiga } from "./client";
import {
  TaigaError,
  type TaigaCustomAttribute,
  type TaigaMember,
  type TaigaMeta,
  type TaigaMilestone,
  type TaigaProjectRef,
  type TaigaStatus,
  type TaigaUserStory,
} from "./types";

export async function getMeta(projectSlug?: string, sprintSlug?: string): Promise<TaigaMeta> {
  const s = getSettings();
  const me = await taiga<TaigaMeta["me"]>("/users/me");

  let userProjects: TaigaProjectRef[] = [];
  try {
    userProjects = await taiga<TaigaProjectRef[]>(`/projects?member=${me.id}&order_by=user_order`);
  } catch {
    try {
      userProjects = await taiga<TaigaProjectRef[]>("/projects");
    } catch {}
  }

  const targetSlug = projectSlug || s.taigaProjectSlug || userProjects[0]?.slug;
  if (!targetSlug) {
    throw new TaigaError(
      "Tidak ada project Taiga yang terafiliasi dengan akun Anda. Pastikan akun sudah ditambahkan ke minimal 1 project di Taiga.",
      404,
    );
  }

  const project = await taiga<{
    id: number;
    name: string;
    slug: string;
    us_statuses: TaigaStatus[];
    task_statuses: TaigaStatus[];
    members: TaigaMember[];
  }>(`/projects/by_slug?slug=${encodeURIComponent(targetSlug)}`);

  if (!userProjects.some((p) => p.id === project.id)) {
    userProjects.unshift({ id: project.id, name: project.name, slug: project.slug });
  }

  const [milestones, customAttrs] = await Promise.all([
    taiga<TaigaMilestone[]>(`/milestones?project=${project.id}&closed=false`).catch(() => [] as TaigaMilestone[]),
    taiga<TaigaCustomAttribute[]>(`/task-custom-attributes?project=${project.id}`).catch(() => [] as TaigaCustomAttribute[]),
  ]);

  const isBacklog = sprintSlug === 'backlog';
  const wanted = isBacklog
    ? undefined
    : (sprintSlug || (s.taigaSprintSlug && project.slug === s.taigaProjectSlug ? s.taigaSprintSlug : undefined));
  const sprint = (!isBacklog && wanted ? milestones.find((m) => m.slug === wanted) : (!isBacklog ? milestones[0] : null)) ?? null;
  const [userStories, rawTasks] = await Promise.all([
    sprint
      ? taiga<TaigaUserStory[]>(`/userstories?project=${project.id}&milestone=${sprint.id}`).catch(() => [] as TaigaUserStory[])
      : taiga<TaigaUserStory[]>(`/userstories?project=${project.id}&milestone__isnull=true&status__is_closed=false`).catch(() => [] as TaigaUserStory[]),
    sprint
      ? taiga<
          {
            id: number;
            ref: number;
            subject: string;
            status: number;
            status_extra_info?: { name: string; color: string };
            user_story: number | null;
            user_story_extra_info?: { id: number; ref: number; subject: string };
            assigned_to: number | null;
            is_closed: boolean;
          }[]
        >(`/tasks?project=${project.id}&milestone=${sprint.id}`).catch(() => [])
      : taiga<
          {
            id: number;
            ref: number;
            subject: string;
            status: number;
            status_extra_info?: { name: string; color: string };
            user_story: number | null;
            user_story_extra_info?: { id: number; ref: number; subject: string };
            assigned_to: number | null;
            is_closed: boolean;
          }[]
        >(`/tasks?project=${project.id}&status__is_closed=false`).catch(() => []),
  ]);

  return {
    me,
    projects: userProjects.map(({ id, name, slug, description, logo_small_url }) => ({
      id,
      name,
      slug,
      description,
      logo_small_url,
    })),
    project: { id: project.id, name: project.name, slug: project.slug },
    milestones: milestones.map(({ id, name, slug, closed, estimated_start, estimated_finish }) => ({
      id,
      name,
      slug,
      closed,
      estimated_start,
      estimated_finish,
    })),
    sprint,
    userStories: userStories
      .filter((u) => !u.is_closed)
      .map(({ id, ref, subject, status, status_extra_info, milestone, assigned_to, is_closed }) => ({
        id,
        ref,
        subject,
        status,
        status_extra_info,
        milestone,
        assigned_to,
        is_closed,
      })),
    tasks: (rawTasks || [])
      .filter((t) => !t.is_closed)
      .filter((t) => {
        if (!isBacklog) return true;
        return (t.user_story && userStories.some((u) => u.id === t.user_story)) || !t.user_story;
      })
      .map((t) => ({
        id: t.id,
        ref: t.ref,
        subject: t.subject,
        status: t.status,
        status_extra_info: t.status_extra_info,
        userStoryId: t.user_story ?? null,
        userStoryRef: t.user_story_extra_info?.ref ?? null,
        assigned_to: t.assigned_to ?? null,
        is_closed: Boolean(t.is_closed),
      })),
    usStatuses: [...project.us_statuses].sort((a, b) => a.order - b.order),
    taskStatuses: [...project.task_statuses].sort((a, b) => a.order - b.order),
    taskCustomAttributes: customAttrs,
    members: project.members.map(({ id, full_name_display, username, photo }) => ({ id, full_name_display, username, photo })),
    baseUrl: s.taigaBaseUrl,
  };
}
