'use client';

import type { HealerSuggestion } from './types';

interface HealerFooterProps {
  suggestions: HealerSuggestion[];
  submitting: boolean;
  onSubmit: () => void;
}

export function HealerFooter({
  suggestions,
  submitting,
  onSubmit,
}: HealerFooterProps) {
  if (suggestions.length === 0) return null;

  const totalDuration = suggestions
    .reduce((acc, s) => acc + s.durationHours, 0)
    .toFixed(1);

  return (
    <div className='w-full flex items-center justify-between gap-4'>
      <div className='text-xs text-slate-500 dark:text-slate-400'>
        Total durasi draf:{' '}
        <span className='font-semibold text-slate-text'>{totalDuration} jam</span>
      </div>
      <button
        type='button'
        className='btn btn-primary inline-flex items-center gap-2'
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? (
          <>
            <span className='spinner' />
            <span>Mencatat ke Taiga...</span>
          </>
        ) : (
          <span>Push ke Taiga &amp; Penuhi WAD</span>
        )}
      </button>
    </div>
  );
}
