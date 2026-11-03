'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, Users, ChevronDown, Check } from 'lucide-react';
import type { AppMode } from '@/lib/settings';
import type { PublicSettings } from '../types';
import { useAppMode } from '@/components/AppModeContext';
import { Tooltip } from '@/components/Tooltip';

interface AppSettingsModeDropdownProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

export function AppSettingsModeDropdown({
  form,
  onChange,
}: AppSettingsModeDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setAppMode } = useAppMode();

  const currentMode: AppMode =
    form.appMode === 'monitoring' ? 'monitoring' : 'developer';

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSelectMode = (mode: AppMode) => {
    onChange('appMode', mode);
    setAppMode(mode);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className='relative z-50 flex flex-col items-end gap-1.5'>
      <div className='flex items-center gap-1.5'>
        <span className='text-[11px] font-bold text-slate-muted uppercase tracking-wider'>
          Mode Tampilan Sistem
        </span>
        <Tooltip
          title='Mode Tampilan Sistem'
          content='Pilih mode lingkungan sesuai peran: Mode Developer (fitur penuh GitLab, commit, & review) atau Mode Monitoring (fokus Smart Task & Workload tanpa modul GitLab).'
          position='bottom'
          widthClass='w-76'
          zIndexClass='z-[1001]'
        />
      </div>

      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup='true'
        aria-expanded={open}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border bg-surface text-slate-text cursor-pointer transition-all shadow-2xs hover:shadow-xs hover:border-slate-300 min-w-[270px] sm:min-w-[310px] ${
          open
            ? 'border-brand ring-2 ring-brand/15 shadow-sm'
            : currentMode === 'monitoring'
              ? 'border-purple-200 hover:border-purple-300 bg-purple-500/[0.02]'
              : 'border-border hover:border-border-strong'
        }`}
        id='btn-mode-dropdown-trigger'
      >
        <div className='flex items-center gap-2.5 min-w-0'>
          <div
            className={`w-8 h-8 rounded-xl grid place-items-center text-xs shrink-0 shadow-2xs ${
              currentMode === 'monitoring'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-brand/10 text-brand'
            }`}
          >
            {currentMode === 'monitoring' ? (
              <Users size={16} strokeWidth={2.4} />
            ) : (
              <Terminal size={16} strokeWidth={2.4} />
            )}
          </div>

          <div className='flex flex-col text-left min-w-0'>
            <span className='text-[13px] font-bold leading-tight text-slate-text tracking-tight truncate'>
              {currentMode === 'monitoring'
                ? 'Mode Monitoring'
                : 'Mode Developer'}
            </span>
            <span className='text-[10.5px] text-slate-muted leading-tight font-medium mt-0.5 truncate'>
              {currentMode === 'monitoring'
                ? 'Non-Dev / Pemantauan'
                : 'Pengembang Penuh'}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              currentMode === 'monitoring'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-brand/10 text-brand border-brand/20'
            }`}
          >
            {currentMode === 'monitoring' ? 'Task & Workload' : 'Full Access'}
          </span>

          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-200 ${
              open ? 'rotate-180 text-slate-text' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popup */}
      {open && (
        <div
          role='menu'
          aria-label='Pilihan Mode Tampilan'
          className='absolute top-full right-0 mt-2 w-full min-w-[310px] bg-surface border border-border rounded-2xl shadow-2xl p-2 z-[999] animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1.5'
        >
          <div className='px-2.5 pt-1.5 pb-1 text-[11px] font-bold text-slate-muted uppercase tracking-wider border-b border-border/60'>
            Pilih Peran Tampilan
          </div>

          {/* Option 1: Developer */}
          <button
            type='button'
            role='menuitem'
            onClick={() => handleSelectMode('developer')}
            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
              currentMode === 'developer'
                ? 'bg-brand/10 text-brand'
                : 'hover:bg-surface-hover text-slate-text'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg grid place-items-center text-xs shrink-0 mt-0.5 ${
                currentMode === 'developer'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Terminal size={13} strokeWidth={2.4} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-1'>
                <span className='text-[12px] font-bold text-slate-text leading-tight'>
                  Mode Developer
                </span>
                {currentMode === 'developer' && (
                  <Check size={13} className='text-brand shrink-0' />
                )}
              </div>
              <p className='text-[10px] text-slate-500 font-normal mt-0.5 mb-0 leading-normal'>
                Akses lengkap: Productivity Monitor (GitLab), Smart Task, &amp; Workload.
              </p>
            </div>
          </button>

          {/* Option 2: Monitoring */}
          <button
            type='button'
            role='menuitem'
            onClick={() => handleSelectMode('monitoring')}
            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
              currentMode === 'monitoring'
                ? 'bg-purple-500/10 text-purple-700'
                : 'hover:bg-surface-hover text-slate-text'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg grid place-items-center text-xs shrink-0 mt-0.5 ${
                currentMode === 'monitoring'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Users size={13} strokeWidth={2.4} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-1'>
                <span className='text-[12px] font-bold text-slate-text leading-tight'>
                  Mode Monitoring
                </span>
                {currentMode === 'monitoring' && (
                  <Check size={13} className='text-purple-600 shrink-0' />
                )}
              </div>
              <p className='text-[10px] text-slate-500 font-normal mt-0.5 mb-0 leading-normal'>
                Fokus tim: Memantau Smart Task &amp; Workload tanpa Productivity Monitor.
              </p>
            </div>
          </button>

          <div className='pt-1.5 border-t border-border/60 px-2 pb-0.5 text-[9.5px] text-slate-400 leading-normal'>
            Mode langsung menyesuaikan navigasi sidebar, layanan terhubung, dan dashboard.
          </div>
        </div>
      )}
    </div>
  );
}

