'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';

interface GitlabThreadReplyBarProps {
  projectId: number;
  mrIid: number;
  discussionId: string;
  isResolved: boolean;
  onRefresh: () => void;
  onError: (msg: string) => void;
}

export function GitlabThreadReplyBar({
  projectId,
  mrIid,
  discussionId,
  isResolved,
  onRefresh,
  onError,
}: GitlabThreadReplyBarProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [togglingResolve, setTogglingResolve] = useState(false);

  const handleToggleResolve = async () => {
    setTogglingResolve(true);
    try {
      const res = await fetch('/api/gitlab/incoming-reviews/discussions/resolve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mrIid,
          discussionId,
          resolved: !isResolved,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal mengubah status resolusi.');
      onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setTogglingResolve(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/gitlab/incoming-reviews/discussions/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mrIid,
          discussionId,
          comment: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal mengirim balasan.');
      setReplyText('');
      setReplyOpen(false);
      onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className='flex items-center justify-between gap-3 px-3.5 py-2.5 bg-surface-subtle border-t border-border'>
      {/* Reply input field */}
      <div className='flex-1'>
        {!replyOpen ? (
          <input
            type='text'
            placeholder='Reply...'
            onClick={() => setReplyOpen(true)}
            readOnly
            className='w-full bg-surface border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-[12.5px] text-slate-text cursor-text'
          />
        ) : (
          <div className='flex flex-col gap-2'>
            <textarea
              rows={2}
              autoFocus
              placeholder='Tulis balasan Anda...'
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className='w-full bg-surface border border-slate-300 dark:border-slate-700 rounded-md p-3 text-[12.5px] text-slate-text resize-y font-sans'
            />
            <div className='flex items-center gap-2'>
              <button
                type='button'
                className='btn btn-primary xs text-[11.5px] px-2.5 py-1 gap-1'
                onClick={handleSendReply}
                disabled={submittingReply || !replyText.trim()}
              >
                <Send size={11} />
                <span>{submittingReply ? 'Mengirim...' : 'Comment'}</span>
              </button>
              <button
                type='button'
                className='btn btn-ghost xs text-[11.5px] px-2 py-1'
                onClick={() => {
                  setReplyOpen(false);
                  setReplyText('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve / Unresolve Thread Button */}
      <button
        type='button'
        onClick={handleToggleResolve}
        disabled={togglingResolve}
        className='bg-surface border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-1.5 text-xs font-medium text-slate-text cursor-pointer flex items-center gap-1.5 shrink-0'
      >
        <Check size={13} className={isResolved ? 'text-slate-text-3' : 'text-emerald-600'} />
        <span>
          {togglingResolve
            ? 'Memproses...'
            : isResolved
              ? 'Unresolve thread'
              : 'Resolve thread'}
        </span>
      </button>
    </div>
  );
}
