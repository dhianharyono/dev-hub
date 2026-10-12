'use client';

import { Trash2 } from 'lucide-react';
import { Select } from '@/components/Select';
import type { HealerSuggestion, MetaData } from './types';

interface HealerSuggestionCardProps {
  sug: HealerSuggestion;
  idx: number;
  meta: MetaData | null;
  onUpdate: (index: number, field: keyof HealerSuggestion, value: unknown) => void;
  onRemove: (index: number) => void;
}

export function HealerSuggestionCard({
  sug,
  idx,
  meta,
  onUpdate,
  onRemove,
}: HealerSuggestionCardProps) {
  return (
    <div className='border border-border rounded-xl p-3.5 sm:px-4 bg-surface flex flex-col gap-2.5'>
      {/* Card Header: Badges & Remove */}
      <div className='flex gap-2 items-center justify-between flex-wrap'>
        <div className='flex gap-1.5 items-center flex-wrap'>
          <span className='px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold rounded-md shrink-0'>
            Task #{idx + 1}
          </span>
          <span className='px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-md inline-flex items-center gap-1 border border-blue-200 dark:border-blue-900'>
            <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
            In Progress
          </span>
          <span className='px-1.5 py-0.5 bg-surface-subtle text-slate-text-2 text-[11px] font-medium rounded-md border border-border inline-flex items-center gap-1'>
            👤{' '}
            {meta?.me?.full_name_display ||
              meta?.me?.username ||
              'Assign ke Saya'}
          </span>
        </div>

        <button
          type='button'
          onClick={() => onRemove(idx)}
          className='bg-transparent border-none text-rose-500 cursor-pointer p-1 hover:text-rose-600 transition-colors'
          title='Hapus task ini'
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Task Subject */}
      <div className='flex gap-2 items-center'>
        <input
          type='text'
          className='input flex-1 font-semibold text-[13px] h-[34px]'
          value={sug.subject}
          onChange={(e) => onUpdate(idx, 'subject', e.target.value)}
          placeholder='Judul Task'
        />
      </div>

      {/* Details Grid */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5'>
        {/* User Story Parent */}
        <div className='col-span-2'>
          <label className='xs dim block mb-1'>
            Induk User Story
          </label>
          <Select
            size='sm'
            value={sug.parentUserStoryId ?? ''}
            onChange={(e) =>
              onUpdate(
                idx,
                'parentUserStoryId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className='w-full h-8 text-xs'
          >
            <option value=''>Tanpa User Story Induk</option>
            {meta?.userStories?.map((u) => (
              <option key={u.id} value={u.id}>
                #{u.ref} {u.subject.slice(0, 48)}
              </option>
            ))}
          </Select>
        </div>

        {/* Start Time */}
        <div>
          <label className='xs dim block mb-1'>
            Jam Mulai (08:00 - 17:00)
          </label>
          <input
            type='time'
            className='input w-full h-8 text-xs'
            value={sug.startTime}
            onChange={(e) => onUpdate(idx, 'startTime', e.target.value)}
          />
        </div>

        {/* Duration in Hours */}
        <div>
          <label className='xs dim block mb-1'>
            Durasi (Jam)
          </label>
          <input
            type='number'
            step='0.5'
            min='0.5'
            max='8'
            className='input w-full h-8 text-xs'
            value={sug.durationHours}
            onChange={(e) => onUpdate(idx, 'durationHours', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Description Markdown preview / edit */}
      <div>
        <label className='xs dim block mb-1'>
          Deskripsi Aktivitas
        </label>
        <textarea
          className='input w-full min-h-[110px] text-[12.5px] leading-relaxed p-2 sm:px-3 resize-y font-sans'
          rows={5}
          value={sug.description}
          onChange={(e) => onUpdate(idx, 'description', e.target.value)}
          placeholder='- Rincian aktivitas pekerjaan atau task...'
        />
      </div>
    </div>
  );
}
