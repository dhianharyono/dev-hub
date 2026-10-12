'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
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
    <section className='card flex flex-col gap-6'>
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
            {testResult && (
              <div className='mt-2'>
                <span
                  className={`badge ${testResult.ok ? 'badge-green' : 'badge-rose'} whitespace-normal break-words inline-block max-w-full text-left leading-[1.45] px-3 py-1.5`}
                >
                  {testResult.ok
                    ? '✓ ' + testResult.message
                    : testResult.message}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='shrink-0'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={onTest}
            disabled={testing}
          >
            {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
            <span>Uji Koneksi GitLab</span>
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='field'>
          <label>GitLab Base URL</label>
          <input
            className='input'
            value={form.gitlabBaseUrl || ''}
            placeholder='https://gitlab.playcourt.id'
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
          <label>Personal Access Token (PAT)</label>
          <div className='relative flex items-center'>
            <input
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
          <span className='hint'>
            Scope token: <code>api</code> (untuk posting review, komentar,
            membuat MR) dan <code>read_api</code> (untuk membaca commit).
          </span>
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
