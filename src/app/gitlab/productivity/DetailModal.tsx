'use client';

import type { ReactNode } from 'react';
import { Modal } from '@/components/Modal';

export interface DetailStat {
  label: string;
  value: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: ReactNode;
  explanation: string;
  stats: DetailStat[];
  listTitle: string;
  loading?: boolean;
  error?: string | null;
  action: string;
  children?: ReactNode;
}

/**
 * Pola popup yang sama untuk empat kartu produktivitas: penjelasan, angka
 * ringkas, daftar bukti, lalu rekomendasi tindakan.
 */
export function DetailModal({
  isOpen,
  onClose,
  title,
  badge,
  explanation,
  stats,
  listTitle,
  loading = false,
  error = null,
  action,
  children,
}: DetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size='md' title={title} badge={badge}>
      <div className='flex flex-col gap-4'>
        <p className='text-[12.5px] leading-relaxed text-slate-text-2'>{explanation}</p>

        <div className={stats.length >= 4 ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='rounded-lg border border-border bg-surface-subtle px-3 py-2'
            >
              <div className='text-[10px] uppercase tracking-wide text-slate-400'>
                {stat.label}
              </div>
              <div className='text-[15px] font-bold text-slate-text'>{stat.value}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className='text-[11px] font-bold uppercase tracking-wide text-slate-muted'>
            {listTitle}
          </h4>
          {loading ? (
            <p className='mt-2 text-[12px] text-slate-muted'>Memuat detail…</p>
          ) : error ? (
            <p className='mt-2 text-[12px] text-rose-600'>{error}</p>
          ) : (
            <div className='mt-2'>{children}</div>
          )}
        </div>

        <div className='rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5'>
          <h4 className='text-[11px] font-bold uppercase tracking-wide text-cyan-800'>
            Yang perlu dilakukan
          </h4>
          <p className='mt-1 text-[12px] leading-relaxed text-cyan-900'>{action}</p>
        </div>
      </div>
    </Modal>
  );
}

/** Baris bukti dengan path:baris mono dan cuplikan satu baris. */
export function DetailCodeRow({
  path,
  line,
  snippet,
  meta,
}: {
  path: string;
  line: number;
  snippet: string;
  meta?: string;
}) {
  return (
    <li className='rounded-md border border-border bg-surface-subtle px-2.5 py-1.5'>
      <div className='flex items-center justify-between gap-2 font-mono text-[11px] text-slate-text-2'>
        <span className='truncate'>
          {path}
          <span className='text-cyan-700'>:{line}</span>
        </span>
        {meta && <span className='shrink-0 text-[10px] text-slate-400'>{meta}</span>}
      </div>
      <div className='mt-0.5 break-all font-mono text-[11px] text-slate-muted'>{snippet}</div>
    </li>
  );
}

/** Baris bukti ringkas: judul di kiri, angka di kanan. */
export function DetailCountRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <li className='flex items-center justify-between gap-3 rounded-md border border-border bg-surface-subtle px-2.5 py-1.5'>
      <span className='min-w-0 truncate font-mono text-[11px] text-slate-text-2' title={label}>
        {label}
      </span>
      <span className='shrink-0 text-right'>
        <span className='text-[11.5px] font-bold text-slate-text'>{value}</span>
        {hint && <span className='ml-1 text-[10px] text-slate-400'>{hint}</span>}
      </span>
    </li>
  );
}

/** Baris bukti commit: judul di kiri, sha + tanggal di kanan. */
export function DetailCommitRow({
  title,
  sha,
  date,
  hint,
}: {
  title: string;
  sha: string;
  date?: string;
  hint?: string;
}) {
  return (
    <li className='rounded-md border border-border bg-surface-subtle px-2.5 py-1.5'>
      <div className='flex items-center justify-between gap-2'>
        <span className='min-w-0 truncate text-[11.5px] text-slate-text-2' title={title}>
          {title}
        </span>
        <span className='shrink-0 font-mono text-[10px] text-slate-400'>
          {sha.slice(0, 7)}
          {date ? ` · ${date}` : ''}
        </span>
      </div>
      {hint && <div className='mt-0.5 text-[10.5px] text-slate-400'>{hint}</div>}
    </li>
  );
}

/** Catatan kecil di bawah daftar bukti. */
export function DetailNote({ children }: { children: ReactNode }) {
  return <p className='text-[11.5px] leading-relaxed text-slate-muted'>{children}</p>;
}
