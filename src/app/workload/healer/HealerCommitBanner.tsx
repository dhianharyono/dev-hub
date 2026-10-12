'use client';

import { useState } from 'react';
import type { HealerDetectedCommit } from './types';

interface HealerCommitBannerProps {
  commits: HealerDetectedCommit[];
  date: string | undefined;
}

export function HealerCommitBanner({ commits, date }: HealerCommitBannerProps) {
  const [showCommitDetails, setShowCommitDetails] = useState(false);

  if (commits.length === 0) return null;

  return (
    <div className='bg-cyan-500/[0.08] border border-cyan-500/25 rounded-xl p-2.5 sm:px-3.5 flex flex-col gap-2'>
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div className='flex items-center gap-2'>
          <span className='text-[15px]'>🦊</span>
          <div>
            <strong className='text-[12.5px] text-slate-text'>
              Otomatis Berbasis {commits.length} Commit GitLab Hari Ini ({date})
            </strong>
          </div>
        </div>
        <button
          type='button'
          className='btn btn-ghost xs text-[11px] px-2 py-0.5'
          onClick={() => setShowCommitDetails((prev) => !prev)}
        >
          {showCommitDetails ? 'Tutup Daftar Commit' : 'Lihat Daftar Commit'}
        </button>
      </div>

      {showCommitDetails && (
        <div className='flex flex-col gap-1 pt-1.5 border-t border-dashed border-border'>
          {commits.map((c) => (
            <div
              key={c.sha}
              className='text-[11.5px] flex items-center gap-2 text-slate-text-2'
            >
              <span className='mono text-cyan-600 dark:text-cyan-400 font-semibold'>
                {c.sha.slice(0, 7)}
              </span>
              <span className='flex-1'>{c.message}</span>
              {c.project && (
                <span className='badge badge-neutral xs'>
                  {c.project.split('/').pop()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
