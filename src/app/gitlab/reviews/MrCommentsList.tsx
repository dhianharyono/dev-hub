'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, RefreshCw, Sparkles, Filter } from 'lucide-react';
import type { IncomingMRItem, MRDiscussionItem, MRNoteItem } from './types';
import { GitlabDiscussionThread } from './GitlabDiscussionThread';
import { useNotification } from '@/components/Notification';

interface MrCommentsListProps {
  mr: IncomingMRItem | null;
  refreshTrigger: number;
  onOpenAiReview: () => void;
}

export function MrCommentsList({
  mr,
  refreshTrigger,
  onOpenAiReview,
}: MrCommentsListProps) {
  const { notify } = useNotification();
  const [discussions, setDiscussions] = useState<MRDiscussionItem[]>([]);
  const [notes, setNotes] = useState<MRNoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);

  useEffect(() => {
    if (error) {
      notify.error(error, 'Komentar MR');
    }
  }, [error, notify]);

  const fetchDiscussions = useCallback(async () => {
    if (!mr) {
      setDiscussions([]);
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gitlab/incoming-reviews/notes?projectId=${mr.projectId}&mrIid=${mr.iid}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal memuat catatan & komentar MR.');
      }
      setDiscussions(data.discussions || []);
      setNotes(data.notes || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mr]);

  useEffect(() => {
    if (!mr) {
      return;
    }
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(
          `/api/gitlab/incoming-reviews/notes?projectId=${mr.projectId}&mrIid=${mr.iid}`,
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !data.ok)
          throw new Error(data.error || 'Gagal memuat catatan & komentar MR.');
        setDiscussions(data.discussions || []);
        setNotes(data.notes || []);
      } catch (e) {
        if (!active) return;
        setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [mr, refreshTrigger]);

  if (!mr) {
    return (
      <div className='flex flex-col items-center justify-center flex-1 min-h-full py-14 px-5 text-center border border-dashed border-border rounded-xl bg-surface-subtle gap-3'>
        <MessageSquare
          size={36}
          className='text-slate-text-3 mb-2'
        />
        <strong className='text-sm text-slate-text'>
          Pilih Merge Request Terlebih Dahulu
        </strong>
        <p className='text-[12.5px] text-slate-text-3 max-w-[360px] m-0'>
          Pilih salah satu MR dari daftar untuk melihat thread komentar dan
          review seperti di GitLab.
        </p>
      </div>
    );
  }

  // Filter discussions: always show team/user comments only
  const filteredDiscussions = discussions.filter((d) => {
    if (unresolvedOnly && d.resolved) return false;
    return d.notes.some((n) => !n.system);
  });

  const userCommentsCount = notes.filter((n) => !n.system).length;

  return (
    <div className='flex flex-col gap-4 flex-1 min-h-full'>
      {/* Header Controls with clean padding and border */}
      <div className='row-between flex-wrap gap-3 items-center px-3 py-1.5 border-b border-border'>
        <div className='flex items-center gap-2'>
          <span className='text-[13px] font-semibold text-slate-text'>
            Komentar & Review MR
          </span>
          <span className='badge badge-cyan xs'>
            {userCommentsCount} Komentar Pengguna
          </span>
          {discussions.length > 0 && (
            <span className='badge badge-neutral xs'>
              {discussions.length} Thread
            </span>
          )}
        </div>

        <div className='flex items-center gap-2 flex-wrap px-4 py-3'>
          <button
            type='button'
            className={`btn xs ${unresolvedOnly ? 'btn-primary' : 'btn-ghost'} text-xs px-3 py-1 gap-1.5`}
            onClick={() => setUnresolvedOnly(!unresolvedOnly)}
            title={
              unresolvedOnly
                ? 'Tampilkan semua thread'
                : 'Tampilkan thread yang belum resolved'
            }
          >
            <Filter size={12} />
            <span>
              {unresolvedOnly ? 'Belum Resolved Saja' : 'Semua Status'}
            </span>
          </button>

          <button
            type='button'
            className='btn btn-ghost xs text-xs px-3 py-1 gap-1.5'
            onClick={fetchDiscussions}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className='flex-1 min-h-[340px] max-h-[520px] flex flex-col items-center justify-center text-center p-8 sm:px-6 border border-dashed border-border rounded-xl bg-surface-subtle gap-3.5 my-2'>
          <span className='spinner w-6 h-6' />
          <span className='dim xs'>
            Mengambil komentar MR langsung dari GitLab...
          </span>
        </div>
      ) : filteredDiscussions.length === 0 ? (
        /* Empty discussions state */
        <div className='flex-1 min-h-[340px] max-h-[520px] flex flex-col items-center justify-center text-center p-8 sm:px-6 border border-dashed border-border rounded-xl bg-surface-subtle gap-3.5 my-2'>
          <div className='w-[52px] h-[52px] rounded-full bg-primary/[0.08] text-primary flex items-center justify-center'>
            <MessageSquare size={24} />
          </div>
          <div>
            <strong className='text-[14.5px] text-slate-text block'>
              Belum Ada Komentar Review
            </strong>
            <p className='text-[12.5px] text-slate-text-3 max-w-[420px] mx-auto mt-1.5 mb-4 leading-normal'>
              MR ini belum memiliki komentar review dari tim. Buat review
              pertama sekarang menggunakan asisten AI otomatis!
            </p>
          </div>
          <button
            type='button'
            className='btn btn-primary xs text-[12.5px] px-4 py-1.5 gap-1.5'
            onClick={onOpenAiReview}
          >
            <Sparkles size={13} />
            <span>Buat Komentar Review dengan AI</span>
          </button>
        </div>
      ) : (
        /* Render GitLab Discussion Threads */
        <div>
          {filteredDiscussions.map((disc) => (
            <GitlabDiscussionThread
              key={disc.id}
              projectId={mr.projectId}
              mrIid={mr.iid}
              mrAuthorUsername={mr.author.username}
              discussion={disc}
              onRefresh={fetchDiscussions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
