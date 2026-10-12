'use client';

import { Trash2 } from 'lucide-react';
import { Select } from '@/components/Select';
import { type Meta, TIME_SLOTS } from './types';

interface SmartTaskBulkBarProps {
  allSelected: boolean;
  toggleSelectAll: () => void;
  draftsCount: number;
  selectedCount: number;
  meta: Meta | null;
  onBulkSetUserStory: (usId: number | null) => void;
  onBulkSetStatus: (stId: number | null) => void;
  onBulkSetDate: (date: string) => void;
  onBulkSetStartTime: (time: string) => void;
  onBulkDeleteSelected: () => void;
}

export function SmartTaskBulkBar({
  allSelected,
  toggleSelectAll,
  draftsCount,
  selectedCount,
  meta,
  onBulkSetUserStory,
  onBulkSetStatus,
  onBulkSetDate,
  onBulkSetStartTime,
  onBulkDeleteSelected,
}: SmartTaskBulkBarProps) {
  return (
    <div className='flex items-center justify-between gap-3 flex-wrap p-3.5 sm:p-4 rounded-xl border border-border bg-surface shadow-xs'>
      <div className='flex items-center gap-2.5'>
        <label className='inline-flex items-center gap-2 text-xs text-slate-muted cursor-pointer select-none'>
          <input
            type='checkbox'
            checked={allSelected}
            onChange={toggleSelectAll}
            className='w-4 h-4 cursor-pointer accent-brand'
          />
          <strong>Pilih Semua ({draftsCount})</strong>
        </label>
      </div>

      {selectedCount > 0 && (
        <div className='flex items-center gap-1.5 flex-wrap'>
          {meta && (
            <Select
              size='sm'
              className='w-[160px]'
              value=''
              placeholder='Set US Induk...'
              onChange={(e) =>
                onBulkSetUserStory(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value=''>Set US Induk...</option>
              {meta.userStories.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.ref} {u.subject.slice(0, 20)}...
                </option>
              ))}
            </Select>
          )}

          {meta && (
            <Select
              size='sm'
              className='w-[130px]'
              value=''
              placeholder='Set Status...'
              onChange={(e) =>
                onBulkSetStatus(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value=''>Set Status...</option>
              {meta.taskStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          <input
            type='date'
            className='input small w-[130px] h-8 px-2 text-xs'
            title='Set Tanggal untuk task terpilih'
            onChange={(e) => {
              if (e.target.value) onBulkSetDate(e.target.value);
            }}
          />

          <Select
            size='sm'
            className='w-[115px]'
            value=''
            placeholder='Jam Mulai...'
            onChange={(e) => {
              if (e.target.value) onBulkSetStartTime(e.target.value);
            }}
          >
            <option value=''>Jam Mulai...</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <button
            type='button'
            className='btn btn-sm btn-ghost btn-danger h-8 px-2.5'
            onClick={onBulkDeleteSelected}
            title='Hapus task yang dicentang'
          >
            <Trash2 size={13} />
            <span>Hapus ({selectedCount})</span>
          </button>
        </div>
      )}
    </div>
  );
}
