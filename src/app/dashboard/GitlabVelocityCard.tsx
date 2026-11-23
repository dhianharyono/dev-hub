'use client';

import Link from 'next/link';
import { GitBranch, Settings } from 'lucide-react';
import type { MetricsData } from '@/components/hooks';
import type { Scorecard, ScoreComponent } from '@/lib/scoring';
import { EmptyState } from '@/components/EmptyState';
import { GitlabActivitySection } from './GitlabActivitySection';
import { GitlabSkeletonCard } from './DashboardSkeleton';

interface GitlabVelocityCardProps {
  metrics: MetricsData | null;
  scorecard?: Scorecard | null;
  connected?: boolean;
  loading: boolean;
  error: string | null;
  days?: number;
  onDaysChange?: (days: number) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

type Tone = 'ok' | 'mid' | 'bad' | 'empty';

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-emerald-600',
  mid: 'text-amber-600',
  bad: 'text-rose-600',
  empty: 'text-slate-400',
};

const TONE_BAR: Record<Tone, string> = {
  ok: 'bg-emerald-500',
  mid: 'bg-amber-500',
  bad: 'bg-rose-500',
  empty: 'bg-slate-300',
};

const GRADE_BOX: Record<
  string,
  { box: string; label: string; shadow: string }
> = {
  A: {
    box: 'bg-gradient-to-br from-emerald-500 to-green-500',
    label: 'text-emerald-600',
    shadow: 'shadow-[0_4px_14px_rgba(16,185,129,0.35)]',
  },
  B: {
    box: 'bg-gradient-to-br from-cyan-500 to-sky-500',
    label: 'text-cyan-600',
    shadow: 'shadow-[0_4px_14px_rgba(6,182,212,0.35)]',
  },
  C: {
    box: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    label: 'text-amber-600',
    shadow: 'shadow-[0_4px_14px_rgba(245,158,11,0.35)]',
  },
  D: {
    box: 'bg-gradient-to-br from-orange-500 to-amber-500',
    label: 'text-orange-600',
    shadow: 'shadow-[0_4px_14px_rgba(249,115,22,0.35)]',
  },
  E: {
    box: 'bg-gradient-to-br from-rose-500 to-orange-500',
    label: 'text-rose-600',
    shadow: 'shadow-[0_4px_14px_rgba(244,63,94,0.35)]',
  },
};

function toneOf(component: ScoreComponent): Tone {
  if (component.score === null) return 'empty';
  if (component.score >= 70) return 'ok';
  if (component.score >= 40) return 'mid';
  return 'bad';
}

