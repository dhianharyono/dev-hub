'use client';

import { Copy, Eye, FileText, Trash2 } from 'lucide-react';
import type { SavedReleaseNote } from '@/lib/release-note/types';

interface ReleaseNoteHistoryProps {
  notes: SavedReleaseNote[];
  loading: boolean;
  error: string | null;
  onOpen: (note: SavedReleaseNote) => void;
  onCopy: (content: string) => void;
  onDelete: (note: SavedReleaseNote) => void;
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ReleaseNoteHistory({
  notes,
  loading,
  error,
  onOpen,
  onCopy,
  onDelete,
}: ReleaseNoteHistoryProps) {
  return (
    <section className='card'>
      <div className='card-title m-0'>
        <span>Riwayat Release Note</span>
      </div>

      {error && <p className='alert alert-error m-0 mb-3'>{error}</p>}

      {loading ? (
        <p className='xs dim m-0'>Memuat riwayat...</p>
      ) : notes.length === 0 ? (
        <p className='empty m-0'>Belum ada release note yang disimpan.</p>
      ) : (
        <div className='flex flex-col gap-2'>
          {notes.map((note) => (
            <div
              key={note.id}
              className='rounded-xl border border-border bg-surface-subtle p-3 flex items-start justify-between gap-3 flex-wrap'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <FileText size={14} className='text-brand shrink-0' />
                  <span className='text-sm font-bold text-slate-text truncate'>
                    {note.releaseTitle}
                  </span>
                  {note.targetBranch && (
                    <span className='badge'>
                      {note.targetBranch === 'release'
                        ? 'Staging'
                        : note.targetBranch === 'master'
                          ? 'Production'
                          : note.targetBranch}
                    </span>
                  )}
                  <span className='badge'>{note.mrIids.length} MR</span>
                </div>
                <p className='xs dim mt-1 mb-0'>
                  {note.projectPath} · Deploy {note.deployAt} · Disimpan{' '}
                  {formatCreatedAt(note.createdAt)}
                </p>
              </div>

              <div className='flex items-center gap-2 flex-wrap'>
                <button
                  type='button'
                  className='btn btn-sm btn-ghost border border-border gap-1.5'
                  onClick={() => onOpen(note)}
                >
                  <Eye size={13} />
                  <span>Buka</span>
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-ghost border border-border gap-1.5'
                  onClick={() => onCopy(note.content)}
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  type='button'
                  className='btn btn-sm btn-ghost text-rose-600 gap-1.5'
                  onClick={() => onDelete(note)}
                  title={`Hapus release note ${note.releaseTitle}`}
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
