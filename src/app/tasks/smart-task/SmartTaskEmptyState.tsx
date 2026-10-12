'use client';

import { Sparkles } from 'lucide-react';

interface SmartTaskEmptyStateProps {
  onUseExample: (text: string) => void;
}

export function SmartTaskEmptyState({}: SmartTaskEmptyStateProps) {
  return (
    <div className='py-11 px-6 text-center bg-surface border border-dashed border-border-strong rounded-[18px] flex flex-col items-center gap-3.5'>
      <div className='w-[58px] h-[58px] rounded-[18px] grid place-items-center bg-brand-light border border-border text-brand shadow-[0_4px_14px_rgba(25,119,243,0.2)]'>
        <Sparkles size={28} />
      </div>
      <div>
        <h3 className='text-base font-bold text-slate-text mb-1'>
          Belum Ada Draft Task
        </h3>
        <p className='text-[13px] text-slate-dim max-w-[460px] leading-relaxed'>
          Tulis catatan pekerjaan harian Anda di formulir sebelah kiri, lalu
          biarkan AI merapikan dan memecah menjadi draft siap kirim.
        </p>
      </div>
    </div>
  );
}
