import { useEffect, useState } from 'react';
import type { useSync } from '@/components/hooks';

interface GitlabSyncPanelProps {
  status: ReturnType<typeof useSync>['status'];
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function GitlabSyncPanel({ status }: GitlabSyncPanelProps) {
  const [userDismissed, setUserDismissed] = useState(false);
  const [autoHidden, setAutoHidden] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!status || status.running || status.error || !status.summary) {
      return;
    }
    // Auto-hide 4 seconds after sync completes
    const t1 = setTimeout(() => setHiding(true), 4000);
    const t2 = setTimeout(() => setAutoHidden(true), 4400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [status]);

  if (
    !status ||
    (!status.running && !status.error && !status.summary) ||
    (!status.running && (userDismissed || autoHidden))
  )
    return null;

  const pct = status.total
    ? Math.round((status.done / status.total) * 100)
    : status.running
      ? 5
      : 100;

  return (
    <div
      className={`alert mb-4.5 flex-col transition-all duration-400 ${
        status.error ? 'alert-error' : status.running ? 'alert-info' : 'alert-ok'
      } ${hiding ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
    >
      <div className='row-between w-full'>
        <strong className='flex items-center gap-2'>
          <span>
            {status.running
              ? 'Sinkronisasi berjalan'
              : status.error
                ? 'Sinkronisasi gagal'
                : '✓ Sinkronisasi selesai'}{' '}
            · {status.phase}
          </span>
          {!status.running && !status.error && (
            <span className='xs dim font-normal text-[11px]'>
              (Otomatis tutup sebentar lagi)
            </span>
          )}
        </strong>
        <div className='row gap-2'>
          {status.total > 0 && (
            <span className='small muted mono'>
              {status.done}/{status.total} proyek
            </span>
          )}
          <button
            type='button'
            className='btn btn-ghost btn-sm xs px-2 h-6 text-[11px]'
            onClick={() => setUserDismissed(true)}
            title='Tutup notifikasi ini'
          >
            Tutup
          </button>
        </div>
      </div>
      {status.running && (() => {
        const progressStyle: React.CSSProperties = { width: `${pct}%` };
        return (
          <div className='progress'>
            <span style={progressStyle} />
          </div>
        );
      })()}
      {status.summary && (
        <div className='small muted'>
          {status.summary.projects} proyek · {fmt(status.summary.commits)}{' '}
          commit · {status.summary.mrs} MR · {status.summary.pipelines} pipeline
          {status.summary.projectErrors
            ? ` · ${status.summary.projectErrors} proyek error`
            : ''}
        </div>
      )}
      {status.error && <div className='small'>{status.error}</div>}
      <details>
        <summary className='xs dim cursor-pointer'>
          Log
        </summary>
        <pre className='mono xs dim whitespace-pre-wrap mt-1.5 max-h-40 overflow-auto'>
          {status.log.join('\n')}
        </pre>
      </details>
    </div>
  );
}
