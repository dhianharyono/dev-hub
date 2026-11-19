export const DAILY_TARGET_HOURS = 8;

const FIT_MIN_HOURS = 7.5;
const FIT_MAX_HOURS = 8.5;

export type DailyTargetStatus = 'fit' | 'over' | 'under' | 'empty';

export interface DailyTargetMeta {
  label: string;
  pillClass: string;
  bgClass: string;
  color: string;
}

/** Tampilan status kepatuhan jam kerja harian (target 8 jam). */
export const DAILY_TARGET_META: Record<DailyTargetStatus, DailyTargetMeta> = {
  fit: {
    color: '#10b981',
    bgClass: 'bg-emerald-500',
    pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Sesuai Target (8h)',
  },
  over: {
    color: '#8b5cf6',
    bgClass: 'bg-violet-500',
    pillClass: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Lembur (>8h)',
  },
  under: {
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
    pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Kurang Jam',
  },
  empty: {
    color: '#ef4444',
    bgClass: 'bg-red-500',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Belum Ada Task (0h)',
  },
};

const hourFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
});

/** Status kepatuhan jam kerja untuk satu hari kerja. */
export function resolveDailyTargetStatus(hours: number): DailyTargetStatus {
  if (hours >= FIT_MIN_HOURS && hours <= FIT_MAX_HOURS) return 'fit';
  if (hours > FIT_MAX_HOURS) return 'over';
  if (hours > 0) return 'under';
  return 'empty';
}

/** Teks pill status: 'Kurang X jam' saat kurang, label status lainnya. */
export function formatDailyTargetPill(
  status: DailyTargetStatus,
  hours: number,
): string {
  if (status === 'under') {
    return `Kurang ${hourFormatter.format(Math.max(0, DAILY_TARGET_HOURS - hours))} jam`;
  }
  return DAILY_TARGET_META[status].label;
}
