import 'server-only';
import { taiga, TaigaError, type TaigaMember } from '@/lib/taiga';
import { getSettings } from '@/lib/settings';
import { resolveDeploymentFormUrl } from './form';
import { RELEASE_PROJECT_SLUG, type ReleaseOptions } from './model';

interface ProjectRef {
  id: number;
  name: string;
  slug: string;
}

/** Mencari project SPA lewat slug, lalu daftar project sebagai cadangan. */
export async function resolveReleaseProject(): Promise<ProjectRef> {
  try {
    const project = await taiga<ProjectRef>(
      `/projects/by_slug?slug=${RELEASE_PROJECT_SLUG}`,
    );
    if (project?.id) {
      return { id: project.id, name: project.name, slug: project.slug };
    }
  } catch {
    // Sebagian deployment Taiga tidak menyediakan by_slug.
  }

  const projects = await taiga<ProjectRef[]>('/projects').catch(
    () => [] as ProjectRef[],
  );
  const found =
    projects.find(
      (item) => item.slug.toLowerCase() === RELEASE_PROJECT_SLUG,
    ) ??
    projects.find(
      (item) => /padiumkm/i.test(item.name) && /\bspa\b/i.test(item.name),
    );
  if (!found) {
    throw new TaigaError(
      `Project ${RELEASE_PROJECT_SLUG.toUpperCase()} tidak ditemukan untuk akun Taiga ini.`,
      404,
    );
  }
  return { id: found.id, name: found.name, slug: found.slug };
}

/** Data awal halaman: project SPA tujuan dan daftar anggotanya. */
export async function getReleaseOptions(): Promise<ReleaseOptions> {
  const project = await resolveReleaseProject();
  const detail = await taiga<{ members?: TaigaMember[] }>(
    `/projects/${project.id}`,
  ).catch(() => ({ members: [] as TaigaMember[] }));

  const members = (detail.members ?? [])
    .map((member) => ({
      id: member.id,
      name: member.full_name_display || member.username,
      username: member.username,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    project,
    members,
    formUrl: resolveDeploymentFormUrl(getSettings().deploymentFormUrl),
  };
}
