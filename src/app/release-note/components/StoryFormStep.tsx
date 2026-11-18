'use client';

import { ChevronRight, UserRound } from 'lucide-react';
import { Select } from '@/components/Select';
import {
  RELEASE_TARGETS,
  RELEASE_TARGET_LIST,
  SQUAD_OPTIONS,
  type DeploymentTask,
  type ReleaseMember,
  type ReleaseStoryForm,
} from '@/lib/release-deployment/model';
import { TaskChecklist } from './TaskChecklist';

interface StoryFormStepProps {
  form: ReleaseStoryForm;
  onChange: (patch: Partial<ReleaseStoryForm>) => void;
  onSubjectChange: (subject: string) => void;
  members: ReleaseMember[];
  optionsLoading: boolean;
  optionsError: string | null;
  tasks: DeploymentTask[];
  onAddTemplate: (label: string) => void;
  onAddManual: () => void;
  onTaskChange: (id: string, changes: Partial<DeploymentTask>) => void;
  onRemoveTask: (id: string) => void;
  error: string | null;
  onNext: () => void;
}

export function StoryFormStep({
  form,
  onChange,
  onSubjectChange,
  members,
  optionsLoading,
  optionsError,
  tasks,
  onAddTemplate,
  onAddManual,
  onTaskChange,
  onRemoveTask,
  error,
  onNext,
}: StoryFormStepProps) {
  const target = RELEASE_TARGETS[form.target];

  return (
    <div className='space-y-4'>
      <section className='card'>
        <h2 className='card-title'>Target Rilis</h2>
        <div className='flex flex-wrap items-center gap-2 mt-3'>
          {RELEASE_TARGET_LIST.map((option) => (
            <button
              key={option.key}
              type='button'
              onClick={() => onChange({ target: option.key })}
              aria-pressed={form.target === option.key}
              className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                form.target === option.key
                  ? 'border-brand bg-brand-light text-brand'
                  : 'border-border-strong bg-white text-slate-500 hover:border-brand'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className='text-xs text-slate-400 mt-1'>
          Epic tujuan: <b className='text-slate-600'>Release {target.label}</b>{' '}
          (SPA, ref {target.epicRef})
        </span>
      </section>

      <section className='card'>
        <h2 className='card-title'>User Story</h2>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3'>
          <div className='field'>
            <label htmlFor='release-squad'>Skuad</label>
            <Select
              id='release-squad'
              aria-label='Skuad'
              value={form.squad}
              placeholder='Pilih skuad...'
              onChange={(event) => onChange({ squad: event.target.value })}
            >
              <option value=''>Pilih skuad...</option>
              {SQUAD_OPTIONS.map((squad) => (
                <option key={squad} value={squad}>
                  {squad}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <label htmlFor='release-date'>Tanggal release</label>
            <input
              id='release-date'
              type='date'
              className='input'
              value={form.releaseDate}
              onChange={(event) =>
                onChange({ releaseDate: event.target.value })
              }
            />
          </div>

          <div className='field sm:col-span-2'>
            <label htmlFor='release-feature'>Nama fitur</label>
            <input
              id='release-feature'
              type='text'
              className='input'
              placeholder='Release Tracker'
              value={form.featureName}
              onChange={(event) =>
                onChange({ featureName: event.target.value })
              }
            />
          </div>

          <div className='field sm:col-span-2'>
            <label htmlFor='release-subject'>Judul user story</label>
            <input
              id='release-subject'
              type='text'
              className='input'
              value={form.subject}
              onChange={(event) => onSubjectChange(event.target.value)}
            />
            <p className='hint'>
              Format: [skuad] (tanggal/bulan release) Deployment Checklist
              nama fitur
            </p>
          </div>

          <div className='field sm:col-span-2'>
            <label htmlFor='release-description'>Deskripsi</label>
            <textarea
              id='release-description'
              className='textarea'
              rows={4}
              placeholder='Ringkasan fitur dan catatan deploy...'
              value={form.description}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
          </div>

          <div className='field'>
            <label htmlFor='release-assignee'>
              <span className='inline-flex items-center gap-1.5'>
                <UserRound size={13} className='text-brand' />
                Assignee
              </span>
            </label>
            <Select
              id='release-assignee'
              aria-label='Assignee'
              value={form.assigneeId === null ? '' : String(form.assigneeId)}
              disabled={optionsLoading}
              onChange={(event) =>
                onChange({
                  assigneeId: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
            >
              <option value=''>
                {optionsLoading ? 'Memuat anggota...' : 'Tanpa assignee'}
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
            {optionsError && (
              <p className='hint text-amber-600'>{optionsError}</p>
            )}
          </div>
        </div>
      </section>

      <section className='card'>
        <h2 className='card-title'>Task Deployment Checklist</h2>
        <div className='mt-3'>
          <TaskChecklist
            tasks={tasks}
            members={members}
            onAddTemplate={onAddTemplate}
            onAddManual={onAddManual}
            onChange={onTaskChange}
            onRemove={onRemoveTask}
          />
        </div>
      </section>

      {error && (
        <p className='rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700'>
          {error}
        </p>
      )}

      <div className='flex justify-end'>
        <button type='button' className='btn btn-primary' onClick={onNext}>
          Lanjut ke Upload
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
