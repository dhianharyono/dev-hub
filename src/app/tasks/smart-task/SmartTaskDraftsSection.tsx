'use client';

import { Plus, Send, Sparkles } from 'lucide-react';
import { SmartTaskBulkBar } from './SmartTaskBulkBar';
import { SmartTaskDraftCard } from './SmartTaskDraftCard';
import { SmartTaskEmptyState } from './SmartTaskEmptyState';
import type { Draft, Meta, Result, Status } from './types';

interface SmartTaskDraftsSectionProps {
  drafts: Draft[];
  selectedDrafts: Draft[];
  allSelected: boolean;
  totalHours: number;
  invalid: boolean;
  submitting: boolean;
  submitProgress: string | null;
  results: Result[] | null;
  parsing: boolean;
  meta: Meta | null;
  parentId: number | null;
  statusesFor: (kind: Draft['kind']) => Status[];
  onAddBlank: (count?: number) => void;
  onSubmit: () => void;
  onToggleSelectAll: () => void;
  onBulkSetUserStory: (usId: number | null) => void;
  onBulkSetStatus: (stId: number | null) => void;
  onBulkSetDate: (date: string) => void;
  onBulkSetStartTime: (time: string) => void;
  onBulkDeleteSelected: () => void;
  onUpdateDraft: (key: string, patch: Partial<Draft>) => void;
  onRemoveDraft: (key: string) => void;
  onUseExample: (text: string) => void;
}

export function SmartTaskDraftsSection({
  drafts,
  selectedDrafts,
  allSelected,
  totalHours,
  invalid,
  submitting,
  submitProgress,
  results,
  parsing,
  meta,
  parentId,
  statusesFor,
  onAddBlank,
  onSubmit,
  onToggleSelectAll,
  onBulkSetUserStory,
  onBulkSetStatus,
  onBulkSetDate,
  onBulkSetStartTime,
  onBulkDeleteSelected,
  onUpdateDraft,
  onRemoveDraft,
  onUseExample,
}: SmartTaskDraftsSectionProps) {
  return (
    <section
      className='flex flex-col gap-3.5'
      aria-labelledby='drafts-title'
    >
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='row wrap gap-2'>
          <h2 id='drafts-title' className='text-lg font-extrabold tracking-tight'>
            Review Draft Task
          </h2>
          <span className='badge badge-violet'>{drafts.length} task</span>
          {selectedDrafts.length > 0 && (
            <span className='badge'>{selectedDrafts.length} dipilih</span>
          )}
          {totalHours > 0 && (
            <span className='badge badge-cyan'>
              ⏱ {totalHours.toFixed(1)} jam
            </span>
          )}
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={() => onAddBlank(1)}
            id='btn-add-draft'
            title='Tambah 1 baris task kosong'
          >
            <Plus size={14} />
            <span>1 Task</span>
          </button>
          <button
            type='button'
            className='btn btn-sm'
            onClick={() => onAddBlank(3)}
            title='Tambah 3 baris kosong sekaligus'
          >
            <Plus size={14} />
            <span>3 Baris</span>
          </button>
          <button
            type='button'
            id='btn-submit'
            className='btn btn-primary btn-sm'
            onClick={onSubmit}
            disabled={!meta || !selectedDrafts.length || invalid || submitting}
          >
            {submitting ? <span className='spinner' /> : <Send size={14} />}
            <span>Kirim ({selectedDrafts.length})</span>
          </button>
        </div>
      </div>

      {drafts.length > 0 && (
        <SmartTaskBulkBar
          allSelected={allSelected}
          toggleSelectAll={onToggleSelectAll}
          draftsCount={drafts.length}
          selectedCount={selectedDrafts.length}
          meta={meta}
          onBulkSetUserStory={onBulkSetUserStory}
          onBulkSetStatus={onBulkSetStatus}
          onBulkSetDate={onBulkSetDate}
          onBulkSetStartTime={onBulkSetStartTime}
          onBulkDeleteSelected={onBulkDeleteSelected}
        />
      )}

      {submitProgress && (
        <div className='alert alert-info'>
          <span className='spinner' />
          <span>{submitProgress}</span>
        </div>
      )}

      {results && (
        <div className='stack gap-2'>
          {results.map((r, i) => (
            <div
              key={i}
              className={`alert ${r.ok ? 'alert-ok' : 'alert-error'}`}
            >
              <span>{r.ok ? '✓' : '✕'}</span>
              <div className='truncate'>
                {r.ok ? (
                  <a href={r.url} target='_blank' rel='noreferrer'>
                    <span className='mono'>#{r.ref}</span> {r.subject}{' '}
                    <span className='dim'>↗ (Buka di Taiga)</span>
                  </a>
                ) : (
                  <>
                    <strong>{r.subject}</strong>{' '}
                    <span className='muted'>{r.error}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {drafts.length === 0 && !parsing && (
        <SmartTaskEmptyState onUseExample={onUseExample} />
      )}

      {parsing && (
        <div>
          <div className='flex items-center gap-3.5 p-[16px_20px] bg-gradient-to-br from-violet-500/8 to-brand/6 border border-violet-500/25 rounded-[18px] mb-3.5'>
            <Sparkles size={20} className='text-violet-accent animate-spin [animation-duration:3s] shrink-0' />
            <div>
              <div className='font-bold text-[13px] text-slate-text'>
                Gemini AI sedang menstrukturkan catatan...
              </div>
              <div className='text-xs text-slate-dim mt-0.5'>
                Mengekstrak subject, deskripsi, estimasi jam, dan log waktu
                otomatis.
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-3'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='border border-border rounded-[18px] p-[18px] bg-surface shadow-sm flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <div className='h-4 w-1/4 rounded-[10px] bg-slate-200 animate-pulse' />
                  <div className='h-5 w-1/5 rounded-md bg-slate-200 animate-pulse' />
                </div>
                <div className='h-5 w-3/4 rounded-[10px] bg-slate-200 animate-pulse' />
                <div className='h-3.5 w-11/12 rounded-[10px] bg-slate-200 animate-pulse' />
                <div className='flex items-center gap-2 mt-1'>
                  <div className='h-7 w-[90px] rounded-md bg-slate-200 animate-pulse' />
                  <div className='h-7 w-[75px] rounded-md bg-slate-200 animate-pulse' />
                  <div className='h-7 w-[70px] rounded-md bg-slate-200 animate-pulse' />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {drafts.map((d, i) => (
        <SmartTaskDraftCard
          key={d.key}
          draft={d}
          index={i}
          meta={meta}
          parentId={parentId}
          statuses={statusesFor(d.kind)}
          onUpdate={onUpdateDraft}
          onRemove={onRemoveDraft}
        />
      ))}
    </section>
  );
}
