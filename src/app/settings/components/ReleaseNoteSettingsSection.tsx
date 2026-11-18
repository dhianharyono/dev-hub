'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PublicSettings } from '../types';

interface ReleaseNoteSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function ReleaseNoteSettingsSection({
  form,
  onChange,
  minimized,
  onToggleMinimize,
}: ReleaseNoteSettingsSectionProps) {
  const [localMinimized, setLocalMinimized] = useState(true);
  const isMinimized = minimized !== undefined ? minimized : localMinimized;
  const handleToggleMinimize =
    onToggleMinimize || (() => setLocalMinimized((prev) => !prev));

  return (
    <section className={`card flex flex-col ${isMinimized ? 'p-5 sm:p-6' : 'p-6 gap-5'}`}>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div
          className='flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer select-none group'
          onClick={handleToggleMinimize}
          title={isMinimized ? 'Klik untuk memperluas' : 'Klik untuk meminimalkan'}
        >
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted group-hover:border-brand/40 group-hover:text-brand shrink-0 mt-0.5 transition-colors'>
            4
          </span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[15px] font-bold text-slate-text tracking-tight group-hover:text-brand transition-colors'>
                Release Note Automation
              </span>
              {isMinimized && (
                <span className='inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200'>
                  Diminimalkan
                </span>
              )}
            </div>
            <div className='xs dim mt-0.5'>
              Link form MS Forms yang dipakai autofill halaman Deployment
            </div>
          </div>
        </div>

        <button
          type='button'
          className='btn btn-sm btn-ghost p-1.5 text-slate-500 hover:text-slate-800 hover:bg-surface-subtle border border-transparent hover:border-border rounded-lg transition-all'
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMinimize();
          }}
          title={isMinimized ? 'Perluas kartu' : 'Minimalkan kartu'}
          aria-label={isMinimized ? 'Perluas kartu' : 'Minimalkan kartu'}
        >
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${isMinimized ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      <div
        className={
          isMinimized ? 'hidden' : 'flex flex-col gap-4 pt-5 border-t border-border'
        }
      >
        <div className='field'>
          <label>Link Form Deployment (MS Forms)*</label>
          <input
            className='input font-mono text-xs'
            value={form.deploymentFormUrl || ''}
            placeholder='https://forms.cloud.microsoft/pages/responsepage.aspx?id=...'
            onChange={(e) => onChange('deploymentFormUrl', e.target.value)}
          />
          <span className='hint'>
            Wajib diisi. Autofill dan tombol Buka form memakai link ini; tanpa
            link, fitur nonaktif. Harus URL http(s) dari forms.office.com atau
            forms.cloud.microsoft.
          </span>
        </div>
      </div>
    </section>
  );
}
