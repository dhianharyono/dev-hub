'use client';

import type { WorkloadData } from '@/lib/workload';

interface WorkloadProfileCardProps {
  user: WorkloadData['user'];
  lastUpdated: string;
}

export function WorkloadProfileCard({
  user,
  lastUpdated,
}: WorkloadProfileCardProps) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <section
      className='card flex items-center justify-between flex-wrap gap-6 animate-fade-up'
    >
      <div className='flex items-center gap-5'>
        <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-[0_4px_14px_rgba(124,58,237,0.35)] shrink-0'>
          {initials || 'DH'}
        </div>
        <div className='flex flex-col gap-1'>
          <h2 className='font-extrabold text-lg sm:text-xl tracking-tight text-slate-text m-0'>
            {user.name.toUpperCase()}
          </h2>
          <p className='text-xs text-slate-muted m-0 flex items-center gap-2 flex-wrap'>
            <span>Last Updated: {lastUpdated}</span>
            <span>·</span>
            <span>Activity Logger 03 Oct, 23:58</span>
          </p>
        </div>
      </div>
    </section>
  );
}
