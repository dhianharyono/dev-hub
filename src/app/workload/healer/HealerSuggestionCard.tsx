'use client';

import { Trash2 } from 'lucide-react';
import { Select } from '@/components/Select';
import { TIME_SLOTS, type HealerSuggestion, type MetaData } from './types';

interface HealerSuggestionCardProps {
  sug: HealerSuggestion;
  idx: number;
  meta: MetaData | null;
  cardMeta?: MetaData | null;
  loadingProject?: boolean;
  onProjectChange?: (index: number, projectSlug: string) => void;
  onUpdate: (index: number, field: keyof HealerSuggestion, value: unknown) => void;
  onRemove: (index: number) => void;
}

function normalizeStartTime(val?: string): string {
  if (!val) return '09:00';
  const clean = val.replace('.', ':').trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    return `${hh}:${mm}`;
  }
  return clean;
}

export function HealerSuggestionCard({
  sug,
  idx,
  meta,
  cardMeta,
  loadingProject = false,
  onProjectChange,
  onUpdate,
  onRemove,
}: HealerSuggestionCardProps) {
  const projects = meta?.projects ?? (meta?.project ? [meta.project] : []);
  const currentProjectSlug =
    sug.projectSlug || cardMeta?.projectSlug || meta?.projectSlug || '';
  const activeStories = cardMeta?.userStories ?? meta?.userStories ?? [];
  const activeStatuses = cardMeta?.taskStatuses ?? meta?.taskStatuses ?? [];

  const normalizedStartTime = normalizeStartTime(sug.startTime);
  const timeOptions = TIME_SLOTS.includes(normalizedStartTime)
    ? TIME_SLOTS
    : [normalizedStartTime, ...TIME_SLOTS].sort();

  return (
    <div className='border border-border rounded-xl p-3.5 sm:px-4 bg-surface flex flex-col gap-2.5'>
      {/* Card Header: Badges & Remove */}
      <div className='flex gap-2 items-center justify-between flex-wrap'>
        <div className='flex gap-1.5 items-center flex-wrap'>
          <span className='px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold rounded-md shrink-0'>
            Task #{idx + 1}
          </span>
          <span className='px-1.5 py-0.5 bg-surface-subtle text-slate-text-2 text-[11px] font-medium rounded-md border border-border inline-flex items-center gap-1'>
            👤{' '}
            {cardMeta?.me?.full_name_display ||
              meta?.me?.full_name_display ||
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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
        {/* Project Taiga */}
        <div>
          <label className='xs dim block mb-1 font-medium'>
            Project Taiga
          </label>
          <Select
            size='sm'
            value={currentProjectSlug}
            disabled={projects.length === 0 || loadingProject}
            onChange={(e) => onProjectChange?.(idx, e.target.value)}
            className='w-full h-8 text-xs font-semibold'
          >
            {projects.length === 0 ? (
              <option value=''>Memuat project...</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* User Story Parent (synced with project) */}
        <div className='sm:col-span-1 lg:col-span-2'>
          <label className='xs dim block mb-1 font-medium'>
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
            {activeStories.map((u) => (
              <option key={u.id} value={u.id}>
                #{u.ref} {u.subject.slice(0, 48)}
              </option>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div>
          <label className='xs dim block mb-1 font-medium'>
            Status
          </label>
          <Select
            size='sm'
            value={sug.statusId ?? ''}
            onChange={(e) =>
              onUpdate(
                idx,
                'statusId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className='w-full h-8 text-xs font-medium'
          >
            {activeStatuses.length === 0 ? (
              <option value=''>Default (In Progress)</option>
            ) : (
              activeStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Jam Mulai (list jam seperti di smart task) */}
        <div>
          <label className='xs dim block mb-1 font-medium'>
            Jam Mulai (08:00 - 17:00)
          </label>
          <Select
            size='sm'
            value={normalizedStartTime}
            onChange={(e) => onUpdate(idx, 'startTime', e.target.value)}
            className='w-full h-8 text-xs font-medium'
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        {/* Duration in Hours */}
        <div>
          <label className='xs dim block mb-1 font-medium'>
            Durasi (Jam)
          </label>
          <input
            type='number'
            step='0.5'
            min='0.5'
            max='8'
            className='input w-full h-8 text-xs font-mono font-semibold'
            value={sug.durationHours}
            onChange={(e) => onUpdate(idx, 'durationHours', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Description Markdown preview / edit */}
      <div>
        <label className='xs dim block mb-1 font-medium'>
          Deskripsi Aktivitas
        </label>
        <textarea
          className='input w-full min-h-[180px] text-[12.5px] leading-relaxed p-2 sm:px-3 resize-y font-sans'
          rows={8}
          value={sug.description}
          onChange={(e) => onUpdate(idx, 'description', e.target.value)}
          placeholder='- Rincian aktivitas pekerjaan atau task...'
        />
      </div>
    </div>
  );
}
