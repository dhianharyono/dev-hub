'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, title: 'Input Taiga', hint: 'User story & task' },
  { number: 2, title: 'Upload ke Taiga', hint: 'Ringkasan & buat' },
  { number: 3, title: 'Form Deployment', hint: 'Autofill browser' },
];

interface ReleaseStepperProps {
  step: number;
  onSelect: (step: number) => void;
}

export function ReleaseStepper({ step, onSelect }: ReleaseStepperProps) {
  return (
    <ol className='grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5'>
      {STEPS.map((item) => {
        const active = item.number === step;
        const done = item.number < step;
        return (
          <li key={item.number}>
            <button
              type='button'
              onClick={() => done && onSelect(item.number)}
              aria-current={active ? 'step' : undefined}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
                active
                  ? 'border-brand bg-white'
                  : done
                    ? 'border-emerald-200 bg-emerald-50/60 cursor-pointer'
                    : 'border-border bg-white/70'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                  active
                    ? 'bg-brand text-white'
                    : done
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-border-strong text-slate-400'
                }`}
              >
                {done ? <Check size={14} /> : item.number}
              </span>
              <span className='min-w-0'>
                <span
                  className={`block text-[13px] font-semibold ${
                    active
                      ? 'text-brand'
                      : done
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                  }`}
                >
                  {item.title}
                </span>
                <span className='block text-[11px] text-slate-400'>
                  {item.hint}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
