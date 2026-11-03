'use client';

import { Terminal, Users, Check } from 'lucide-react';
import type { AppMode } from '@/lib/settings';
import type { PublicSettings } from '../types';
import { useAppMode } from '@/components/AppModeContext';
import { useNotification } from '@/components/Notification';

interface AppSettingsModeSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

export function AppSettingsModeSection({
  form,
  onChange,
}: AppSettingsModeSectionProps) {
  const { setAppMode } = useAppMode();
  const { notify } = useNotification();

  const currentMode: AppMode =
    form.appMode === 'monitoring' ? 'monitoring' : 'developer';

  const handleSelectMode = async (mode: AppMode) => {
    if (mode === currentMode) return;
    onChange('appMode', mode);
    setAppMode(mode);

    // Auto-save langsung ke server database tanpa perlu klik tombol Simpan Pengaturan
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appMode: mode }),
      });
      notify.success(
        mode === 'monitoring'
          ? 'Beralih ke Mode Monitoring (fokus task backlog Taiga & workload).'
          : 'Beralih ke Mode Developer (akses penuh GitLab, commit tracker, & MR Assistant).',
        'Mode Sistem Tersimpan Otomatis',
      );
    } catch {
      // Local context & localStorage are already updated
    }
  };

  return (
    <section className='card p-5 sm:p-6 mb-5 flex flex-col gap-4 border border-border bg-surface shadow-xs rounded-2xl animate-fade-up'>
      <div className='flex items-start justify-between flex-wrap gap-3 pb-3.5 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center text-sm shrink-0 shadow-2xs ${
              currentMode === 'monitoring'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-brand/10 text-brand'
            }`}
          >
            {currentMode === 'monitoring' ? (
              <Users size={18} strokeWidth={2.4} />
            ) : (
              <Terminal size={18} strokeWidth={2.4} />
            )}
          </div>
          <div>
            <span className='text-[15px] font-bold text-slate-text tracking-tight'>
              Mode Tampilan Sistem
            </span>
            <div className='xs dim mt-0.5'>
              Pilih mode lingkungan sistem sesuai peran kerja Anda untuk
              menyesuaikan modul, menu navigasi, dan dependensi integrasi.
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5'>
        {/* Mode Developer Option Card */}
        <div
          onClick={() => handleSelectMode('developer')}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectMode('developer');
            }
          }}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer relative ${
            currentMode === 'developer'
              ? 'border-brand bg-brand/[0.04] ring-2 ring-brand/20 shadow-xs'
              : 'border-border bg-surface hover:border-slate-300 hover:bg-surface-subtle'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-0.5 ${
              currentMode === 'developer'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface-subtle text-slate-500 border border-border'
            }`}
          >
            <Terminal size={18} strokeWidth={2.4} />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-[13px] font-bold text-slate-text'>
                Mode Developer
              </span>
              {currentMode === 'developer' ? (
                <span className='inline-flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full'>
                  <Check size={12} strokeWidth={2.5} /> Terpilih
                </span>
              ) : (
                <span className='text-[11px] font-medium text-slate-400'>
                  Klik untuk aktifkan
                </span>
              )}
            </div>
            <div className='text-xs text-slate-muted mt-1 leading-relaxed'>
              Fitur lengkap untuk Software Engineer: Pelacakan commit GitLab, MR
              Assistant, AI Code Review, Timesheet Gap Healer, dan metrik
              produktivitas kode.
            </div>
          </div>
        </div>

        {/* Mode Monitoring Option Card */}
        <div
          onClick={() => handleSelectMode('monitoring')}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectMode('monitoring');
            }
          }}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer relative ${
            currentMode === 'monitoring'
              ? 'border-purple-500 bg-purple-500/[0.04] ring-2 ring-purple-500/20 shadow-xs'
              : 'border-border bg-surface hover:border-slate-300 hover:bg-surface-subtle'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-0.5 ${
              currentMode === 'monitoring'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-surface-subtle text-slate-500 border border-border'
            }`}
          >
            <Users size={18} strokeWidth={2.4} />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-[13px] font-bold text-slate-text'>
                Mode Monitoring
              </span>
              {currentMode === 'monitoring' ? (
                <span className='inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full'>
                  <Check size={12} strokeWidth={2.5} /> Terpilih
                </span>
              ) : (
                <span className='text-[11px] font-medium text-slate-400'>
                  Klik untuk aktifkan
                </span>
              )}
            </div>
            <div className='text-xs text-slate-muted mt-1 leading-relaxed'>
              Fokus sprint &amp; backlog untuk Manajerial, QA, Scrum Master,
              &amp; PM: Task backlog Taiga, Smart Task AI, dan beban kerja tanpa
              modul GitLab &amp; Timesheet Gap Healer.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
