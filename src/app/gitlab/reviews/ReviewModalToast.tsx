'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastData {
  type: 'success' | 'error';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ReviewModalToastProps {
  toast: ToastData;
  onClose: () => void;
}

export function ReviewModalToast({ toast, onClose }: ReviewModalToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100005] ${
        toast.type === 'success' ? 'bg-slate-900' : 'bg-red-950'
      } text-white px-4.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-up max-w-[92vw] border border-white/10`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={18} className='text-emerald-500 shrink-0' />
      ) : (
        <AlertCircle size={18} className='text-rose-500 shrink-0' />
      )}
      <span className='text-[13px] font-medium leading-snug'>
        {toast.message}
      </span>
      {toast.action && (
        <button
          type='button'
          onClick={toast.action.onClick}
          className='bg-white/15 hover:bg-white/20 border border-white/25 rounded-md text-white text-xs font-semibold px-2.5 py-1 cursor-pointer whitespace-nowrap transition-colors'
        >
          {toast.action.label}
        </button>
      )}
      <button
        type='button'
        onClick={onClose}
        className='bg-transparent border-none text-white/70 hover:text-white cursor-pointer px-1 py-0.5 flex items-center transition-colors'
        aria-label='Tutup notifikasi'
      >
        <X size={15} />
      </button>
    </div>
  );
}
