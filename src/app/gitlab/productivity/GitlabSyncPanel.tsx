import { useEffect, useRef } from 'react';
import type { useSync } from '@/components/hooks';
import { useNotification } from '@/components/Notification';

interface GitlabSyncPanelProps {
  status: ReturnType<typeof useSync>['status'];
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function GitlabSyncPanel({ status }: GitlabSyncPanelProps) {
  const { notify } = useNotification();
  const lastFinished = useRef<string | null>(null);

  useEffect(() => {
    if (!status) return;

    if (!status.running && status.summary) {
      const key = `${status.phase}-${status.summary.commits}-${status.summary.mrs}`;
      if (lastFinished.current !== key) {
        lastFinished.current = key;
        notify.success(
          `${status.summary.projects} proyek disinkronkan (${fmt(status.summary.commits)} commit, ${status.summary.mrs} MR)`,
          'Sinkronisasi GitLab Selesai',
        );
      }
    }

    if (status.error && lastFinished.current !== status.error) {
      lastFinished.current = status.error;
      notify.error(status.error, 'Sinkronisasi GitLab Gagal');
    }
  }, [status, notify]);

  if (!status || !status.running) {
    return null;
  }

  const pct = status.total
    ? Math.round((status.done / status.total) * 100)
    : 15;
  const reviewMode = Boolean(status.detail);

  return (
    <div className='mb-4 px-4 py-2.5 bg-surface border border-border rounded-xl shadow-xs flex items-center justify-between gap-4 animate-in fade-in'>
      <div className='flex items-center gap-2.5 text-xs text-slate-text font-medium'>
        <span className='spinner shrink-0' />
        <span>Sinkronisasi GitLab: {status.phase || 'Memproses data...'}</span>
        {status.detail ? (
          <span className='text-slate-muted font-mono'>({status.detail})</span>
        ) : (
          status.total > 0 && (
            <span className='text-slate-muted font-mono'>
              ({status.done}/{status.total} proyek · {pct}%)
            </span>
          )
        )}
      </div>

      <div
        className={`bg-surface-subtle border border-border rounded-full h-1.5 overflow-hidden ${
          reviewMode ? 'w-28 sm:w-44 animate-pulse' : 'w-28 sm:w-44'
        }`}
      >
        <div
          className='bg-brand h-full rounded-full transition-all duration-300'
          style={{ width: `${reviewMode ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
