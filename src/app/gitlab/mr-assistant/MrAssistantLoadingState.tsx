import { GitPullRequest } from 'lucide-react';

interface MrAssistantLoadingStateProps {
  branch: string;
  targetBranch: string;
}

export function MrAssistantLoadingState({
  branch,
  targetBranch,
}: MrAssistantLoadingStateProps) {
  return (
    <div className='flex-1 flex flex-col items-center justify-center text-center p-12 sm:px-6 border border-dashed border-primary rounded-xl bg-primary/[0.03] min-h-[380px]'>
      <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky-500 text-white flex items-center justify-center shadow-lg shadow-primary/25 mb-4'>
        <GitPullRequest size={28} />
      </div>

      <div className='flex items-center gap-2 mb-1.5'>
        <span className='spinner w-4 h-4 border-t-primary' />
        <strong className='text-[15px] text-slate-text'>
          Menyusun Draf GitLab Merge Request...
        </strong>
      </div>

      <p className='text-[12.5px] text-slate-text-3 max-w-[380px] mt-0 mb-4 leading-normal'>
        Membaca perbandingan kode dari branch{' '}
        <code className='text-sky-500 font-semibold'>
          {branch}
        </code>{' '}
        ke{' '}
        <code className='text-primary font-semibold'>
          {targetBranch}
        </code>
        , memformat ringkasan perubahan, serta merangkum release notes.
      </p>

      {/* Animated skeleton progress card */}
      <div className='w-full max-w-[340px] flex flex-col gap-2.5 p-3.5 sm:px-4 bg-surface rounded-xl border border-border shadow-xs'>
        <div className='row-between mb-0.5'>
          <span className='xs dim font-semibold'>
            Status Penyusunan MR
          </span>
          <span className='badge badge-cyan xs'>AI Synthesizing</span>
        </div>
        <div className='h-2 rounded bg-surface-subtle overflow-hidden'>
          <div className='h-full w-[70%] rounded bg-gradient-to-r from-primary to-sky-500 animate-pulse' />
        </div>
        <div className='flex flex-col gap-1.5 mt-1'>
          <div className='h-2.5 rounded-full bg-surface-subtle w-[90%]' />
          <div className='h-2.5 rounded-full bg-surface-subtle w-[60%]' />
        </div>
      </div>
    </div>
  );
}
