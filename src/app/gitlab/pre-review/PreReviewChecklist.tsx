import { CheckSquare } from 'lucide-react';
import type { PreReviewOutput } from './types';

interface PreReviewChecklistProps {
  checklist: PreReviewOutput['checklist'];
}

export function PreReviewChecklist({ checklist }: PreReviewChecklistProps) {
  if (!checklist || checklist.length === 0) return null;

  return (
    <div>
      <div className='row xs dim font-semibold mb-2 gap-1.5'>
        <CheckSquare size={14} className='text-emerald-500' />
        <span>CHECKLIST KELAYAKAN SENIOR REVIEW (SKILL.MD)</span>
      </div>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2'>
        {checklist.map((item, idx) => {
          const itemStyles =
            item.status === 'block'
              ? 'border-rose-300 bg-rose-50'
              : item.status === 'warn'
                ? 'border-amber-300 bg-amber-50'
                : 'border-border bg-surface';

          return (
            <div
              key={idx}
              className={`p-2.5 sm:px-3 rounded-lg border flex flex-col gap-1 ${itemStyles}`}
            >
              <div className='row-between'>
                <strong className='text-[12.5px] text-slate-text'>
                  {item.label}
                </strong>
                <span
                  className={`badge ${
                    item.status === 'block'
                      ? 'badge-red'
                      : item.status === 'warn'
                        ? 'badge-amber'
                        : 'badge-green'
                  } xs`}
                >
                  {item.status === 'block'
                    ? '🔴 BLOCK'
                    : item.status === 'warn'
                      ? '⚠️ WARN'
                      : '✅ PASS'}
                </span>
              </div>
              <span className='text-[11.5px] text-slate-text-3 leading-snug'>
                {item.notes}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
