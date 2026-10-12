export interface WorkloadTask {
  id: number;
  ref: number;
  subject: string;
  project: string;
  projectName: string;
  status: string;
  priority: string;
  activityDate: string;
  startTime: string;
  timeSpentHours: number;
  isClosed: boolean;
  updatedAt: string;
  url: string;
}

export interface WorkloadDaySummary {
  date: string;
  dayName: string;
  isWeekday: boolean;
  hoursSpent: number;
  targetHours: number;
  status: 'fit' | 'under' | 'over' | 'off';
  tasksCount: number;
}

export interface WorkloadTrend {
  month: string;
  label: string;
  totalActivities: number;
  workloadPercentage: number;
}

export interface WorkloadInsight {
  tone: 'good' | 'warn' | 'info';
  text: string;
}

export interface WorkloadData {
  month: string;
  monthLabel: string;
  availableMonths: { value: string; label: string }[];
  user: {
    name: string;
    username: string;
    photo: string | null;
  };
  lastUpdated: string;
  kpis: {
    status: 'Fit' | 'Underload' | 'Overload';
    percentage: number;
    compliance: string;
    expectedHours: number;
    timeSpent: number;
    activitiesCount: number;
    workdaysPassed: number;
    totalMonthWorkdays: number;
  };
  assignments: {
    name: string;
    project: string;
    availability: number;
    timeSpent: number;
    notes: string;
  }[];
  statusBreakdown: {
    todo: number;
    inProgress: number;
    done: number;
  };
  trends: WorkloadTrend[];
  days: WorkloadDaySummary[];
  tasks: WorkloadTask[];
  insights: WorkloadInsight[];
}

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export interface RawTaigaTask {
  id: number;
  ref: number;
  subject: string;
  created_date: string;
  modified_date: string;
  project: number;
  project_extra_info?: { id: number; name: string; slug: string };
  status_extra_info?: { name: string; is_closed?: boolean };
  is_closed?: boolean;
}

export interface CustomAttrDef {
  id: number;
  name: string;
  type: string;
}