export function GitlabVelocityCard({
  metrics,
  scorecard,
  connected = true,
  loading,
  error,
  days = 0,
}: GitlabVelocityCardProps) {
  if (loading) {
    return <GitlabSkeletonCard />;
  }

  const isDisconnected = !connected;
  const isIdentityMissing = connected && metrics?.identity?.configured === false;

  const score = scorecard?.overall ?? metrics?.scores?.overall ?? 0;
  const grade = scorecard?.grade ?? metrics?.scores?.grade ?? '-';
  const gradeLabel = scorecard?.gradeLabel ?? metrics?.scores?.gradeLabel ?? 'Belum ada data';
  const components = [...(scorecard?.components ?? [])].sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
  const gradeTone = GRADE_BOX[grade] ?? {
    box: 'bg-gradient-to-br from-slate-400 to-slate-500',
    label: 'text-slate-500',
    shadow: 'shadow-[0_4px_14px_rgba(100,116,139,0.35)]',
  };

  const daysLabel =
    days === 0
      ? 'tahun berjalan (YTD)'
      : days === 180
        ? '6 bulan terakhir'
        : `${days} hari terakhir`;

  return (
    <section
      className='card flex flex-col gap-5 @container min-w-0'
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
        <div className='py-2 pb-4 w-full'>
          <EmptyState
            tone='rose'
            icon={<GitBranch size={24} />}
            title='Layanan GitLab Tidak Terhubung'
            description='Hubungkan Personal Access Token (PAT) GitLab di menu Pengaturan untuk melacak velocity commit mingguan, merge request, dan evaluasi kualitas rekayasa kode.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline max-w-full text-center whitespace-normal h-auto min-h-[42px] py-2 px-4 text-[13px] leading-snug'
                id='btn-gl-settings'
              >
                <Settings size={15} className='shrink-0' />
                <span>Konfigurasi GitLab di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : isIdentityMissing ? (
        <div className='py-2 pb-4 w-full'>
          <EmptyState
            tone='amber'
            icon={<GitBranch size={24} />}
            title='Identitas GitLab Belum Diatur'
            description='Isi email dan nama yang kamu pakai untuk commit/MR di menu Pengaturan supaya metrik di kartu ini hanya menghitung commit dan merge request milikmu, bukan seluruh anggota proyek.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline max-w-full text-center whitespace-normal h-auto min-h-[42px] py-2 px-4 text-[13px] leading-snug'
              >
                <Settings size={15} className='shrink-0' />
                <span>Atur identitas di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Grade Highlight Hero Banner */}
          <div className='flex flex-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-600/[0.06] to-cyan-500/[0.09] border border-blue-600/[0.18] items-center'>
            <div className='flex flex-col items-center gap-1.5 shrink-0'>
              <div
                className={`w-[76px] h-[76px] rounded-2xl text-white grid place-items-center text-[30px] font-black ${gradeTone.box} ${gradeTone.shadow}`}
              >
                {score}
              </div>
              <span
                className={`text-[11.5px] font-bold uppercase tracking-wider whitespace-nowrap ${gradeTone.label}`}
              >
                Grade {grade} · {gradeLabel}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-x-3 gap-y-2 flex-1 min-w-0'>
              {components.length > 0
                ? components.map((c) => {
                    const tone = toneOf(c);
                    return (
                      <div
                        key={c.key}
                        className='rounded-lg border border-border bg-surface-subtle/80 px-2.5 py-1.5 min-w-0'
                        title={
                          c.available
                            ? `Bobot efektif ${c.effectiveWeight}% · potensi ke target +${c.potentialToTarget}`
                            : 'Komponen belum punya data pada periode ini'
                        }
                      >
                        <div className='flex items-baseline justify-between gap-1'>
                          <span className='text-[10.5px] font-bold text-slate-text-2 truncate'>
                            {c.label}
                          </span>
                          <span className='text-[9.5px] font-bold text-slate-400 shrink-0'>
                            {c.weight}%
                          </span>
                        </div>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <span className={`text-[14px] font-extrabold ${TONE_TEXT[tone]}`}>
                            {c.score ?? '—'}
                          </span>
                          <div className='flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden'>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${TONE_BAR[tone]}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, c.score ?? 0))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                : [1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={`score-skeleton-${i}`}
                      className='rounded-lg border border-border bg-surface-subtle/80 px-2.5 py-1.5 animate-pulse'
                    >
                      <div className='h-2 w-2/3 rounded bg-slate-200' />
                      <div className='h-1.5 w-full rounded bg-slate-200 mt-1.5' />
                    </div>
                  ))}
            </div>
          </div>

          {scorecard && (
            <p className='text-[10.5px] text-slate-400 leading-relaxed -mt-2'>
              Skor dihitung dari 6 komponen berbobot (metodologi Ranking Talent).
              Target {scorecard.potential.target} (B) · potensi naik +
              {scorecard.potential.toTarget.toLocaleString('id-ID')} poin.
            </p>
          )}

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
                {days === 0 ? 'YTD' : days === 180 ? '6 bulan' : `${days} hari`})
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
                Merge Requests ({days === 0 ? 'YTD' : days === 180 ? '6 bulan' : `${days} hari`})
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
