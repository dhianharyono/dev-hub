'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, LogIn, RefreshCw } from 'lucide-react';
import { Select } from '@/components/Select';
import type {
  ReleaseNoteList as ReleaseNoteListData,
  ReleaseNoteSummary,
} from '@/lib/release-note/model';
import { ReleaseNoteDetailModal } from './ReleaseNoteDetailModal';

const PAGE_SIZE = 15;

async function fetchNotes(): Promise<ReleaseNoteListData> {
  const response = await fetch('/api/release-note/list');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Gagal memuat release note');
  }
  return payload as ReleaseNoteListData;
}

function matches(note: ReleaseNoteSummary, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return (
    note.subject.toLowerCase().includes(text) ||
    String(note.ref).includes(text) ||
    (note.milestone ?? '').toLowerCase().includes(text)
  );
}

export function ReleaseNoteList() {
  const [data, setData] = useState<ReleaseNoteListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<'ALL' | 'Staging' | 'Production'>('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedRef, setSelectedRef] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchNotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchNotes()
      .then((payload) => {
        if (!ignore) {
          setData(payload);
          setError(null);
        }
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
  }, []);

  const notes = useMemo(() => data?.notes ?? [], [data]);
  const statusOptions = useMemo(
    () =>
      Array.from(new Set(notes.map((note) => note.status.name))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [notes],
  );
  const filtered = useMemo(
    () =>
      notes.filter(
        (note) =>
          (source === 'ALL' || note.source === source) &&
          (status === 'ALL' || note.status.name === status) &&
          matches(note, search),
      ),
    [notes, source, status, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <section className='card animate-fade-up'>
      <div className='row wrap items-start justify-between gap-3 mb-4'>
        <div>
          <h2 className='card-title mb-1'>Release note yang sudah dibuat</h2>
          <p className='muted text-[13px]'>
            {data?.needsLogin
              ? 'Epic Staging dan Production di Taiga.'
              : data
                ? `${notes.length} tiket untuk ${data.assignee?.name ?? 'akun Taiga aktif'} · ${data.epics
                    .map((epic) => `${epic.source} ${epic.count}`)
                    .join(' · ')}`
                : 'Diambil dari epic Staging dan Production di Taiga.'}
          </p>
        </div>
        <button
          type='button'
          className='btn btn-ghost btn-sm'
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={14} className='animate-spin' />
          ) : (
            <RefreshCw size={14} />
          )}
          Muat ulang
        </button>
      </div>

      {data?.needsLogin ? (
        <div className='alert alert-info flex items-start gap-2'>
          <LogIn size={16} className='mt-0.5 shrink-0' />
          <span>
            Belum ada sesi Taiga. Login dulu, lalu sambungkan sesi lewat{' '}
            <Link href='/settings' className='font-medium underline'>
              Settings
            </Link>{' '}
            agar daftar release note bisa dimuat.
          </span>
        </div>
      ) : (
        <>
          <div className='flex items-center gap-3 flex-wrap mb-4'>
            <input
              type='text'
              className='input h-10 text-xs sm:text-sm rounded-xl w-[280px]'
              placeholder='Cari judul, nomor, atau sprint'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              aria-label='Cari release note'
            />
            <Select
              size='sm'
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className='w-[170px] !h-10 text-xs sm:text-sm rounded-xl'
            >
              <option value='ALL'>Semua Status</option>
              {statusOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              size='sm'
              value={source}
              onChange={(event) => {
                setSource(
                  event.target.value as 'ALL' | 'Staging' | 'Production',
                );
                setPage(1);
              }}
              className='w-[170px] !h-10 text-xs sm:text-sm rounded-xl'
            >
              <option value='ALL'>Semua Sumber</option>
              <option value='Staging'>Staging</option>
              <option value='Production'>Production</option>
            </Select>
          </div>

          {error && (
            <div className='alert alert-error mb-4 flex items-start gap-2'>
              <AlertCircle size={16} className='mt-0.5 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          {loading && notes.length === 0 ? (
            <div className='py-10 flex items-center justify-center gap-2 text-slate-500 text-sm'>
              <Loader2 size={16} className='animate-spin' />
              Memuat release note dari Taiga...
            </div>
          ) : visible.length === 0 ? (
            <div className='py-10 text-center text-slate-500 text-sm'>
              {notes.length === 0
                ? `Belum ada tiket di epic Staging maupun Production yang di-assign ke ${
                    data?.assignee?.name ?? 'akun Taiga aktif'
                  }.`
                : 'Tidak ada release note yang cocok dengan filter.'}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='table'>
                <thead>
                  <tr className='bg-surface-subtle/50'>
                    <th className='w-20'>Ref</th>
                    <th>Judul</th>
                    <th className='w-28'>Sumber</th>
                    <th className='w-32'>Status</th>
                    <th className='w-24 text-right'>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((note) => (
                    <tr
                      key={note.id}
                      className='cursor-pointer'
                      onClick={() => setSelectedRef(note.ref)}
                    >
                      <td className='font-mono text-[12px] text-slate-500'>
                        #{note.ref}
                      </td>
                      <td>
                        <span className='font-medium'>{note.subject}</span>
                      </td>
                      <td className='text-[13px] text-slate-600'>
                        {note.source}
                      </td>
                      <td className='text-[13px] text-slate-600'>
                        {note.status.name}
                      </td>
                      <td className='text-right'>
                        <button
                          type='button'
                          className='btn btn-ghost btn-sm'
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRef(note.ref);
                          }}
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className='row-between mt-4 flex-wrap gap-3'>
              <div className='dim xs'>
                Menampilkan <strong>{start + 1}</strong> -{' '}
                <strong>{Math.min(start + PAGE_SIZE, filtered.length)}</strong>{' '}
                dari <strong>{filtered.length}</strong> release note
              </div>
              {totalPages > 1 && (
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    className='btn btn-ghost xs px-2.5 py-1 text-xs'
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Prev
                  </button>
                  <span className='dim xs px-2'>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type='button'
                    className='btn btn-ghost xs px-2.5 py-1 text-xs'
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedRef !== null && (
        <ReleaseNoteDetailModal
          key={selectedRef}
          noteRef={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </section>
  );
}
