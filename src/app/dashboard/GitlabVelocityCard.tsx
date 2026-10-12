'use client';

import Link from 'next/link';
import { GitBranch, Settings } from 'lucide-react';
import type { MetricsData } from '@/components/hooks';
import { EmptyState } from '@/components/EmptyState';
import { GitlabActivitySection } from './GitlabActivitySection';
import { GitlabSkeletonCard } from './DashboardSkeleton';

interface GitlabVelocityCardProps {
  metrics: MetricsData | null;
  connected?: boolean;
  loading: boolean;
  error: string | null;
  days?: number;
  onDaysChange?: (days: number) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

function formatWeekLabel(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function GitlabVelocityCard({
  metrics,
  connected = true,
  loading,
  error,
  days = 90,
}: GitlabVelocityCardProps) {
  if (loading) {
    return <GitlabSkeletonCard />;
  }

  const isDisconnected = !connected;

  const score = metrics?.scores?.overall ?? 0;
  const grade = metrics?.scores?.grade ?? '-';
  const gradeLabel = metrics?.scores?.gradeLabel ?? 'Belum ada data';
  const productivity = metrics?.scores?.productivity ?? 0;
  const consistency = metrics?.scores?.consistency ?? 0;
  const collaboration = metrics?.scores?.collaboration ?? 0;
  const quality = metrics?.scores?.quality ?? 0;

  const pillars = [
    { label: 'Produktivitas', val: productivity, colorClass: 'bg-emerald-500' },
    { label: 'Konsistensi', val: consistency, colorClass: 'bg-blue-500' },
    { label: 'Kolaborasi', val: collaboration, colorClass: 'bg-amber-500' },
    { label: 'Kualitas', val: quality, colorClass: 'bg-violet-500' },
  ];

  const weeklyList = (metrics?.weekly || []).slice(-6);
  const maxWeeklyCommits = Math.max(...weeklyList.map((w) => w.commits), 1);
  const daysLabel = days === 180 ? '6 bulan terakhir' : `${days} hari terakhir`;

  return (
    <section
      className='card flex flex-col gap-5'
      aria-label='GitLab Velocity dan Kode'
    >
      {/* Header */}
      <div className='flex flex-col gap-1 pb-3.5 border-b border-border'>
        <div className='flex gap-2.5 flex-wrap sm:flex-nowrap'>
          <h2 className='text-base font-bold tracking-tight text-slate-text whitespace-nowrap'>
            GitLab Velocity
          </h2>
        </div>
        <p className='text-xs text-slate-text-3 font-medium'>
          Metrik produktivitas commit dan merge request ({daysLabel})
        </p>
      </div>

      {isDisconnected ? (
        <div className='py-4 pb-6'>
          <EmptyState
            tone='rose'
            icon={<GitBranch size={24} />}
            title='Layanan GitLab Tidak Terhubung'
            description='Hubungkan Personal Access Token (PAT) GitLab di menu Pengaturan untuk melacak velocity commit mingguan, merge request, dan evaluasi kualitas rekayasa kode.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline'
                id='btn-gl-settings'
              >
                <Settings size={15} />
                <span>Konfigurasi GitLab di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Grade Highlight Hero Banner */}
          <div className='grid grid-cols-1 min-[500px]:grid-cols-[150px_minmax(0,1fr)] gap-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-600/[0.06] to-cyan-500/[0.09] border border-blue-600/[0.18] items-center'>
            <div className='flex items-center gap-3.5'>
              <div className='w-[54px] h-[54px] rounded-2xl bg-gradient-to-br from-[#1977f3] to-[#06b6d4] text-white grid place-items-center text-[28px] font-black shadow-[0_4px_14px_rgba(25,119,243,0.35)] shrink-0'>
                {grade}
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xl font-extrabold text-slate-text leading-tight'>
                  {score}
                </span>
                <span className='text-[11.5px] font-bold text-sky-600 uppercase tracking-wider'>
                  Grade {grade} · {gradeLabel}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-2.5'>
              {pillars.map((p) => (
                <div key={p.label} className='flex flex-col gap-1'>
                  <div className='flex items-center justify-between text-[11px] font-semibold text-slate-text-2'>
                    <span>{p.label}</span>
                    <strong className='font-extrabold text-slate-text'>
                      {p.val}%
                    </strong>
                  </div>
                  <div className='w-full h-[6px] rounded-full bg-slate-200 overflow-hidden'>
                    {(() => {
                      const velocityWidthStyle: React.CSSProperties = {
                        width: `${p.val}%`,
                      };
                      return (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${p.colorClass}`}
                          style={velocityWidthStyle}
                        />
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Column Velocity KPI row */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-subtle border border-border rounded-2xl p-5 sm:p-6'>
            <div className='flex flex-col justify-between min-h-[72px] gap-1.5'>
              <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                Total Commit
              </span>
              <span className='text-[17px] font-extrabold text-slate-text truncate'>
                {metrics?.kpis.commits || 0}
              </span>
              <span className='text-[11.5px] text-slate-muted truncate'>
                {(metrics?.kpis.commitsPerWeek || 0).toFixed(1)} / minggu (
                {days === 180 ? '6 bulan' : `${days} hari`})
              </span>
            </div>
            <div className='flex flex-col justify-between min-h-[72px] gap-1.5'>
              <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                MR Selesai
              </span>
              <span className='text-[17px] font-extrabold text-slate-text truncate'>
                {metrics?.kpis.mrsMerged || 0}
                <span className='text-xs font-semibold text-slate-muted'>
                  {' '}
                  / {metrics?.kpis.mrsCreated || 0}
                </span>
              </span>
              <span className='text-[11.5px] text-slate-muted truncate'>
                Merge Requests ({days === 180 ? '6 bulan' : `${days} hari`})
              </span>
            </div>
            <div className='flex flex-col justify-between min-h-[72px] gap-1.5'>
              <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                Baris Kode
              </span>
              <span className='text-[17px] font-extrabold truncate text-emerald-600'>
                +{(metrics?.kpis.linesAdded || 0).toLocaleString()}
              </span>
              <span className='text-[11.5px] truncate font-medium text-red-600'>
                -{(metrics?.kpis.linesDeleted || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 6-Week Commit Velocity Trends */}
          <div className='flex flex-col justify-between gap-4 p-5 sm:p-6 bg-slate-50/70 border border-border rounded-2xl min-h-[260px]'>
            <div className='flex items-center justify-between'>
              <span className='text-[12px] font-bold text-slate-text'>
                Tren Commit Mingguan
              </span>
              <span className='xs dim'>Rolling 6 Minggu</span>
            </div>

            {weeklyList.length > 0 ? (
              <>
                <div className='flex items-end justify-between gap-2.5 flex-1 min-h-[120px] p-2 pt-0'>
                  {weeklyList.map((w, idx) => {
                    const isLatest = idx === weeklyList.length - 1;
                    const heightPct = Math.round(
                      (w.commits / maxWeeklyCommits) * 100,
                    );
                    const label = formatWeekLabel(w.week);

                    return (
                      <div
                        key={`weekly-${w.week}`}
                        className='flex flex-col items-center gap-1.5 flex-1 h-full'
                      >
                        <span className='text-[11px] font-bold text-slate-text-2'>
                          {w.commits}
                        </span>
                        <div
                          className='w-full max-w-[28px] flex-1 min-h-[60px] bg-slate-100 rounded-lg flex items-end overflow-hidden hover:bg-slate-200 transition-colors'
                          title={`Minggu ${label}: ${w.commits} commit, ${w.mrs} MR, ${(w.lines || 0).toLocaleString()} baris kode`}
                        >
                          {(() => {
                            const colHeightStyle: React.CSSProperties = {
                              height: `${w.commits > 0 ? Math.max(16, heightPct) : 0}%`,
                            };
                            return (
                              <div
                                className={`w-full rounded-lg bg-gradient-to-b from-sky-400 to-blue-600 transition-all duration-500 ${
                                  isLatest
                                    ? '!from-sky-600 !to-blue-600 shadow-[0_2px_8px_rgba(25,119,243,0.35)]'
                                    : ''
                                }`}
                                style={colHeightStyle}
                              />
                            );
                          })()}
                        </div>
                        <span className='text-[10.5px] font-bold text-slate-text-3 whitespace-nowrap'>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className='py-6 text-center text-xs text-slate-text-3'>
                Belum ada data riwayat commit untuk periode ini.
              </div>
            )}
          </div>

          {/* Dynamic Activity Section (Repos & Recent Commits) */}
          <GitlabActivitySection
            topProjects={metrics?.topProjects}
            todayCommits={metrics?.todayCommits}
            recentCommits={metrics?.recentCommits}
            totalCommits={metrics?.kpis.commits}
            loading={loading}
            error={error}
          />
        </>
      )}
    </section>
  );
}
