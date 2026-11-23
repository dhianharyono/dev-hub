'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock,
  Flame,
  ListChecks,
  Settings,
} from 'lucide-react';
import type { WorkloadData, WorkloadDaySummary } from '@/lib/workload';
import {
  DAILY_TARGET_META,
  formatDailyTargetPill,
  resolveDailyTargetStatus,
} from '@/lib/workload/daily-target';
import { CalendarSkeletonCard } from './DashboardSkeleton';

interface WorkloadCalendarCardProps {
  workload: WorkloadData | null;
  connected?: boolean;
  currentMonth: string; // Format 'YYYY-MM'
  onMonthChange: (newMonth: string) => void;
  loading?: boolean;
}

type ComplianceStatus =
  | 'fit'
  | 'over'
  | 'under'
  | 'empty'
  | 'holiday'
  | 'future';

interface DayStatusMeta {
  color: string;
  bgClass: string;
  pillClass: string;
  label: string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<ComplianceStatus, DayStatusMeta> = {
  fit: { ...DAILY_TARGET_META.fit, badgeClass: 'badge-emerald' },
  over: { ...DAILY_TARGET_META.over, badgeClass: 'badge-violet' },
  under: { ...DAILY_TARGET_META.under, badgeClass: 'badge-amber' },
  empty: { ...DAILY_TARGET_META.empty, badgeClass: 'badge-rose' },
  holiday: {
    color: '#60a5fa',
    bgClass: 'bg-blue-400',
    pillClass: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Akhir Pekan / Libur',
    badgeClass: 'badge-cyan',
  },
  future: {
    color: '#cbd5e1',
    bgClass: 'bg-slate-300',
    pillClass: 'bg-slate-50 text-slate-700 border-slate-200',
    label: 'Mendatang',
    badgeClass: 'badge-neutral',
  },
};

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function WorkloadCalendarCard({
  workload,
  connected = true,
  currentMonth,
  onMonthChange,
  loading = false,
}: WorkloadCalendarCardProps) {
  const isDisconnected = !connected;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Parse currentMonth YYYY-MM
  const { year, monthIdx, monthTitle } = useMemo(() => {
    const [yStr, mStr] = currentMonth.split('-');
    const y = parseInt(yStr, 10) || new Date().getFullYear();
    const m = (parseInt(mStr, 10) || 1) - 1;
    const title = new Date(y, m, 1).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
    return { year: y, monthIdx: m, monthTitle: title };
  }, [currentMonth]);

  // Handle month prev/next
  const handlePrevMonth = () => {
    const prevDate = new Date(year, monthIdx - 1, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedDate(null);
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, monthIdx + 1, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedDate(null);
    onMonthChange(newMonth);
  };

  // Map of days from workload data
  const daysMap = useMemo(() => {
    const map = new Map<string, WorkloadDaySummary>();
    if (workload?.days) {
      for (const d of workload.days) {
        map.set(d.date, d);
      }
    }
    return map;
  }, [workload]);

  // Ringkasan bulan berjalan, dihitung dari data kalender yang sudah ada
  const monthSummary = useMemo(() => {
    const days = workload?.days ?? [];
    if (!workload || days.length === 0) return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const elapsed = days.filter((d) => d.date <= todayStr);
    const weekdays = elapsed.filter((d) => d.isWeekday);
    const fit = weekdays.filter((d) => d.status === 'fit').length;
    const workdays = workload.kpis.workdaysPassed;
    return {
      hours: workload.kpis.timeSpent,
      fit,
      over: elapsed.filter((d) => d.status === 'over').length,
      noLog: weekdays.filter((d) => d.hoursSpent === 0).length,
      workdays,
      tasks: workload.tasks.length,
      fitPct: workdays > 0 ? Math.round((fit / workdays) * 100) : 0,
    };
  }, [workload]);

  // Calendar dates structure
  const { calendarCells, activeSelectedDate } = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isViewingCurrentMonth =
      now.getFullYear() === year && now.getMonth() === monthIdx;

    const firstDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(year, monthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

    interface CellData {
      key: string;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      status: ComplianceStatus;
      daySummary?: WorkloadDaySummary;
      isToday: boolean;
    }

    const cells: CellData[] = [];

    // 1. Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = monthIdx === 0 ? 12 : monthIdx;
      const prevY = monthIdx === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        key: `prev-${dateStr}`,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        status: 'future',
        isToday: false,
      });
    }

