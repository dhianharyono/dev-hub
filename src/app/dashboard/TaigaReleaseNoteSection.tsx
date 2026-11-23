'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import type { ReleaseNoteSummary } from '@/lib/release-note/model';

type LoadState = 'loading' | 'ready' | 'empty' | 'unavailable';

const CLOSED_STATUSES = new Set(['done', 'closed']);
const MAX_ACTIVE_ROWS = 3;

function isClosedNote(note: ReleaseNoteSummary) {
  return CLOSED_STATUSES.has(note.status.name.trim().toLowerCase());
}

function formatDate(value: string) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return value.slice(0, 10);
  }
}

interface NoteRowProps {
  note: ReleaseNoteSummary;
  changeCount?: number | null;
}

function NoteRow({ note, changeCount }: NoteRowProps) {
  return (
    <div className='flex items-start gap-2 min-w-0'>
      <FileText size={13} className='text-brand shrink-0 mt-0.5' />
      <div className='flex flex-col gap-1 min-w-0'>
        <span
          className='text-[11.5px] font-bold text-slate-text leading-snug line-clamp-2'
          title={note.subject}
        >
          {note.subject}
        </span>

        <div className='flex items-center flex-wrap gap-1.5 text-[10px]'>
          <span className='inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full border border-border bg-surface text-slate-text-2'>
            <span
              className='w-1.5 h-1.5 rounded-full shrink-0'
              style={{ backgroundColor: note.status.color }}
            />
            {note.status.name}
          </span>
          <span className='inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-full border border-border bg-surface text-slate-text-2'>
            <span
              className='w-1.5 h-1.5 rounded-full shrink-0'
              style={{
                backgroundColor:
                  note.source === 'Production' ? '#10b981' : '#06b6d4',
              }}
            />
            {note.source}
          </span>
          <span className='text-slate-muted font-medium'>
            {formatDate(note.createdDate)}
          </span>
          {changeCount !== undefined && (
            <span className='text-slate-muted font-medium'>
              {changeCount === null
                ? 'Jumlah perubahan belum tersedia'
                : `${changeCount} perubahan`}
            </span>
          )}
          {note.milestone && (
            <span className='text-slate-muted font-medium truncate max-w-full'>
              {note.milestone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaigaReleaseNoteSection() {
  const [activeNotes, setActiveNotes] = useState<ReleaseNoteSummary[]>([]);
  const [doneNote, setDoneNote] = useState<ReleaseNoteSummary | null>(null);
  const [changeCount, setChangeCount] = useState<number | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/release-note/list');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Gagal memuat');

        const notes: ReleaseNoteSummary[] = Array.isArray(payload.notes)
          ? payload.notes
          : [];
        const byDateDesc = [...notes].sort((a, b) =>
          b.createdDate.localeCompare(a.createdDate),
        );

        if (!active) return;
        if (byDateDesc.length === 0) {
          setState('empty');
          return;
        }

        const activeList = byDateDesc.filter((n) => !isClosedNote(n));
        const latestDone = byDateDesc.find((n) => isClosedNote(n)) ?? null;

        setActiveNotes(activeList);
        setDoneNote(latestDone);
        setState('ready');

        if (!latestDone) return;
        const detailResponse = await fetch(
          `/api/release-note/detail?ref=${latestDone.ref}`,
        );
        if (!detailResponse.ok) return;
        const detail = await detailResponse.json();
        if (!active) return;
        const tasks = detail?.note?.tasks;
        setChangeCount(Array.isArray(tasks) ? tasks.length : null);
      } catch {
        if (active) setState('unavailable');
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const visibleActiveNotes = activeNotes.slice(0, MAX_ACTIVE_ROWS);
  const hiddenActiveCount = activeNotes.length - visibleActiveNotes.length;

  return (
    <div className='flex flex-col gap-3 p-5 sm:p-6 bg-slate-50/70 border border-border rounded-2xl'>
      <div className='flex items-center justify-between gap-2 pb-2 border-b border-border/60'>
        <h3 className='text-[12px] font-bold text-slate-text m-0'>
          Release Note Terbaru
        </h3>
        <Link
          href='/release-note'
          className='inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline'
        >
          <span>Buka Release Note</span>
          <ChevronRight size={12} />
        </Link>
      </div>

      {state === 'loading' && (
        <div className='flex flex-col gap-2 animate-pulse'>
          <div className='h-2.5 w-3/4 rounded bg-slate-200' />
          <div className='h-2.5 w-1/2 rounded bg-slate-200' />
        </div>
      )}

      {(state === 'empty' || state === 'unavailable') && (
        <p className='text-[11.5px] text-slate-muted leading-relaxed m-0'>
          {state === 'empty'
            ? 'Belum ada release note pada epic Staging dan Production.'
            : 'Release note belum bisa dimuat dari Taiga. Buka halaman Release Note untuk mencoba lagi.'}
        </p>
      )}

      {state === 'ready' && (
        <div className='flex flex-col gap-2.5'>
          {visibleActiveNotes.map((note) => (
            <NoteRow key={`active-${note.id}`} note={note} />
          ))}

          {hiddenActiveCount > 0 && (
            <p className='text-[10.5px] font-semibold text-slate-muted m-0'>
              +{hiddenActiveCount} release note aktif lainnya
            </p>
          )}

          {doneNote && (
            <div
              className={
                visibleActiveNotes.length > 0
                  ? 'flex flex-col gap-2 pt-2 border-t border-border/60'
                  : 'flex flex-col gap-2'
              }
            >
              <NoteRow note={doneNote} changeCount={changeCount} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
