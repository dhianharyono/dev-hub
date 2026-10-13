import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  GitPullRequest,
  Send,
} from 'lucide-react';
import type { CreatedMr } from './types';

interface MrAssistantResultBannerProps {
  branch: string;
  targetBranch: string;
  selectedProjectName?: string;
  createdMr: CreatedMr | null;
  creatingMr: boolean;
  createMrError: string | null;
  onCreateMr: () => void;
}

export function MrAssistantResultBanner({
  branch,
  targetBranch,
  selectedProjectName,
  createdMr,
  creatingMr,
  createMrError,
  onCreateMr,
}: MrAssistantResultBannerProps) {
  const [copiedMrUrl, setCopiedMrUrl] = useState(false);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMrUrl(true);
    setTimeout(() => setCopiedMrUrl(false), 2000);
  };

  return (
    <div className='bg-gradient-to-br from-primary/[0.08] to-sky-500/[0.08] border border-primary/25 rounded-xl p-3.5 sm:px-4 flex flex-col gap-2.5'>
      <div className='row-between items-center flex-wrap gap-2.5'>
        <div className='flex items-center gap-2.5'>
          <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-sky-500 text-white flex items-center justify-center shrink-0'>
            <GitPullRequest size={18} />
          </div>
          <div>
            <strong className='text-[13.5px] text-slate-text'>
              Otomasi Terhubung ke GitLab
            </strong>
            <div className='xs dim'>
              Branch <code className='text-sky-500'>{branch}</code> →{' '}
              <code className='text-primary'>{targetBranch}</code> di{' '}
              <span className='font-semibold'>
                {selectedProjectName || 'GitLab'}
              </span>
            </div>
          </div>
        </div>

        {!createdMr ? (
          <button
            type='button'
            className='btn btn-primary px-4.5 py-2 text-[13px] font-semibold gap-1.5 rounded-lg shadow-md shadow-primary/25'
            disabled={creatingMr}
            onClick={onCreateMr}
            id='btn-create-gitlab-mr'
          >
            {creatingMr ? (
              <>
                <span className='spinner' />
                <span>Menghubungi GitLab...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Buat MR Langsung di GitLab</span>
              </>
            )}
          </button>
        ) : (
          <div className='flex items-center gap-2'>
            <a
              href={createdMr.web_url}
              target='_blank'
              rel='noreferrer'
              className='btn btn-primary px-4 py-2 text-[13px] font-semibold gap-1.5 rounded-lg no-underline'
            >
              <ExternalLink size={14} />
              <span>Buka MR di GitLab (!{createdMr.iid})</span>
            </a>
            <button
              type='button'
              className='btn btn-ghost px-3 py-2 text-xs gap-1.5'
              onClick={() => copyUrl(createdMr.web_url)}
            >
              {copiedMrUrl ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedMrUrl ? 'Tersalin' : 'Salin URL'}</span>
            </button>
          </div>
        )}
      </div>

      {createdMr && (
        <div className='bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-[12.5px] text-slate-text flex items-center gap-2'>
          <CheckCircle2
            size={16}
            className='text-emerald-600 shrink-0'
          />
          <span>
            <strong>MR Berhasil Dibuat!</strong> Merge Request{' '}
            <strong>!{createdMr.iid}</strong> telah aktif di GitLab
            repository.
          </span>
        </div>
      )}
    </div>
  );
}