    // 2. Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
      const isToday = isViewingCurrentMonth && d === now.getDate();
      const isPastOrToday =
        !isViewingCurrentMonth ||
        year < now.getFullYear() ||
        (year === now.getFullYear() && monthIdx < now.getMonth()) ||
        d <= now.getDate();

      const summary = daysMap.get(dateStr);
      const isWeekday =
        new Date(year, monthIdx, d).getDay() >= 1 &&
        new Date(year, monthIdx, d).getDay() <= 5;

      let status: ComplianceStatus = 'future';

      if (!isPastOrToday) {
        status = 'future';
      } else if (!isWeekday) {
        status = summary && summary.hoursSpent > 0 ? 'over' : 'holiday';
      } else {
        status = resolveDailyTargetStatus(
          summary ? summary.hoursSpent : 0,
        );
      }

      cells.push({
        key: `cur-${dateStr}`,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        status,
        daySummary: summary,
        isToday,
      });
    }

    // 3. Trailing days for next month to complete the grid cleanly
    const totalCells = cells.length;
    const targetTotal = Math.ceil(totalCells / 7) * 7;
    const nextMonthFillerCount = targetTotal - totalCells;

    for (let nextD = 1; nextD <= nextMonthFillerCount; nextD++) {
      const nextM = monthIdx === 11 ? 1 : monthIdx + 2;
      const nextY = monthIdx === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
      cells.push({
        key: `next-${dateStr}`,
        dateStr,
        dayNumber: nextD,
        isCurrentMonth: false,
        status: 'future',
        isToday: false,
      });
    }

    // Active selected date fallback: selectedDate or today if current month or first day
    let active = selectedDate;
    if (!active) {
      if (isViewingCurrentMonth) {
        active = todayStr;
      } else {
        active = `${currentMonth}-01`;
      }
    }

    return { calendarCells: cells, activeSelectedDate: active };
  }, [year, monthIdx, currentMonth, daysMap, selectedDate]);

  // Selected date info for the details strip
  const activeDetail = useMemo(() => {
    if (!activeSelectedDate) return null;
    const summary = daysMap.get(activeSelectedDate);
    const [, , dStr] = activeSelectedDate.split('-');
    const dayNum = parseInt(dStr, 10);
    const dateObj = new Date(activeSelectedDate + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isWeekday = dateObj.getDay() >= 1 && dateObj.getDay() <= 5;
    const hours = summary ? summary.hoursSpent : 0;
    const tasksCount = summary ? summary.tasksCount : 0;

    let status: ComplianceStatus = 'future';
    const now = new Date();
    const isPastOrToday = dateObj <= now;

    if (!isPastOrToday) {
      status = 'future';
    } else if (!isWeekday) {
      status = hours > 0 ? 'over' : 'holiday';
    } else {
      status = resolveDailyTargetStatus(hours);
    }

    return {
      dateStr: activeSelectedDate,
      dayNum,
      dayName,
      formattedDate,
      hours,
      tasksCount,
      status,
      meta: STATUS_CONFIG[status],
    };
  }, [activeSelectedDate, daysMap]);

  if (loading && !workload) {
    return <CalendarSkeletonCard />;
  }

  return (
    <div
      className='card flex flex-col gap-4 h-full'
      aria-label='Kalender Kepatuhan Jam Kerja Harian'
    >
      {/* Calendar Header with Navigation */}
      <div className='flex items-center justify-between gap-3 pb-1 border-b border-border/60'>
        <div>
          <h3 className='text-base font-bold tracking-tight text-slate-text m-0 leading-tight'>
            Tugas Harian
          </h3>
        </div>

        {isDisconnected ? (
          <span className='badge badge-amber text-[10px] font-bold px-2.5 py-[3px]'>
            Offline
          </span>
        ) : (
          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              className='w-8 h-8 rounded-lg border border-border bg-surface text-slate-text-2 grid place-items-center cursor-pointer transition-all hover:bg-surface-hover hover:text-slate-text hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1'
              onClick={handlePrevMonth}
              aria-label='Bulan sebelumnya'
              title='Bulan sebelumnya'
            >
              <ChevronLeft size={16} />
            </button>
            <span className='text-[13px] font-bold text-slate-text px-1 min-w-[105px] text-center capitalize'>
              {monthTitle}
            </span>
            <button
              type='button'
              className='w-8 h-8 rounded-lg border border-border bg-surface text-slate-text-2 grid place-items-center cursor-pointer transition-all hover:bg-surface-hover hover:text-slate-text hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1'
              onClick={handleNextMonth}
              aria-label='Bulan berikutnya'
              title='Bulan berikutnya'
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isDisconnected ? (
        <div className='p-8 text-center flex flex-col items-center justify-center gap-2'>
          <Clock size={28} className='text-slate-400 mb-1' />
          <strong className='text-[13px] font-bold text-slate-text block'>
            Kalender WAD Belum Aktif
          </strong>
          <p className='text-xs text-slate-muted max-w-[240px] leading-relaxed mb-2'>
            Pelacakan jam kerja harian pada kalender memerlukan integrasi akun
            Taiga yang terhubung.
          </p>
          <Link
            href='/settings'
            className='btn btn-secondary btn-sm inline-flex items-center gap-2 text-xs no-underline'
          >
            <Settings size={13} />
            <span>Buka Pengaturan</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Weekday Column Headers */}
          <div className='grid grid-cols-7 gap-1.5 text-center' role='row'>
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className='text-[10px] font-bold text-slate-text-3 tracking-wider py-1'
                role='columnheader'
              >
                {day}
              </div>
            ))}
          </div>

          {/* 7-Column Calendar Grid */}
          <div
            className={`grid grid-cols-7 gap-1.5 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
            role='grid'
            aria-label={`Kalender ${monthTitle}`}
          >
            {calendarCells.map((cell) => {
              const isSelected =
                cell.dateStr === activeSelectedDate && cell.isCurrentMonth;
              const statusMeta = STATUS_CONFIG[cell.status];

              return (
                <button
                  key={cell.key}
                  type='button'
                  role='gridcell'
                  tabIndex={cell.isCurrentMonth ? 0 : -1}
                  aria-selected={isSelected}
                  disabled={!cell.isCurrentMonth}
                  onClick={() => {
                    if (cell.isCurrentMonth) {
                      setSelectedDate(cell.dateStr);
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center min-h-[42px] rounded-xl bg-white border border-slate-100 cursor-pointer p-1.5 relative transition-all duration-150 select-none hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-1 disabled:cursor-default
                    ${!cell.isCurrentMonth ? '!bg-slate-50/50 !border-transparent !cursor-default opacity-45 hover:!transform-none' : ''}
                    ${isSelected ? '!border-[1.5px] !border-brand !bg-white shadow-[0_2px_8px_rgba(25,119,243,0.16)] -translate-y-px' : ''}
                    ${cell.isToday && !isSelected ? '!bg-blue-50/70 !border-blue-200' : ''}
                  `}
                  title={
                    cell.isCurrentMonth
                      ? `${cell.dayNumber} ${monthTitle}: ${statusMeta.label}`
                      : ''
                  }
                >
                  <span
                    className={`text-[12.5px] leading-none mb-1.5 ${isSelected
                        ? 'text-brand font-extrabold'
                        : cell.isToday
                          ? 'text-brand font-bold'
                          : !cell.isCurrentMonth
                            ? 'text-slate-400 font-normal'
                            : 'text-slate-text font-semibold'
                      }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.isCurrentMonth && cell.status !== 'future' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full block ${statusMeta.bgClass}`}
                      aria-hidden='true'
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Quick Details Strip */}
          {activeDetail && (
            <div className='bg-slate-50/80 border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 mt-1'>
              <div className='flex flex-col gap-0.5 min-w-0'>
                <div className='text-[11.5px] font-bold text-slate-text truncate'>
                  <span>
                    {activeDetail.dayName}, {activeDetail.formattedDate}
                  </span>
                </div>
                <div className='flex items-center gap-1.5 text-[10.5px] text-slate-text-2'>
                  <span className='text-slate-text'>
                    <Clock size={12} className='inline mr-1 -translate-y-px' />
                    <strong>{activeDetail.hours}h</strong> tercatat
                  </span>
                  <span className='text-slate-text-3'>·</span>
                  <span className='text-slate-text-2'>
                    {activeDetail.tasksCount} task Taiga
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${activeDetail.meta.pillClass}`}
              >
                {activeDetail.status === 'holiday' ||
                activeDetail.status === 'future'
                  ? activeDetail.meta.label
                  : formatDailyTargetPill(
                      activeDetail.status,
                      activeDetail.hours,
                    )}
              </span>
            </div>
          )}

          {/* Status Legend */}
          <div className='flex items-center justify-between gap-1.5 flex-wrap border-t border-border pt-2.5 mt-0.5'>
            <div className='flex items-center gap-1 text-[10.5px] font-semibold text-slate-text-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${STATUS_CONFIG.fit.bgClass}`}
              />
              <span>Sesuai</span>
            </div>
            <div className='flex items-center gap-1 text-[10.5px] font-semibold text-slate-text-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${STATUS_CONFIG.over.bgClass}`}
              />
              <span>Lembur</span>
            </div>
            <div className='flex items-center gap-1 text-[10.5px] font-semibold text-slate-text-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${STATUS_CONFIG.under.bgClass}`}
              />
              <span>Kurang</span>
            </div>
            <div className='flex items-center gap-1 text-[10.5px] font-semibold text-slate-text-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${STATUS_CONFIG.empty.bgClass}`}
              />
              <span>Belum Log</span>
            </div>
            <div className='flex items-center gap-1 text-[10.5px] font-semibold text-slate-text-2'>
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${STATUS_CONFIG.holiday.bgClass}`}
              />
              <span>Libur</span>
            </div>
          </div>

          {monthSummary && (
            <div className='flex flex-1 flex-col justify-between gap-2.5 rounded-xl border border-border bg-slate-50/70 p-3 mt-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-slate-text-2'>
                  Ringkasan Bulan Berjalan
                </span>
                <span className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-text-2'>
                  <ListChecks size={11} className='text-brand' />
                  {monthSummary.tasks} task
                </span>
              </div>

              <div className='flex flex-col gap-2'>
                <div className='flex items-end justify-between gap-2'>
                  <div className='flex items-baseline gap-1.5 min-w-0'>
                    <span className='text-[26px] font-extrabold leading-none text-slate-text tabular-nums'>
                      {monthSummary.hours}
                      <span className='ml-0.5 text-[13px] font-bold text-slate-text-2'>
                        h
                      </span>
                    </span>
                    <span className='text-[10.5px] font-semibold text-slate-muted pb-0.5 truncate'>
                      jam tercatat
                    </span>
                  </div>
                  <span className='text-[11px] font-bold text-emerald-700 tabular-nums whitespace-nowrap'>
                    {monthSummary.fitPct}% sesuai target
                  </span>
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all'
                    style={{
                      width: `${Math.min(100, monthSummary.fitPct)}%`,
                    }}
                  />
                </div>
                <span className='text-[10px] font-semibold text-slate-muted'>
                  {monthSummary.fit} dari {monthSummary.workdays} hari kerja
                  berjalan sesuai target
                </span>
              </div>

              <div className='grid grid-cols-3 gap-2.5'>
                {[
                  {
                    label: 'Sesuai',
                    value: monthSummary.fit,
                    icon: CheckCircle2,
                    iconClass: 'text-emerald-500',
                  },
                  {
                    label: 'Lembur',
                    value: monthSummary.over,
                    icon: Flame,
                    iconClass: 'text-violet-500',
                  },
                  {
                    label: 'Belum log',
                    value: monthSummary.noLog,
                    icon: CircleDashed,
                    iconClass: 'text-rose-500',
                  },
                ].map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <div
                      key={tile.label}
                      className='flex flex-col justify-between gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5'
                    >
                      <span className='flex items-start gap-1 text-[10px] font-bold leading-tight tracking-normal text-slate-muted'>
                        <Icon
                          size={11}
                          className={`${tile.iconClass} shrink-0 mt-0.5`}
                        />
                        <span className='min-w-0'>{tile.label}</span>
                      </span>
                      <span className='flex items-baseline gap-1 text-slate-text'>
                        <span className='text-[18px] font-extrabold leading-none tabular-nums'>
                          {tile.value}
                        </span>
                        <span className='text-[10px] font-semibold text-slate-muted'>
                          hari
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
