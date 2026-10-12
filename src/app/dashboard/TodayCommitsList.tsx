'use client';

import Link from 'next/link';
import { AlertCircle, GitCommit } from 'lucide-react';
import type { MetricsData } from '@/components/hooks';

interface TodayCommitsListProps {
  todayCommits?: MetricsData['todayCommits'];
  loading: boolean;
  error: string | null;
}

export function TodayCommitsList({
  todayCommits,
  loading,
  error,
}: TodayCommitsListProps) {
  return (
    <div className='flex flex-col gap-3 mt-1'>
      <div className='flex items-center justify-between text-xs'>
        <div className='flex items-center gap-2'>
          <span className='font-bold text-slate-text text-[13px]'>Commit Terbaru Hari Ini</span>
          {todayCommits && todayCommits.length > 0 && (
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
              {todayCommits.length} commit
            </span>
          )}
        </div>
        <span className='text-xs text-slate-dim'>
          {new Intl.DateTimeFormat('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }).format(new Date())}
        </span>
      </div>

      {loading && (
        <div className='flex flex-col gap-2'>
          <div className='h-[60px] rounded-xl bg-slate-200 animate-pulse' />
          <div className='h-[60px] rounded-xl bg-slate-200 animate-pulse' />
        </div>
      )}

      {!loading && error && (
        <div className='flex flex-col items-center text-center p-6 bg-slate-50 border border-dashed border-border rounded-xl gap-3'>
          <div className='w-10 h-10 rounded-full bg-red-50 text-coral-accent grid place-items-center'>
            <AlertCircle size={20} />
          </div>
          <div className='flex flex-col gap-1 text-xs text-slate-muted max-w-sm'>
            <strong className='text-slate-text'>Gagal Memuat Commit</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        (!todayCommits || todayCommits.length === 0) && (
          <div className='flex flex-col items-center text-center p-6 bg-slate-50 border border-dashed border-border rounded-xl gap-3'>
            <div className='w-10 h-10 rounded-full bg-slate-100 text-slate-400 grid place-items-center'>
              <GitCommit size={20} />
            </div>
            <div className='flex flex-col gap-1 text-xs text-slate-muted max-w-sm'>
              <strong className='text-slate-text'>Belum Ada Commit Hari Ini</strong>
              <p>
                Tidak ada aktivitas push commit yang terdeteksi untuk hari ini.
                Pastikan commit sudah di-push dan lakukan sinkronisasi bila
                diperlukan.
              </p>
            </div>
            <Link
              href='/gitlab'
              className='btn btn-sm btn-ghost text-xs text-brand'
              title='Buka halaman GitLab'
            >
              Lihat Aktivitas GitLab
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        todayCommits &&
        todayCommits.length > 0 && (
          <div className='flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1'>
            {todayCommits.map((c) => {
              const shortSha = c.sha ? c.sha.slice(0, 7) : '';
              const timeStr = c.authored_at
                ? new Intl.DateTimeFormat('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23',
                  }).format(new Date(c.authored_at))
                : '';
              const shortProject = c.project
                ? c.project.split('/').pop() || c.project
                : 'GitLab';

              const itemContent = (
                <>
                  <div className='flex items-center justify-between gap-2 text-xs'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <span className='font-mono text-xs font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded'>#{shortSha}</span>
                      <span className='text-[11px] text-slate-muted truncate max-w-[140px]' title={c.project || ''}>
                        {shortProject}
                      </span>
                      {c.is_merge === 1 && (
                        <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-violet-accent border border-purple-200'>Merge</span>
                      )}
                    </div>
                    <div className='flex items-center gap-2 shrink-0 text-xs'>
                      {timeStr && (
                        <span className='text-[11px] text-slate-dim font-mono'>{timeStr} WIB</span>
                      )}
                      {(c.adj_additions > 0 || c.adj_deletions > 0) && (
                        <span className='flex items-center gap-1 font-mono text-[11px]'>
                          <span className='text-emerald-600 font-semibold'>+{c.adj_additions}</span>
                          <span className='text-rose-600 font-semibold'>-{c.adj_deletions}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='text-xs text-slate-text font-medium line-clamp-2' title={c.title}>
                    {c.title}
                  </div>
                </>
              );

              return c.web_url ? (
                <a
                  key={`commit-${c.sha}`}
                  href={c.web_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-3 rounded-xl bg-slate-50 border border-border flex flex-col gap-1.5 transition-all hover:bg-surface-hover hover:border-border-strong text-slate-text no-underline'
                  title={`Buka commit ${shortSha} di GitLab`}
                >
                  {itemContent}
                </a>
              ) : (
                <div key={`commit-${c.sha}`} className='p-3 rounded-xl bg-slate-50 border border-border flex flex-col gap-1.5 text-slate-text'>
                  {itemContent}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
