'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ExternalLink, GitCommit, GitFork } from 'lucide-react';
import type { MetricsData } from '@/components/hooks';

interface GitCommitItem {
  sha: string;
  title: string;
  authored_at?: string | null;
  adj_additions?: number | null;
  adj_deletions?: number | null;
  web_url?: string | null;
  project?: string | null;
}

interface GitlabActivitySectionProps {
  topProjects?: MetricsData['topProjects'];
  todayCommits?: MetricsData['todayCommits'];
  recentCommits?: MetricsData['recentCommits'];
  totalCommits?: number;
  loading: boolean;
  error: string | null;
}

function formatCommitTime(authoredAt?: string) {
  if (!authoredAt) return '';
  try {
    const d = new Date(authoredAt);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(d);
  } catch {
    return '';
  }
}

export function GitlabActivitySection({
  topProjects = [],
  todayCommits = [],
  recentCommits = [],
  totalCommits = 0,
  loading,
  error,
}: GitlabActivitySectionProps) {
  const hasTodayCommits = Boolean(todayCommits && todayCommits.length > 0);
  const [activeTab, setActiveTab] = useState<'repos' | 'commits'>(
    hasTodayCommits ? 'commits' : 'repos',
  );

  const displayProjects = topProjects.slice(0, 4);
  const displayCommits: GitCommitItem[] = hasTodayCommits
    ? (todayCommits || []).slice(0, 4)
    : ((recentCommits as GitCommitItem[]) || []).slice(0, 4);

  return (
    <div className='flex flex-col justify-between gap-4 p-5 sm:p-6 bg-slate-50/70 border border-border rounded-2xl flex-auto min-h-[250px]'>
      {/* Dynamic Tab Switcher */}
      <div className='flex items-center justify-between gap-2.5'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setActiveTab('repos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-transparent text-xs font-semibold transition-colors ${
              activeTab === 'repos'
                ? '!bg-white !text-brand !border-border shadow-xs !font-bold'
                : 'text-slate-text-2 bg-transparent hover:text-slate-text hover:bg-slate-100/70'
            }`}
            title='Lihat alokasi repositori teraktif'
          >
            <span>Repositori Teraktif</span>
            <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-text-3'>
              {topProjects.length}
            </span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('commits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-transparent text-xs font-semibold transition-colors ${
              activeTab === 'commits'
                ? '!bg-white !text-brand !border-border shadow-xs !font-bold'
                : 'text-slate-text-2 bg-transparent hover:text-slate-text hover:bg-slate-100/70'
            }`}
            title='Lihat aktivitas commit terkini'
          >
            <span>Commit Terkini</span>
            {hasTodayCommits ? (
              <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
                {todayCommits.length} Hari Ini
              </span>
            ) : (
              <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-text-3'>
                {recentCommits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className='flex flex-col gap-2 py-4'>
          <div className='h-14 rounded-xl bg-slate-100 animate-pulse' />
          <div className='h-14 rounded-xl bg-slate-100 animate-pulse' />
        </div>
      )}

      {!loading && error && (
        <div className='flex flex-col items-center justify-center p-6 text-center gap-2 rounded-xl bg-surface-subtle border border-border'>
          <div className='w-10 h-10 rounded-full bg-rose-50 text-rose-600 grid place-items-center mb-1'>
            <AlertCircle size={20} />
          </div>
          <div className='text-xs text-slate-text-2 [&>strong]:text-slate-text [&>strong]:text-[13px] [&>strong]:block [&>p]:mt-1'>
            <strong>Gagal Memuat Data GitLab</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'repos' && (
        <>
          {displayProjects.length > 0 ? (
            <div className='flex flex-col gap-2 py-1'>
              {displayProjects.map((p) => {
                const shortName = p.name.split('/').pop() || p.name;
                const commitPct = Math.round(
                  (p.commits / Math.max(totalCommits, 1)) * 100,
                );
                return (
                  <div
                    key={`repo-${p.id}`}
                    className='flex flex-col gap-2 p-3.5 sm:p-4 rounded-xl bg-surface border border-border shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 min-w-0 flex-1'>
                        <GitFork
                          size={14}
                          className='text-slate-text-3 shrink-0'
                        />
                        <span
                          className='text-xs font-bold text-slate-text truncate'
                          title={p.name}
                        >
                          {shortName}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 shrink-0'>
                        <span className='text-[10.5px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/50'>
                          {p.commits} commit
                        </span>
                        <span className='text-[10.5px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/50'>
                          {p.mrs} MR
                        </span>
                      </div>
                    </div>
                    <div className='w-full h-1.5 rounded-full bg-slate-100 overflow-hidden'>
                      {(() => {
                        const progressBarStyle: React.CSSProperties = {
                          width: `${Math.max(6, Math.min(100, commitPct))}%`,
                        };
                        return (
                          <div
                            className='h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500'
                            style={progressBarStyle}
                          />
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center p-6 text-center gap-2 rounded-xl bg-surface-subtle border border-border'>
              <div className='w-10 h-10 rounded-full bg-slate-100 text-slate-400 grid place-items-center mb-1'>
                <GitFork size={20} />
              </div>
              <div className='text-xs text-slate-text-2 [&>strong]:text-slate-text [&>strong]:text-[13px] [&>strong]:block [&>p]:mt-1'>
                <strong>Belum Ada Repositori</strong>
                <p>Tidak ada proyek terdeteksi untuk periode ini.</p>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && activeTab === 'commits' && (
        <>
          {!hasTodayCommits && (
            <div className='flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 font-medium'>
              <span className='w-2 h-2 rounded-full bg-amber-500 shrink-0' />
              <span>
                Belum ada commit hari ini · Menampilkan commit terbaru
              </span>
            </div>
          )}

          {displayCommits.length > 0 ? (
            <div className='flex flex-col gap-2 py-1'>
              {displayCommits.map((c) => {
                const shortSha = c.sha ? String(c.sha).slice(0, 7) : '';
                const rawProject = c.project ? String(c.project) : '';
                const shortProj = rawProject
                  ? rawProject.split('/').pop() || rawProject
                  : 'GitLab';
                const timeStr = c.authored_at
                  ? formatCommitTime(String(c.authored_at))
                  : '';
                const add = Number(c.adj_additions || 0);
                const del = Number(c.adj_deletions || 0);
                const hasDiff = add > 0 || del > 0;
                const title = String(c.title || '');
                const url = c.web_url ? String(c.web_url) : null;

                const content = (
                  <>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <span className='text-[10.5px] font-mono font-bold text-brand bg-brand/[0.08] px-1.5 py-0.5 rounded'>
                          #{shortSha}
                        </span>
                        <span
                          className='text-[11px] font-semibold text-slate-text-2 truncate max-w-[130px]'
                          title={rawProject}
                        >
                          {shortProj}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 shrink-0 text-slate-text-3'>
                        {timeStr && (
                          <span className='text-[10.5px] text-slate-text-3'>
                            {timeStr}
                          </span>
                        )}
                        {hasDiff && (
                          <span className='flex items-center gap-1 text-[10.5px] font-mono font-bold'>
                            <span className='text-emerald-600'>+{add}</span>
                            <span className='text-rose-600'>-{del}</span>
                          </span>
                        )}
                        {url && (
                          <ExternalLink
                            size={12}
                            className='text-slate-text-3'
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className='text-xs text-slate-text truncate font-medium'
                      title={title}
                    >
                      {title}
                    </div>
                  </>
                );

                return url ? (
                  <a
                    key={`commit-${c.sha}`}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex flex-col gap-2 p-3.5 sm:p-4 rounded-xl bg-surface border border-border no-underline text-inherit shadow-2xs transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-xs'
                    title={`Buka commit ${shortSha} di GitLab`}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={`commit-${c.sha}`}
                    className='flex flex-col gap-2 p-3.5 sm:p-4 rounded-xl bg-surface border border-border shadow-2xs transition-all duration-150'
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center p-6 text-center gap-2 rounded-xl bg-surface-subtle border border-border'>
              <div className='w-10 h-10 rounded-full bg-slate-100 text-slate-400 grid place-items-center mb-1'>
                <GitCommit size={20} />
              </div>
              <div className='text-xs text-slate-text-2 [&>strong]:text-slate-text [&>strong]:text-[13px] [&>strong]:block [&>p]:mt-1'>
                <strong>Belum Ada Aktivitas Commit</strong>
                <p>Belum ada commit yang tercatat dalam periode ini.</p>
              </div>
              <Link
                href='/gitlab'
                className='mt-2 text-xs font-semibold text-brand hover:underline'
              >
                Lihat Aktivitas GitLab
              </Link>
            </div>
          )}

          <div className='flex items-center justify-between pt-2.5 border-t border-black/[0.04] text-[11px] text-slate-text-2'>
            <span>
              {hasTodayCommits ? (
                <>
                  Total <strong>{todayCommits.length} commit</strong> hari ini
                </>
              ) : (
                <>
                  Total <strong>{totalCommits} commit</strong> dalam 30 hari
                </>
              )}
            </span>
            <Link
              href='/gitlab'
              className='font-bold text-brand hover:underline'
            >
              Riwayat Lengkap
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
