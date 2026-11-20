'use client';

import { useEffect, useState } from 'react';
import {
  DAILY_TARGET_HOURS,
  DAILY_TARGET_META,
  formatDailyTargetPill,
  resolveDailyTargetStatus,
} from '@/lib/workload/daily-target';
import type { WorkloadData } from '@/lib/workload/types';

function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function SmartTaskTodayCoveragePill() {
  const [hours, setHours] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch('/api/workload')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Gagal memuat data workload');
        }
        return payload as WorkloadData;
      })
      .then((data) => {
        if (ignore) return;
        const today = data.days.find((day) => day.date === todayKey());
        setHours(today?.hoursSpent ?? 0);
      })
      .catch(() => {
        // Pill disembunyikan bila data jam tidak tersedia.
      });
    return () => {
      ignore = true;
    };
  }, []);

  const daily =
    hours === null
      ? null
      : { hours, status: resolveDailyTargetStatus(hours) };

  if (!daily) return null;

  return (
    <span
      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${DAILY_TARGET_META[daily.status].pillClass}`}
      aria-label='Jam kerja yang sudah tercover hari ini'
      title={`${daily.hours}h dari target ${DAILY_TARGET_HOURS} jam`}
    >
      {daily.hours}h · {formatDailyTargetPill(daily.status, daily.hours)}
    </span>
  );
}
