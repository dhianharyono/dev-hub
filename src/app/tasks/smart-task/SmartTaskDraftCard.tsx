'use client';

import { Calendar, FolderGit2, Trash2 } from 'lucide-react';
import { Select } from '@/components/Select';
import { SmartTaskTimesheetLog } from './SmartTaskTimesheetLog';
import type { Draft, Meta, Status } from './types';

interface SmartTaskDraftCardProps {
  draft: Draft;
  index: number;
  meta: Meta | null;
  loadingMeta?: boolean;
  projectSlug?: string;
  sprintSlug?: string;
  onProjectChange?: (slug: string) => void;
  onSprintChange?: (slug: string) => void;
  parentId: number | null;
  statuses: Status[];
  onUpdate: (key: string, patch: Partial<Draft>) => void;
  onRemove: (key: string) => void;
}

export function SmartTaskDraftCard({
  draft: d,
  index: i,
  meta,
  loadingMeta = false,
  projectSlug = '',
  sprintSlug = '',
  onProjectChange,
  onSprintChange,
  parentId,
  statuses,
  onUpdate,
  onRemove,
}: SmartTaskDraftCardProps) {
  return (
    <article
      className={`card relative transition-all hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md ${
        d.selected
          ? '!border-brand ring-1 ring-brand !shadow-[0_8px_24px_-6px_rgba(25,119,243,0.2)] !bg-surface-active'
          : ''
      }`}
    >
      <div className='flex items-center justify-between gap-3 mb-4'>
        <div className='flex items-center gap-2.5'>
          <input
            type='checkbox'
            checked={d.selected}
            onChange={(e) => onUpdate(d.key, { selected: e.target.checked })}
            className='w-5 h-5 cursor-pointer accent-violet-600'
            aria-label='Pilih task ini'
          />
          <span className='text-[11px] font-bold text-slate-muted px-2 py-0.5 bg-surface-subtle rounded-md border border-border'>#{i + 1}</span>

          <div className='segmented' role='group' aria-label='Tipe item'>
            <button
              type='button'
              aria-pressed={d.kind === 'task'}
              className='!py-1 !px-3 !text-xs font-semibold'
              onClick={() =>
                onUpdate(d.key, {
                  kind: 'task',
                  statusId: null,
                  userStoryId: d.userStoryId ?? parentId,
                })
              }
            >
              Task
            </button>
            <button
              type='button'
              aria-pressed={d.kind === 'userstory'}
              className='!py-1 !px-3 !text-xs font-semibold'
              onClick={() =>
                onUpdate(d.key, {
                  kind: 'userstory',
                  statusId: null,
                })
              }
            >
              User Story
            </button>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='btn btn-ghost btn-sm btn-icon btn-danger w-8 h-8 rounded-lg'
            aria-label='Hapus draft'
            title='Hapus draft ini'
            onClick={() => onRemove(d.key)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>


      {/* JUDUL TASK */}
      <input
        className='input text-[15px] sm:text-base font-bold text-slate-text px-4 py-2.5 rounded-xl border-border'
        value={d.subject}
        placeholder='Judul task (misal: Selesaikan perbaikan bug login)'
        aria-label='Judul task'
        onChange={(e) => onUpdate(d.key, { subject: e.target.value })}
      />

      {/* DESKRIPSI */}
      <textarea
        className='textarea min-h-[72px] mt-3 text-xs sm:text-sm leading-relaxed rounded-xl px-4 py-2.5 border-border'
        value={d.description}
        placeholder='Deskripsi tambahan atau acceptance criteria (opsional markdown)...'
        aria-label='Deskripsi task'
        onChange={(e) => onUpdate(d.key, { description: e.target.value })}
      />

      {/* TARGET PROJECT & SPRINT */}
      {onProjectChange && onSprintChange && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5'>
          <div className='field'>
            <label className='text-xs font-semibold text-slate-500 flex items-center gap-1.5'>
              <FolderGit2 size={13} className='text-brand' />
              <span>Target Project</span>
            </label>
            <Select
              size='sm'
              value={projectSlug}
              disabled={!meta || loadingMeta}
              onChange={(e) => onProjectChange(e.target.value)}
              className='!h-9 text-xs sm:text-sm font-semibold rounded-xl w-full'
            >
              {!meta && (
                <option value=''>
                  {loadingMeta ? 'Memuat project...' : '-'}
                </option>
              )}
              {meta?.projects?.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <label className='text-xs font-semibold text-slate-500 flex items-center gap-1.5'>
              <Calendar size={13} className='text-cyan-600' />
              <span>Target Sprint</span>
            </label>
            <Select
              size='sm'
              value={sprintSlug}
              disabled={!meta || loadingMeta}
              onChange={(e) => onSprintChange(e.target.value)}
              className='!h-9 text-xs sm:text-sm font-semibold rounded-xl w-full'
            >
              {!meta && (
                <option value=''>
                  {loadingMeta ? 'Memuat sprint...' : '-'}
                </option>
              )}
              {meta && !meta.sprint && <option value=''>(Backlog)</option>}
              {meta?.milestones.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* METADATA: INDUK, STATUS */}
      <div className='grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4 mt-3.5'>
        {d.kind === 'task' ? (
          <div className='field'>
            <label className='text-xs font-semibold text-slate-500'>
              User Story Induk
            </label>
            <Select
              size='sm'
              value={d.userStoryId ?? ''}
              placeholder='Pilih User Story dari PM...'
              onChange={(e) =>
                onUpdate(d.key, {
                  userStoryId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value=''>Pilih User Story dari PM...</option>
              {meta?.userStories.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.ref} · {u.subject}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className='field'>
            <label className='text-xs font-semibold text-slate-500'>Tipe Entitas</label>
            <div className='text-xs font-medium text-slate-500 h-9 flex items-center'>
              User Story Baru di Sprint
            </div>
          </div>
        )}

        <div className='field'>
          <label className='text-xs font-semibold text-slate-500'>Status</label>
          <Select
            size='sm'
            value={d.statusId ?? ''}
            placeholder={`Default (${statuses[0]?.name || 'New'})`}
            onChange={(e) =>
              onUpdate(d.key, {
                statusId: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value=''>Default ({statuses[0]?.name || 'New'})</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* TAIGA TIMESHEET / ACTIVITY LOG (KHUSUS TASK) */}
      {d.kind === 'task' && (
        <SmartTaskTimesheetLog
          activityDate={d.activityDate}
          startTime={d.startTime}
          totalTimeSpentMinutes={d.totalTimeSpentMinutes}
          onUpdateDate={(date) => onUpdate(d.key, { activityDate: date })}
          onUpdateStartTime={(time) => onUpdate(d.key, { startTime: time })}
          onUpdateDuration={(mins, hours) =>
            onUpdate(d.key, {
              totalTimeSpentMinutes: mins,
              estimateHours: hours,
            })
          }
        />
      )}
    </article>
  );
}
