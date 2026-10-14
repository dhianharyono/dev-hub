'use client';

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useAiTask } from '@/components/ai-task/AiTaskContext';
import type { WorkloadDaySummary } from './healer/types';
import { useGapHealer } from './healer/useGapHealer';
import { HealerDateSelector } from './healer/HealerDateSelector';
import { HealerCommitBanner } from './healer/HealerCommitBanner';
import { HealerEmptyState } from './healer/HealerEmptyState';
import { HealerSuggestionCard } from './healer/HealerSuggestionCard';
import { HealerFooter } from './healer/HealerFooter';

export function TimesheetGapHealerModal({
  isOpen,
  onClose,
  initialDay,
  allDays,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialDay: WorkloadDaySummary | null;
  allDays: WorkloadDaySummary[];
  onSuccess: () => void;
}) {
  const [selectedDateOverride, setSelectedDateOverride] = useState<
    string | null
  >(null);
  const { requestConfirmLeave } = useAiTask();

  // Filter weekdays with hours < 7.5
  const gapDays = allDays.filter((d) => d.isWeekday && d.hoursSpent < 7.5);
  const selectedDate =
    selectedDateOverride ?? initialDay?.date ?? gapDays[0]?.date ?? '';
  const activeDay =
    allDays.find((d) => d.date === selectedDate) || initialDay || gapDays[0];
  const missingHours = activeDay
    ? Math.max(0.5, Math.round((8.0 - activeDay.hoursSpent) * 10) / 10)
    : 8;

  const handleClose = () => {
    setSelectedDateOverride(null);
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  const {
    meta,
    generating,
    handleMinimize,
    taskId,
    submitting,
    suggestions,
    setSuggestions,
    detectedCommits,
    setDetectedCommits,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    handleGenerate,
    handleUpdateSuggestion,
    handleRemoveSuggestion,
    handleClearAll,
    handleAddManualSuggestion,
    handleSubmitToTaiga,
  } = useGapHealer({
    isOpen,
    activeDay,
    missingHours,
    onSuccess,
    onClose: handleClose,
  });

  const handleMinimizeAndClose = () => {
    handleMinimize();
    onClose();
  };

  const handleCloseRequest = () => {
    if (generating && taskId) {
      requestConfirmLeave(taskId, {
        onStay: () => {
          // Stay inside modal
        },
        onMinimize: () => {
          handleMinimizeAndClose();
        },
        onAbort: () => {
          handleClose();
        },
      });
    } else {
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseRequest}
      onMinimize={handleMinimizeAndClose}
      title='Timesheet Gap Healer (AI)'
      subtitle='Penuhi target jam kerja 8.0 jam/hari otomatis dengan saran task AI berbasis commit GitLab.'
      size='lg'
      footer={
        suggestions.length > 0 ? (
          <HealerFooter
            suggestions={suggestions}
            submitting={submitting}
            onSubmit={handleSubmitToTaiga}
          />
        ) : null
      }
    >
      <div className='flex flex-col gap-4'>
        {/* Date Selector & Status Card */}
        <HealerDateSelector
          selectedDate={selectedDate}
          onDateChange={(date) => {
            if (generating) {
              handleMinimize();
            }
            setSelectedDateOverride(date);
            handleClearAll();
          }}
          gapDays={gapDays}
          allDays={allDays}
          activeDay={activeDay}
          missingHours={missingHours}
        />

        {/* Empty / Generating State */}
        {suggestions.length === 0 && (
          <HealerEmptyState
            generating={generating}
            missingHours={missingHours}
            activeDay={activeDay}
            onGenerate={() => handleGenerate()}
          />
        )}

        {/* List of Suggestions */}
        {suggestions.length > 0 && (
          <div className='flex flex-col gap-3'>
            <HealerCommitBanner
              commits={detectedCommits}
              date={activeDay?.date}
            />

            <div className='row-between flex-wrap gap-2'>
              <span className='xs dim font-semibold'>
                DRAF TASK YANG AKAN DICATAT ({suggestions.length} ITEM)
              </span>
              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  className='btn btn-ghost btn-sm text-[11px] px-2 py-1 gap-1'
                  title='Generate ulang saran task AI berbasis commit GitLab'
                >
                  <RefreshCw size={12} className={generating ? 'spin' : ''} />
                  <span>
                    {generating ? 'Menganalisis...' : 'Generate Ulang AI'}
                  </span>
                </button>
                <button
                  type='button'
                  onClick={handleAddManualSuggestion}
                  className='btn btn-sm text-[11px] px-2 py-1 gap-1'
                >
                  <Plus size={13} />
                  <span>Tambah Item</span>
                </button>
                <button
                  type='button'
                  onClick={handleClearAll}
                  className='btn btn-ghost btn-sm text-[11px] px-2 py-1 gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10'
                  title='Hapus draf task hasil analisis'
                >
                  <Trash2 size={12} />
                  <span>Hapus Draf</span>
                </button>
              </div>
            </div>

            {suggestions.map((sug, idx) => (
              <HealerSuggestionCard
                key={idx}
                sug={sug}
                idx={idx}
                meta={meta}
                onUpdate={handleUpdateSuggestion}
                onRemove={handleRemoveSuggestion}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
