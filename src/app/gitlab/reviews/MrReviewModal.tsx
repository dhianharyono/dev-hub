'use client';

import { useState } from 'react';
import {
  X,
  MessageSquare,
  ExternalLink,
  GitBranch,
  User,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MrCommentsList } from './MrCommentsList';
import { AiReviewGenerator } from './AiReviewGenerator';
import type { IncomingMRItem, DetailTab } from './types';

interface MrReviewModalProps {
  mr: IncomingMRItem | null;
  isOpen: boolean;
  initialTab?: DetailTab;
  onClose: () => void;
  onRefreshMrs: () => void;
}

export function MrReviewModal({
  mr,
  isOpen,
  initialTab = 'discussions',
  onClose,
  onRefreshMrs,
}: MrReviewModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);

  if (!mr) return null;

  const headerNode = (
    <div className='px-6 py-4 border-b border-border flex items-center justify-between gap-4 bg-surface-subtle flex-wrap'>
      {/* MR Title & Badges */}
      <div className='flex-1 min-w-[280px]'>
        <div className='flex items-center gap-2 mb-1 flex-wrap'>
          <span className='mono text-[13px] font-bold text-primary'>
            {mr.reference}
          </span>
          <span className='badge badge-neutral xs font-semibold'>
            {mr.projectName}
          </span>
          <span
            className={`badge xs ${
              mr.state === 'opened'
                ? 'badge-cyan'
                : mr.state === 'merged'
                  ? 'badge-green'
                  : 'badge-neutral'
            }`}
          >
            {mr.state === 'opened'
              ? 'Open'
              : mr.state === 'merged'
                ? 'Merged'
                : 'Closed'}
          </span>
        </div>

        <h3
          id='modal-mr-title'
          className='text-base font-bold text-slate-text my-0.5 mb-1.5 leading-snug'
        >
          {mr.title}
        </h3>

        <div className='flex items-center gap-3 text-[12px] text-slate-600 font-medium flex-wrap'>
          <div className='flex items-center gap-1'>
            <User size={12} />
            <span>Oleh @{mr.author.username}</span>
          </div>
          <span>·</span>
          <div className='flex items-center gap-1'>
            <GitBranch size={12} />
            <span className='mono'>{mr.sourceBranch}</span>
            <span>→</span>
            <span className='mono'>{mr.targetBranch}</span>
          </div>
          {mr.assignees && mr.assignees.length > 0 && (
            <>
              <span>·</span>
              <span>
                Assignee: {mr.assignees.map((a) => `@${a.username}`).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Tabs + GitLab Link + Close */}
      <div className='flex items-center gap-2 flex-wrap'>
        <div className='flex items-center bg-surface p-0.5 rounded-lg border border-border'>
          <button
            type='button'
            onClick={() => setActiveTab('discussions')}
            className={`btn btn-sm text-xs px-3 py-1 gap-1.5 ${activeTab === 'discussions' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <MessageSquare size={13} />
            <span>Komentar MR</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('ai_review')}
            className={`btn btn-sm text-xs px-3 py-1 gap-1.5 ${activeTab === 'ai_review' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span>AI Review Generator</span>
          </button>
        </div>

        <a
          href={mr.webUrl}
          target='_blank'
          rel='noreferrer'
          className='btn btn-ghost btn-sm text-xs px-2.5 py-1.5 gap-1.5'
          title='Buka Merge Request di GitLab Web'
        >
          <span>GitLab</span>
          <ExternalLink size={13} />
        </a>

        <button
          type='button'
          className='btn btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center text-slate-text-2'
          onClick={onClose}
          aria-label='Tutup modal'
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={headerNode}
      size='full'
      bodyClassName='p-4 sm:p-6'
    >
      <div className='flex flex-col min-h-full'>
        {activeTab === 'discussions' ? (
          <MrCommentsList
            mr={mr}
            refreshTrigger={commentRefreshTrigger}
            onOpenAiReview={() => setActiveTab('ai_review')}
          />
        ) : (
          <AiReviewGenerator
            mr={mr}
            onCommentPosted={() => {
              setCommentRefreshTrigger((p) => p + 1);
              onRefreshMrs();
            }}
            onOpenDiscussions={() => setActiveTab('discussions')}
          />
        )}
      </div>
    </Modal>
  );
}
