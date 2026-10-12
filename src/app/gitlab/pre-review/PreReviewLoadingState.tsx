import { ShieldCheck } from 'lucide-react';

interface PreReviewLoadingStateProps {
  branch: string;
}

export function PreReviewLoadingState({ branch }: PreReviewLoadingStateProps) {
  return (
    <div className='flex-1 flex flex-col items-center justify-center text-center p-12 sm:px-6 border border-dashed border-emerald-500 rounded-xl bg-emerald-500/[0.03] min-h-[380px]'>
      <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 mb-4'>
        <ShieldCheck size={28} />
      </div>

      <div className='flex items-center gap-2 mb-1.5'>
        <span className='spinner w-4 h-4 border-t-emerald-600' />
        <strong className='text-[15px] text-slate-text'>
          Memindai Keamanan &amp; Kualitas Kode...
        </strong>
      </div>

      <p className='text-[12.5px] text-slate-text-3 max-w-[380px] mt-0 mb-5 leading-normal'>
        Mengekstrak Git Diff dari branch{' '}
        <code className='text-primary font-semibold'>
          {branch}
        </code>
        , memverifikasi 6 pilar checklist senior review, dan mendeteksi celah
        keamanan serta kebocoran secret.
      </p>

      {/* Animated skeleton progress card */}
      <div className='w-full max-w-[340px] flex flex-col gap-2.5 p-3.5 sm:px-4 bg-surface rounded-xl border border-border shadow-xs'>
        <div className='row-between mb-0.5'>
          <span className='xs dim font-semibold'>
            Progress Audit Pre-Review
          </span>
          <span className='badge badge-cyan xs'>Memeriksa Diff</span>
        </div>
        <div className='h-2 rounded bg-surface-subtle overflow-hidden'>
          <div className='h-full w-[65%] rounded bg-gradient-to-r from-emerald-600 to-emerald-400 animate-pulse' />
        </div>
        <div className='flex flex-col gap-1.5 mt-1'>
          <div className='h-2.5 rounded-full bg-surface-subtle w-[85%]' />
          <div className='h-2.5 rounded-full bg-surface-subtle w-[65%]' />
        </div>
      </div>
    </div>
  );
}
