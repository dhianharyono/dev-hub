export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class TaigaError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export interface TaigaStatus {
  id: number;
  name: string;
  color: string;
  is_closed: boolean;
  order: number;
}

export interface TaigaMember {
  id: number;
  full_name_display: string;
  username: string;
  photo: string | null;
}

export interface TaigaUserStory {
  id: number;
  ref: number;
  subject: string;
  status: number;
  status_extra_info?: { name: string; color: string };
  milestone: number | null;
  assigned_to: number | null;
  is_closed: boolean;
}

export interface TaigaMilestone {
  id: number;
  name: string;
  slug: string;
  closed: boolean;
  estimated_start: string;
  estimated_finish: string;
}

export interface TaigaProjectRef {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_small_url?: string | null;
}

export interface TaigaCustomAttribute {
  id: number;
  name: string;
  type: string;
  extra?: unknown;
}

export interface TaigaTaskRef {
  id: number;
  ref: number;
  subject: string;
  status: number;
  status_extra_info?: { name: string; color: string };
  userStoryId: number | null;
  userStoryRef: number | null;
  assigned_to: number | null;
  is_closed: boolean;
}

export interface TaigaMeta {
  me: { id: number; full_name_display: string; username: string; photo: string | null };
  projects: TaigaProjectRef[];
  project: { id: number; name: string; slug: string };
  milestones: TaigaMilestone[];
  sprint: TaigaMilestone | null;
  userStories: TaigaUserStory[];
  tasks: TaigaTaskRef[];
  usStatuses: TaigaStatus[];
  taskStatuses: TaigaStatus[];
  taskCustomAttributes: TaigaCustomAttribute[];
  members: TaigaMember[];
  baseUrl: string;
}

export interface CreateItem {
  kind: "userstory" | "task";
  subject: string;
  description?: string;
  userStoryId?: number | null;
  statusId?: number | null;
  assignedTo?: number | null;
  tags?: string[];
  milestoneId?: number | null;
  projectSlug?: string;
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number;
}

export interface UpdateTaskPayload {
  subject?: string;
  description?: string;
  statusId?: number | null;
  assignedTo?: number | null;
  userStoryId?: number | null;
  projectId?: number;
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number | null;
  hours?: number | null;
  isClosed?: boolean;
}

/**
 * Cleans and converts raw Taiga error responses (especially HTML from Cloudflare challenges or 5xx pages)
 * into friendly, actionable human-readable messages.
 */
export function cleanTaigaErrorMessage(raw: string, status?: number): string {
  if (!raw) {
    return status ? `Taiga mengembalikan HTTP ${status}` : 'Terjadi kendala koneksi ke Taiga.';
  }

  const trimmed = raw.trim();
  const content = trimmed.replace(/^Taiga:\s*/i, '').trim();

  // Cloudflare Challenge / Bot Protection detection (e.g. "Just a moment...", Turnstile, Managed Challenge)
  const isCloudflare =
    content.includes('Just a moment...') ||
    content.includes('Tunggu sebentar...') ||
    content.includes('challenges.cloudflare.com') ||
    content.includes('cf-mitigated') ||
    (content.toLowerCase().includes('cloudflare') && (content.includes('<html') || content.includes('<!DOCTYPE'))) ||
    (content.includes('<!DOCTYPE html') &&
      (content.includes('Just a moment') || status === 403 || status === 503 || !status));

  if (isCloudflare) {
    return 'Koneksi ke Taiga terhalang verifikasi keamanan Cloudflare ("Just a moment..."). Silakan buka URL Taiga di browser Google Chrome, selesaikan verifikasi sampai halaman terbuka normal, lalu coba lagi.';
  }

  // General HTML error page (e.g. 502/504 Bad Gateway from Nginx / Reverse Proxy)
  if (content.includes('<!DOCTYPE') || (content.includes('<html') && content.includes('</html'))) {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${status || 'Server'} Error`;
    return `Server Taiga mengembalikan halaman HTML (${title}). Pastikan Base URL Taiga benar dan server aktif.`;
  }

  return trimmed;
}


