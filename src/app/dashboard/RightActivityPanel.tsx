'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Settings } from 'lucide-react';
import type { WorkloadData } from '@/lib/workload';
import { getStatusBadgeClass } from './status-utils';
import { ActivityPanelSkeleton } from './DashboardSkeleton';

function formatTimeRange(startTime?: string, hours?: number): string {
  if (!startTime) return '';
  const cleanStart = startTime.trim();
  const safeHours = hours && hours > 0 ? hours : 0;
  if (safeHours === 0) {
    return cleanStart;
  }
  const parts = cleanStart.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return cleanStart;
  }
  const [startH, startM] = parts;
  const totalMinutes = startH * 60 + startM + Math.round(safeHours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  return `${cleanStart} - ${endStr}`;
}

interface RightActivityPanelProps {
  workload: WorkloadData | null;
  connected?: boolean;
  loading?: boolean;
  customHeight?: number;
}

export function RightActivityPanel({
  workload,
  connected = true,
  loading = false,
  customHeight,
}: RightActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'activity' | 'details'>(
    'recent',
  );

  if (loading && !workload) {
    return <ActivityPanelSkeleton customHeight={customHeight} />;
  }

  const isDisconnected = !connected;

  return (
    <aside
      className='card flex flex-col gap-4 flex-1 min-h-0 overflow-hidden max-[1200px]:flex-initial max-[1200px]:min-h-auto'
      aria-label='Linimasa Aktivitas Terkini'
      style={
        customHeight
          ? { height: customHeight, maxHeight: customHeight }
          : undefined
      }
    >
      <div className='flex items-center justify-between pb-1 border-b border-border/60'>
        <h3 className='text-[17px] font-extrabold tracking-tight text-slate-text'>
          Aktivitas Terkini
        </h3>
        {isDisconnected && (
          <span className='badge badge-amber text-[10px] font-bold px-2.5 py-[3px]'>
            Offline
          </span>
        )}
      </div>

      <div
        className='flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60'
        role='tablist'
      >
        <button
          type='button'
          role='tab'
          aria-selected={activeTab === 'recent'}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
            activeTab === 'recent'
              ? 'bg-white text-brand font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('recent')}
        >
          Recent
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={activeTab === 'activity'}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
            activeTab === 'activity'
              ? 'bg-white text-brand font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button
          type='button'
          role='tab'
          aria-selected={activeTab === 'details'}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-all ${
            activeTab === 'details'
              ? 'bg-white text-brand font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:thin] max-[1200px]:max-h-[420px]'>
        {isDisconnected ? (
          <div className='py-8 px-4 text-center'>
            <Clock
              size={28}
              className='text-(--text-3) mx-auto mb-2.5 block'
            />
            <strong className='block text-[13px] text-(--text) mb-1'>
              Taiga Belum Terhubung
            </strong>
            <p className='text-xs text-(--text-2) max-w-[220px] mx-auto mb-3 leading-[1.4]'>
              Hubungkan sesi Taiga di menu Pengaturan untuk melihat linimasa
              aktivitas terkini.
            </p>
            <Link
              href='/settings'
              className='btn btn-secondary btn-sm no-underline inline-flex items-center gap-1.5'
            >
              <Settings size={13} />
              <span>Buka Pengaturan</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Tab 1: Recent Taiga Tasks */}
            {activeTab === 'recent' && (
              <div className='flex flex-col gap-3 relative pl-5 before:content-[""] before:absolute before:top-2 before:bottom-3 before:left-1.5 before:w-0.5 before:bg-slate-200'>
                {workload?.tasks && workload.tasks.length > 0 ? (
                  workload.tasks.slice(0, 15).map((t) => {
                    const cleanSubject = t.subject.replace(
                      /[\u2014\u2013]/g,
                      '-',
                    );
                    return (
                      <div
                        key={`taiga-act-${t.id}`}
                        className='relative flex flex-col gap-2 p-3.5 rounded-xl bg-surface-subtle/70 border border-slate-200/80 shadow-2xs hover:bg-surface-hover hover:border-border transition-all'
                      >
                        <span className='absolute -left-5 top-2 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-brand' />
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='text-[11px] font-bold text-brand'>
                            {t.startTime ? `${formatTimeRange(t.startTime, t.timeSpentHours)} · ` : ''}
                            {t.activityDate
                              ? new Date(
                                  t.activityDate + 'T00:00:00',
                                ).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : 'Terkini'}
                          </span>
                          <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60'>
                            {t.timeSpentHours}h
                          </span>
                        </div>
                        <a
                          href={t.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-[13px] font-bold text-slate-text no-underline leading-snug transition-colors hover:text-brand hover:underline'
                          title={cleanSubject}
                        >
                          {cleanSubject}
                        </a>
                        <div className='flex flex-wrap gap-1.5 items-center mt-1'>
                          <span className='text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60'>
                            #{t.ref}
                          </span>
                          <span className='text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60'>
                            {t.projectName || t.project || 'Taiga'}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${getStatusBadgeClass(t.status)}`}
                          >
                            {t.status || 'Done'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className='p-8 text-center'>
                    <p className='text-xs text-slate-text-3'>
                      Belum ada aktivitas Taiga yang tercatat.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Daily Activity Summary */}
            {activeTab === 'activity' && (
              <div className='flex flex-col gap-3 relative pl-5 before:content-[""] before:absolute before:top-2 before:bottom-3 before:left-1.5 before:w-0.5 before:bg-slate-200'>
                {workload?.days &&
                workload.days.filter((d) => d.tasksCount > 0).length > 0 ? (
                  [...workload.days]
                    .filter((d) => d.tasksCount > 0)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((d) => (
                      <div
                        key={`day-${d.date}`}
                        className='relative flex flex-col gap-2 p-3.5 rounded-xl bg-surface-subtle/70 border border-slate-200/80 shadow-2xs hover:bg-surface-hover hover:border-border transition-all'
                      >
                        <span className='absolute -left-5 top-2 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-brand' />
                        <div className='text-[11px] font-bold text-brand'>
                          {d.dayName},{' '}
                          {new Date(d.date + 'T00:00:00').toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </div>
                        <div className='text-xs font-bold text-slate-text'>
                          {d.tasksCount} tugas ({d.hoursSpent}h dari{' '}
                          {d.targetHours}h)
                        </div>
                        <div className='flex flex-wrap gap-1.5 items-center mt-1'>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                              d.status === 'fit'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : d.status === 'over'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Status: {d.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className='p-8 text-center'>
                    <p className='text-xs text-slate-text-3'>
                      Tidak ada log harian aktif untuk bulan ini.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Taiga Integration Details */}
            {activeTab === 'details' && (
              <div className='flex flex-col gap-2.5 py-1'>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    User
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.user?.name || '-'}
                  </span>
                </div>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    Username
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.user?.username
                      ? `@${workload.user.username}`
                      : '-'}
                  </span>
                </div>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    Status Kepatuhan
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.kpis?.compliance || 'Belum Terdata'}
                  </span>
                </div>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    Total Aktivitas
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.kpis?.activitiesCount || 0} Aktivitas
                  </span>
                </div>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    Jam Kerja Tercatat
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.kpis?.timeSpent || 0}h /{' '}
                    {workload?.kpis?.expectedHours || 0}h
                  </span>
                </div>
                <div className='flex justify-between items-center p-3.5 bg-surface-subtle rounded-xl border border-border'>
                  <span className='text-xs font-semibold text-slate-muted'>
                    Hari Kerja Berjalan
                  </span>
                  <span className='text-[13px] font-bold text-slate-text'>
                    {workload?.kpis?.workdaysPassed || 0} /{' '}
                    {workload?.kpis?.totalMonthWorkdays || 0} Hari
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
