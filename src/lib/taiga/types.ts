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
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number | null;
  hours?: number | null;
  isClosed?: boolean;
}

