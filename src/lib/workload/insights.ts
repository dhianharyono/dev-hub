import type {
  WorkloadDaySummary,
  WorkloadInsight,
  WorkloadTask,
} from './types';

interface GenerateWorkloadInsightsParams {
  statusText: 'Fit' | 'Underload' | 'Overload';
  percentage: number;
  totalTimeSpent: number;
  expectedHours: number;
  workdaysPassed: number;
  tasksWithDetails: WorkloadTask[];
  days: WorkloadDaySummary[];
  isCurrentMonth: boolean;
  currentDayOfMonth: number;
  inProgressCount: number;
  doneCount: number;
}

export function generateWorkloadInsights({
  statusText,
  percentage,
  totalTimeSpent,
  expectedHours,
  workdaysPassed,
  tasksWithDetails,
  days,
  isCurrentMonth,
  currentDayOfMonth,
  inProgressCount,
  doneCount,
}: GenerateWorkloadInsightsParams): WorkloadInsight[] {
  const insights: WorkloadInsight[] = [];

  // Insight 1: 08:00 - 17:00 Weekday Compliance & Workload Percentage
  if (statusText === 'Fit') {
    insights.push({
      tone: 'good',
      text: `Beban kerja Fit (${percentage.toFixed(2)}%): Tercatat ${totalTimeSpent.toFixed(2)} jam dari target wajib ${expectedHours.toFixed(2)} jam (${workdaysPassed} hari kerja berjalan).`,
    });
  } else if (statusText === 'Underload') {
    insights.push({
      tone: 'warn',
      text: `Beban kerja di bawah target (${percentage.toFixed(2)}%): Tercatat ${totalTimeSpent.toFixed(2)} jam, kurang ${(expectedHours - totalTimeSpent).toFixed(2)} jam dari target wajib ${expectedHours.toFixed(2)} jam.`,
    });
  } else {
    insights.push({
      tone: 'warn',
      text: `Potensi overtime/overload (${percentage.toFixed(2)}%): Tercatat ${totalTimeSpent.toFixed(2)} jam dari target wajib ${expectedHours.toFixed(2)} jam.`,
    });
  }

  // Insight 2: Start Time / Jam Kerja Wajib (08:00 - 17:00)
  const onTimeTasks = tasksWithDetails.filter((t) => {
    const hour = parseInt(t.startTime.split(':')[0], 10);
    return !isNaN(hour) && hour >= 8 && hour <= 17;
  });
  if (
    tasksWithDetails.length > 0 &&
    onTimeTasks.length === tasksWithDetails.length
  ) {
    insights.push({
      tone: 'good',
      text: `Ketertiban jam mulai: 100% aktivitas (${tasksWithDetails.length} task) dimulai pada rentang jam kerja wajib (08:00 s.d. 17:00).`,
    });
  } else if (tasksWithDetails.length > 0) {
    const offCount = tasksWithDetails.length - onTimeTasks.length;
    insights.push({
      tone: 'info',
      text: `Terdapat ${offCount} aktivitas tercatat di luar rentang 08:00 - 17:00. Prioritaskan logging aktivitas di rentang jam kerja wajib.`,
    });
  }

  // Insight 3: Daily Consistency (8 hours/weekday)
  const activeWorkdaysList = days.filter(
    (d) =>
      d.isWeekday &&
      (!isCurrentMonth || parseInt(d.date.slice(8), 10) <= currentDayOfMonth),
  );
  const underWorkdays = activeWorkdaysList.filter((d) => d.hoursSpent < 7.5);

  if (underWorkdays.length === 0 && activeWorkdaysList.length > 0) {
    insights.push({
      tone: 'good',
      text: `Konsistensi harian prima: Seluruh ${activeWorkdaysList.length} hari kerja berjalan terisi tepat 8 jam per hari.`,
    });
  } else if (underWorkdays.length > 0) {
    const sampleDates = underWorkdays
      .slice(0, 2)
      .map((d) => d.date.slice(8))
      .join(', ');
    insights.push({
      tone: 'warn',
      text: `Ada ${underWorkdays.length} hari kerja dengan total jam < 8 jam (mis. tanggal ${sampleDates}). Segera lengkapi agar tidak defisit jam kerja.`,
    });
  }

  // Insight 4: Task Status / Penyelesaian
  if (inProgressCount > 0) {
    insights.push({
      tone: 'info',
      text: `Distribusi aktivitas: ${inProgressCount} task sedang berlangsung (In Progress) dan ${doneCount} task telah diselesaikan (Done).`,
    });
  } else if (doneCount > 0) {
    insights.push({
      tone: 'good',
      text: `Penyelesaian aktivitas: Seluruh ${doneCount} task pada periode ini telah diselesaikan (Done).`,
    });
  }

  // Insight 5: Project & WAD Portal Recommendation
  insights.push({
    tone: 'good',
    text: `Saran WAD Portal: Tetap pertahankan pencatatan di Taiga setiap weekday agar status di WAD selalu konsisten "Fit" dan "Super Active User".`,
  });

  return insights;
}
