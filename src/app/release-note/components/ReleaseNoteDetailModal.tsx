'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { Modal } from '@/components/Modal';
import type { ReleaseNoteDetail } from '@/lib/release-note/model';

interface ReleaseNoteDetailModalProps {
  noteRef: number;
  onClose: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function ReleaseNoteDetailModal({
  noteRef,
  onClose,
}: ReleaseNoteDetailModalProps) {
  const [note, setNote] = useState<ReleaseNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/release-note/detail?ref=${noteRef}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Gagal memuat release note');
        }
        return payload.note as ReleaseNoteDetail;
      })
      .then((data) => {
        if (!ignore) setNote(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [noteRef]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size='xl'
      title={note?.subject ?? `Release Note #${noteRef}`}
      subtitle={note ? `Epic ${note.source} · #${note.ref}` : undefined}
    >
      {loading ? (
        <div className='py-12 flex items-center justify-center gap-2 text-slate-500 text-sm'>
          <Loader2 size={16} className='animate-spin' />
          Memuat release note...
        </div>
      ) : error ? (
        <div className='alert alert-error flex items-start gap-2'>
          <AlertCircle size={16} className='mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : note ? (
        <div className='space-y-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600'>
              <span>Sumber: {note.source}</span>
              <span>Status: {note.status.name}</span>
              {note.milestone && <span>Sprint: {note.milestone}</span>}
              <span>Diperbarui {formatDate(note.modifiedDate)}</span>
            </div>
            <a
              href={note.url}
              target='_blank'
              rel='noreferrer'
              className='btn btn-ghost btn-sm'
            >
              <ExternalLink size={14} />
              Buka di Taiga
            </a>
          </div>

          <section>
            <h2 className='card-title mb-2'>Deskripsi</h2>
            {note.description.trim() ? (
              <Markdown text={note.description} />
            ) : (
              <p className='muted text-[13px]'>Belum ada deskripsi.</p>
            )}
          </section>

          <section>
            <h2 className='card-title mb-2'>
              Task deployment ({note.tasks.length})
            </h2>
            {note.tasks.length === 0 ? (
              <p className='muted text-[13px]'>
                Belum ada task di bawah item ini.
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='table'>
                  <thead>
                    <tr className='bg-surface-subtle/50'>
                      <th className='w-20'>Ref</th>
                      <th>Task</th>
                      <th className='w-32'>Status</th>
                      <th className='w-24 text-right'>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {note.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className='font-mono text-[12px] text-slate-500'>
                          #{task.ref}
                        </td>
                        <td className='font-medium'>{task.subject}</td>
                        <td className='text-[13px] text-slate-600'>
                          {task.status.name}
                        </td>
                        <td className='text-right'>
                          <a
                            href={task.url}
                            target='_blank'
                            rel='noreferrer'
                            className='btn btn-ghost btn-sm'
                          >
                            Taiga
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
