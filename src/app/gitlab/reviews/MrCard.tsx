'use client';

import { ExternalLink, User, GitBranch, MessageSquare, Sparkles } from 'lucide-react';
import type { IncomingMRItem, DetailTab } from './types';

interface MrCardProps {
  mr: IncomingMRItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpenModal: (tab: DetailTab) => void;
}

export function MrCard({ mr, isSelected, onSelect, onOpenModal }: MrCardProps) {
  return (
    <div
      className={`border rounded-xl p-4 sm:px-[18px] flex flex-col gap-2.5 transition-all duration-200 shadow-xs ${
        isSelected ? 'border-primary bg-primary/[0.04]' : 'border-border bg-surface'
      }`}
    >
      {/* Top Row: Project, Reference, and Badges */}
      <div className='row-between items-center'>
        <div className='flex items-center gap-1.5 min-w-0'>
          <span
            className='badge badge-neutral xs max-w-[180px] truncate font-semibold'
          >
            {mr.projectName}
          </span>
          <span className='mono text-xs font-bold text-primary'>
            {mr.reference}
          </span>
        </div>

        <div className='flex items-center gap-1.5'>
          {mr.userNotesCount > 0 && (
            <span
              className='badge badge-violet xs text-[11px] px-1.5 py-0.5 gap-1'
              title={`${mr.userNotesCount} catatan review`}
            >
              <MessageSquare size={11} />
              <span>{mr.userNotesCount}</span>
            </span>
          )}

          <span
            className={`badge xs text-[10.5px] px-1.5 py-0.5 ${
              mr.state === 'opened'
                ? 'badge-cyan'
                : mr.state === 'merged'
                  ? 'badge-green'
                  : 'badge-neutral'
            }`}
          >
            {mr.state === 'opened' ? 'Open' : mr.state === 'merged' ? 'Merged' : 'Closed'}
          </span>
        </div>
      </div>

      {/* MR Title */}
      <h4
        className='text-[13.5px] font-semibold text-slate-text m-0 leading-snug cursor-pointer'
        onClick={() => {
          onSelect();
          onOpenModal(mr.userNotesCount > 0 ? 'discussions' : 'ai_review');
        }}
      >
        {mr.title}
      </h4>

      {/* Metadata: Author & Branches */}
      <div className='row-between text-[11.5px] text-slate-text-3 flex-wrap gap-2 items-center'>
        <div className='flex items-center gap-1.5'>
          <User size={12} />
          <span>@{mr.author.username}</span>
          <span>·</span>
          <span>
            {new Date(mr.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        <div className='flex items-center gap-1 font-mono text-[11px]'>
          <GitBranch size={11} />
          <span className='text-sky-500'>{mr.sourceBranch}</span>
          <span>→</span>
          <span className='text-primary'>{mr.targetBranch}</span>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className='flex items-center gap-2 mt-0.5 pt-3 border-t border-border'>
        <button
          type='button'
          className='btn btn-primary xs text-xs px-3.5 py-1.5 gap-1.5 flex-1'
          onClick={() => {
            onSelect();
            onOpenModal('discussions');
          }}
        >
          <MessageSquare size={13} />
          <span>{mr.userNotesCount > 0 ? `Komentar (${mr.userNotesCount})` : 'Buka Komentar'}</span>
        </button>

        <button
          type='button'
          className='btn btn-ghost xs text-xs px-3 py-1.5 gap-1'
          onClick={() => {
            onSelect();
            onOpenModal('ai_review');
          }}
          title='Generate review kode dengan AI'
        >
          <Sparkles size={12} />
          <span>Review AI</span>
        </button>

        <a
          href={mr.webUrl}
          target='_blank'
          rel='noreferrer'
          className='btn btn-ghost xs text-xs px-2 py-1.5 gap-1'
          title='Buka di GitLab'
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
