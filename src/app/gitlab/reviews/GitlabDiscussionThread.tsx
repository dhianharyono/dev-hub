'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Smile,
  MoreVertical,
} from 'lucide-react';
import type { MRDiscussionItem } from './types';
import { GitlabIdenticon } from './GitlabIdenticon';
import { GitlabDiffSnippet } from './GitlabDiffSnippet';
import { GitlabThreadReplyBar } from './GitlabThreadReplyBar';
import { Markdown } from '@/components/Markdown';
import { useNotification } from '@/components/Notification';

interface GitlabDiscussionThreadProps {
  projectId: number;
  mrIid: number;
  mrAuthorUsername?: string;
  discussion: MRDiscussionItem;
  onRefresh: () => void;
}

function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '';
  const diffSec = Math.max(
    1,
    Math.floor((Date.now() - new Date(isoString).getTime()) / 1000),
  );
  if (diffSec < 60) return 'baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export function GitlabDiscussionThread({
  projectId,
  mrIid,
  mrAuthorUsername,
  discussion,
  onRefresh,
}: GitlabDiscussionThreadProps) {
  const { notify } = useNotification();
  const [collapsed, setCollapsed] = useState(false);

  const rootNote = discussion.notes[0];
  if (!rootNote) return null;

  const isResolved = discussion.resolved;
  const isDiffThread = Boolean(rootNote.position || discussion.diffContext);

  return (
    <div className='border border-border rounded-lg bg-surface shadow-xs overflow-hidden mb-4 p-3 sm:px-4'>
      {/* 1. Thread Header matching Gambar 1 */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 bg-surface-subtle ${
          collapsed ? '' : 'border-b border-border'
        }`}
      >
        <div className='flex items-center gap-2.5'>
          <GitlabIdenticon
            username={rootNote.author.username}
            size={26}
          />
          <div>
            <div className='text-[13px] text-slate-text'>
              <strong>{rootNote.author.name}</strong>{' '}
              <span className='text-slate-text-3'>
                @{rootNote.author.username} started a thread on{' '}
                {isDiffThread
                  ? 'an old version of the diff'
                  : 'the merge request'}{' '}
                {formatTimeAgo(rootNote.createdAt)}
              </span>
            </div>
            {isResolved && (
              <div className='text-[11.5px] text-slate-text-3 mt-0.5'>
                Resolved {formatTimeAgo(discussion.resolvedAt)}
                {discussion.resolvedBy
                  ? ` by ${discussion.resolvedBy.name}`
                  : ''}
              </div>
            )}
          </div>
        </div>

        <button
          type='button'
          onClick={() => setCollapsed(!collapsed)}
          className='bg-transparent border-none cursor-pointer text-primary text-xs font-medium flex items-center gap-1 px-2 py-1 rounded'
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          <span>{collapsed ? 'Show thread' : 'Hide thread'}</span>
        </button>
      </div>

      {/* 2. Expanded Thread Body */}
      {!collapsed && (
        <div className='p-3 sm:px-4'>
          {/* Diff context snippet table */}
          {discussion.diffContext && (
            <GitlabDiffSnippet diffContext={discussion.diffContext} />
          )}

          {/* Notes in this discussion */}
          <div className='flex flex-col gap-3.5'>
            {discussion.notes.map((note, noteIdx) => {
              const isAuthor = note.author.username === mrAuthorUsername;
              return (
                <div
                  key={note.id || noteIdx}
                  className='flex flex-col'
                >
                  <div className='w-full min-w-0'>
                    {/* Note header row */}
                    <div className='flex items-center justify-between mb-1'>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <strong className='text-[13px] text-slate-text'>
                          {note.author.name}
                        </strong>
                        <span className='text-xs text-slate-text-3'>
                          @{note.author.username} ·{' '}
                          {formatTimeAgo(note.createdAt)}
                        </span>
                        <span className='text-[11px] px-1.5 py-px rounded-full bg-surface-subtle text-slate-text-2 border border-border font-medium'>
                          {isAuthor ? 'Author' : 'Maintainer'}
                        </span>
                      </div>

                      {/* Action icons matching GitLab */}
                      <div className='flex items-center gap-1.5 text-slate-text-3'>
                        {isResolved && noteIdx === 0 && (
                          <span title='Resolved'>
                            <CheckCircle2 size={15} className='text-emerald-600' />
                          </span>
                        )}
                        <span
                          className='cursor-pointer flex'
                          title='Tambahkan reaksi'
                        >
                          <Smile size={14} />
                        </span>
                        <span
                          className='cursor-pointer flex'
                          title='Pilihan lainnya'
                        >
                          <MoreVertical size={14} />
                        </span>
                      </div>
                    </div>

                    {/* Markdown Body */}
                    <Markdown text={note.body} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Bottom Reply & Resolve Bar matching Gambar 1 */}
      {!collapsed && (
        <GitlabThreadReplyBar
          projectId={projectId}
          mrIid={mrIid}
          discussionId={discussion.id}
          isResolved={isResolved}
          onRefresh={onRefresh}
          onError={(err) => notify.error(err, 'Diskusi GitLab')}
        />
      )}
    </div>
  );
}
