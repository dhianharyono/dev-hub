'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';
import type { PublicSettings, TestResult, TestingState } from '../types';

interface GitlabSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  testResult?: TestResult['gitlab'];
  testing?: TestingState['gitlab'];
  onTest: () => void;
}

export function GitlabSettingsSection({
  form,
  onChange,
  testResult,
  testing,
  onTest,
}: GitlabSettingsSectionProps) {
  const [showToken, setShowToken] = useState(false);
  return (
    <section className='card flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div className='flex items-start gap-2.5 flex-1 min-w-0'>
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted shrink-0 mt-0.5'>
            2
          </span>
          <div className='flex-1 min-w-0'>
            <span className='text-[15px] font-bold text-slate-text tracking-tight'>
              GitLab Playcourt Monitoring
            </span>
            <div className='xs dim mt-0.5'>
              Pelacakan commit, merge request, baris kode, dan kalkulasi
              produktivitas
            </div>
          </div>
        </div>

        <div className='shrink-0 flex flex-col items-start sm:items-end gap-2 max-w-full sm:max-w-md'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={onTest}
            disabled={testing}
          >
            {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
            <span>Uji Koneksi GitLab</span>
          </button>

          {!testing && testResult && (
            <div
              className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs border w-full sm:w-auto animate-in fade-in ${
                testResult.ok
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                  : 'bg-rose-50/70 border-rose-200/80 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2
                  size={14}
                  className='text-emerald-600 shrink-0 mt-0.5'
                />
              ) : (
                <AlertCircle
                  size={14}
                  className='text-rose-600 shrink-0 mt-0.5'
                />
              )}
              <div className='flex flex-col gap-1 min-w-0 text-left'>
                <span className='font-medium leading-relaxed break-words'>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='field'>
          <label>GitLab Base URL</label>
          <input
            className='input'
            value={form.gitlabBaseUrl || ''}
            placeholder='https://gitlab.com/'
            onChange={(e) => onChange('gitlabBaseUrl', e.target.value)}
          />
        </div>
        <div className='field'>
          <label>Username GitLab</label>
          <input
            className='input'
            value={form.gitlabUsername || ''}
            placeholder='username-anda'
            onChange={(e) => onChange('gitlabUsername', e.target.value)}
          />
        </div>
        <div className='field'>
          <div className='flex items-center gap-1.5'>
            <label htmlFor='gitlab-pat' className='cursor-pointer'>
              Personal Access Token (PAT)
            </label>
            <Tooltip
              title='Kebutuhan Scope Token'
              ariaLabel='Informasi Scope Token GitLab'
              content={
                <div className='flex flex-col gap-2'>
                  <div className='flex items-start gap-2'>
                    <code className='bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px] font-mono shrink-0'>
                      api
                    </code>
                    <span>
                      Posting review kode, komentar, dan membuat MR otomatis
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <code className='bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded text-[11px] font-mono shrink-0'>
                      read_api
                    </code>
                    <span>
                      Membaca riwayat commit, metadata proyek, dan kalkulasi
                      produktivitas
                    </span>
                  </div>
                </div>
              }
            />
          </div>

          <div className='relative flex items-center'>
            <input
              id='gitlab-pat'
              type={showToken ? 'text' : 'password'}
              className='input pr-10'
              value={form.gitlabToken || ''}
              placeholder='glpat-xxxxxxxxxxxx'
              onChange={(e) => onChange('gitlabToken', e.target.value)}
            />
            <button
              type='button'
              onClick={() => setShowToken(!showToken)}
              title={showToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
              className='absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center transition-colors'
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='field'>
          <label>Identitas Email Commit (pisahkan dengan koma)</label>
          <input
            className='input'
            value={form.identityEmails || ''}
            placeholder='dev@example.com, work@company.com'
            onChange={(e) => onChange('identityEmails', e.target.value)}
          />
          <span className='hint'>
            Hanya commit dari email ini yang akan dihitung sebagai kontribusi
            Anda.
          </span>
        </div>
        <div className='field'>
          <label>Identitas Nama / Username Commit</label>
          <input
            className='input'
            value={form.identityNames || ''}
            placeholder='username, nama lengkap'
            onChange={(e) => onChange('identityNames', e.target.value)}
          />
          <span className='hint'>
            Nama akun git author yang digunakan pada git config local Anda.
          </span>
        </div>
      </div>

      <div className='field'>
        <label>Pola File yang Diabaikan (Exclude)</label>
        <input
          className='input font-mono text-xs'
          value={form.excludePatterns || ''}
          onChange={(e) => onChange('excludePatterns', e.target.value)}
        />
        <span className='hint'>
          Baris kode file lock, vendor, bundle, minified tidak akan dihitung
          agar angka produktivitas realistis.
        </span>
      </div>
    </section>
  );
}
