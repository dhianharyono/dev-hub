export type ReleaseTarget = 'staging' | 'production';

export interface ReleaseTargetInfo {
  key: ReleaseTarget;
  label: string;
  epicRef: number;
  environment: 'Staging' | 'Production';
}

export const RELEASE_PROJECT_SLUG = 'spa';

export const RELEASE_TARGETS: Record<ReleaseTarget, ReleaseTargetInfo> = {
  staging: {
    key: 'staging',
    label: 'Staging',
    epicRef: 67174,
    environment: 'Staging',
  },
  production: {
    key: 'production',
    label: 'Production',
    epicRef: 67170,
    environment: 'Production',
  },
};

export const RELEASE_TARGET_LIST: ReleaseTargetInfo[] = [
  RELEASE_TARGETS.staging,
  RELEASE_TARGETS.production,
];

export const SQUAD_OPTIONS = [
  'Visit',
  'Discovery',
  'E-Proc',
  'Transaction',
  'Payment',
  'Fulfillment',
  'Disbursement',
  'Core',
  'Financing',
  'Control Tower',
];

export interface TaskTemplate {
  key: string;
  label: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { key: 'fe-deployment', label: '[FE] Deployment' },
  { key: 'be-deployment', label: '[BE] Deployment' },
  { key: 'update-env-vault', label: 'Update Env/Vault' },
  { key: 'update-query-database', label: 'Update Query Database' },
  { key: 'verify-build-smoke', label: 'Verifikasi Build & Smoke Test' },
  { key: 'defect-dojo', label: 'Defect Dojo' },
  { key: 'sonarqube', label: 'SonarQube' },
];

export interface DeploymentTask {
  id: string;
  subject: string;
  template: boolean;
  activityDate: string;
  startTime: string;
  totalTimeSpent: string;
  assigneeId: number | null;
}

let taskSequence = 0;

export function makeDeploymentTask(
  subject: string,
  template: boolean,
): DeploymentTask {
  taskSequence += 1;
  return {
    id: `task-${Date.now()}-${taskSequence}`,
    subject,
    template,
    activityDate: '',
    startTime: '',
    totalTimeSpent: '',
    assigneeId: null,
  };
}

/** YYYY-MM-DD menjadi dd/MM untuk judul user story. */
export function formatReleaseDayMonth(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return '';
  return `${match[3]}/${match[2]}`;
}

export interface StorySubjectInput {
  squad: string;
  releaseDate: string;
  featureName: string;
}

/** Contoh: [Control Tower] (19/11) Deployment Checklist Release Tracker. */
export function buildStorySubject({
  squad,
  releaseDate,
  featureName,
}: StorySubjectInput): string {
  const dayMonth = formatReleaseDayMonth(releaseDate);
  const feature = featureName.trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (!squad.trim() || !dayMonth || !feature) return '';
  return `[${squad.trim()}] (${dayMonth}) Deployment Checklist ${feature}`;
}

/** Tanggal hari ini dalam zona WIB untuk nilai awal form. */
export function todayWib(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export interface ReleaseMember {
  id: number;
  name: string;
  username: string;
}

export interface ReleaseStoryForm {
  target: ReleaseTarget;
  squad: string;
  releaseDate: string;
  featureName: string;
  subject: string;
  description: string;
  assigneeId: number | null;
}

export interface CreatedStory {
  id: number;
  ref: number;
  url: string;
}

export interface CreatedTask {
  subject: string;
  ok: boolean;
  ref?: number;
  url?: string;
  error?: string;
}

export interface ReleaseCreation {
  story: CreatedStory;
  tasks: CreatedTask[];
}

export type ServiceGroup = 'BE' | 'FE' | 'MOBILE' | 'FULLSTACK';

/** Payload task Taiga: custom attribute hanya dikirim bila diisi. */
export interface DeploymentTaskPayload {
  subject: string;
  assignedTo?: number;
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number;
}

export function deploymentTaskPayload(
  task: DeploymentTask,
): DeploymentTaskPayload {
  const payload: DeploymentTaskPayload = { subject: task.subject.trim() };
  if (task.assigneeId !== null) {
    payload.assignedTo = task.assigneeId;
  }
  if (task.activityDate.trim()) {
    payload.activityDate = task.activityDate.trim();
  }
  if (task.startTime.trim()) {
    payload.startTime = task.startTime.trim();
  }
  const minutes = Number(task.totalTimeSpent);
  if (task.totalTimeSpent.trim() && Number.isFinite(minutes)) {
    payload.totalTimeSpentMinutes = minutes;
  }
  return payload;
}

export interface DeploymentFormInput {
  judul: string;
  tiket: string;
  squad: string;
  environment: string;
  picDeveloper: string;
  picQa: string[];
  picHoe: string;
  deployDate: string;
  deployTime: string;
  deployTimeBe: string;
  deployTimeFe: string;
  deployTimeMobile: string;
  envVault: string;
  envVaultBe: string;
  envVaultFe: string;
  databaseTypes: string[];
  databaseName: string;
  tableName: string;
  columnName: string;
  databaseDescription: string;
  fullstackDatabaseTypes: string[];
  fullstackDatabaseName: string;
  fullstackTableName: string;
  fullstackColumnName: string;
  fullstackDatabaseDescription: string;
  firestore: string;
  linkApk: string;
  kafkaMessage: string;
  kafkaConsumer: string;
  kafkaProducer: string;
  kafkaTopic: string;
  /** Nama service form -> link MR. Service tanpa isian tidak dikirim. */
  services: Record<string, string>;
}

export interface ReleaseOptions {
  project: { id: number; name: string; slug: string };
  members: ReleaseMember[];
  /** Link form Deployment dari Pengaturan, atau default bawaan. */
  formUrl: string;
}
