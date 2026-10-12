export interface Status {
  id: number;
  name: string;
  color: string;
  is_closed: boolean;
}

export interface UserStory {
  id: number;
  ref: number;
  subject: string;
  status_extra_info?: { name: string; color: string };
}

export interface ProjectRef {
  id: number;
  name: string;
  slug: string;
}

export interface Meta {
  me: { id: number; full_name_display: string; username: string };
  projects: ProjectRef[];
  project: { id: number; name: string; slug: string };
  milestones: { id: number; name: string; slug: string }[];
  sprint: { id: number; name: string; slug: string } | null;
  userStories: UserStory[];
  usStatuses: Status[];
  taskStatuses: Status[];
  baseUrl: string;
}

export interface Draft {
  key: string;
  selected: boolean;
  kind: 'userstory' | 'task';
  subject: string;
  description: string;
  userStoryId: number | null;
  statusId: number | null;
  assignToMe: boolean;
  tags: string[];
  estimateHours: number | null;
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
}

export interface Result {
  ok: boolean;
  subject: string;
  url?: string;
  ref?: number;
  error?: string;
}

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '20:00',
];

export const EXAMPLES = [
  {
    title: 'Standup & Daily Progress',
    desc: 'Catatan harian standup, review MR squad, dan perbaikan bug',
    text: '1. Daily standup tim (0.5 jam)\n2. Fix bug login expired di PadiUMKM (2 jam)\n3. Review MR mycarrier api-contract (1 jam)\n4. Integrasi endpoint payment gateway (3 jam)',
  },
  {
    title: 'Bugfix & Data Pipeline',
    desc: 'Perbaikan DAG Airflow dan query sinkronisasi BigQuery',
    text: 'pagi daily standup 15mnt, lanjut fix bug dag airflow yg gagal load data ke bigquery (2 jam), siang review MR temen utk api contract mycarrier',
  },
  {
    title: 'Feature & Unit Testing',
    desc: 'Endpoint baru catalog, unit test, dan sprint planning',
    text: 'bikin endpoint baru get list customer di mytens catalog + unit test, estimasi 4 jam. sore meeting sama PM bahas sprint planning',
  },
];

export const uid = () => Math.random().toString(36).slice(2, 9);
