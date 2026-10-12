'use client';

import type { HealerSuggestion } from './types';

interface HealerFooterProps {
  suggestions: HealerSuggestion[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function HealerFooter({
  suggestions,
  submitting,
  onClose,
  onSubmit,
}: HealerFooterProps) {
  const totalDuration = suggestions
    .reduce((acc, s) => acc + s.durationHours, 0)
    .toFixed(1);

  return (
    <div className='px-6 py-3.5 border-t border-border flex items-center justify-between bg-surface-subtle'>
      <div className='xs dim'>
        {suggestions.length > 0
          ? `Total durasi draf: ${totalDuration} jam`
          : 'Waktu kerja resmi: 08:00 - 17:00 (Senin - Jumat)'}
      </div>
      <div className='flex gap-2.5'>
        <button
          type='button'
          className='btn btn-ghost'
          onClick={onClose}
          disabled={submitting}
        >
          Batal
        </button>
        {suggestions.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
