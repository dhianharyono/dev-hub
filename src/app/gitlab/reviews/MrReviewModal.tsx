'use client';

import { useState } from 'react';
import {
  X,
  MessageSquare,
  ExternalLink,
  GitBranch,
  User,
  Minimize2,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { MrCommentsList } from './MrCommentsList';
import { AiReviewGenerator } from './AiReviewGenerator';
import { useAiTask } from '@/components/ai-task/AiTaskContext';
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

  const { getTask, requestConfirmLeave, minimizeTask } = useAiTask();
  const taskId = mr ? `mr-review-${mr.projectId}-${mr.iid}` : '';
  const currentTask = taskId ? getTask(taskId) : undefined;
  const isGenerating = currentTask?.status === 'running';

  if (!mr) return null;

  const handleMinimize = () => {
    if (taskId) {
      minimizeTask(taskId);
    }
    onClose();
  };

  const handleCloseRequest = () => {
    if (isGenerating && taskId) {
      requestConfirmLeave(taskId, {
        onStay: () => {
          // Stay inside modal, do nothing
        },
        onMinimize: () => {
          // Minimized to bottom-right dock, close main modal
          onClose();
        },
        onAbort: () => {
          // Task cancelled, close main modal
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

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

      {/* Right Controls: Tabs + GitLab Link + Minimize + Close */}
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

        {/* Minimize Button */}
        <button
          type='button'
          className={`btn btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-colors ${
            isGenerating
              ? 'text-primary bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100'
              : 'text-slate-text-2 hover:text-slate-text hover:bg-surface-subtle'
          }`}
          onClick={handleMinimize}
          aria-label='Minimize modal'
          title='Minimize modal'
        >
          <Minimize2 size={16} />
        </button>

        {/* Close Button with Leave Confirmation Interception */}
        <button
          type='button'
          className='btn btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center text-slate-text-2 hover:text-slate-text'
          onClick={handleCloseRequest}
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
      onClose={handleCloseRequest}
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
            onMinimize={handleMinimize}
          />
        )}
      </div>
    </Modal>
  );
}
