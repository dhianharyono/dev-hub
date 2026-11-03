'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cleanTaigaErrorMessage } from '@/lib/taiga/types';
import type { PublicSettings, TestResult, TestingState } from '../types';

interface TaigaSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  testResult?: TestResult['taiga'];
  testing?: TestingState['taiga'];
  onTest: () => void;
  sessionInput: string;
  onSessionInputChange: (val: string) => void;
}

export function TaigaSettingsSection({
  form,
  onChange,
  testResult,
  testing,
  onTest,
  sessionInput,
  onSessionInputChange,
}: TaigaSettingsSectionProps) {
  const [showToken, setShowToken] = useState(false);
  const [syncingChrome, setSyncingChrome] = useState(false);
  const [chromeSyncMsg, setChromeSyncMsg] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const handleSyncFromChrome = async () => {
    setSyncingChrome(true);
    setChromeSyncMsg(null);
    try {
      const res = await fetch('/api/settings/taiga-session');
      const data = await res.json();
      if (data.ok) {
        setChromeSyncMsg({ ok: true, msg: data.message });
        if (data.settings?.taigaToken) {
          onChange('taigaToken', data.settings.taigaToken);
          if (data.settings.taigaRefresh)
            onChange('taigaRefresh', data.settings.taigaRefresh);
        }
        if (onTest) setTimeout(onTest, 600);
      } else {
        setChromeSyncMsg({
          ok: false,
          msg: data.error || 'Gagal mengambil sesi dari Chrome',
        });
      }
    } catch (err) {
      setChromeSyncMsg({ ok: false, msg: (err as Error).message });
    } finally {
      setSyncingChrome(false);
    }
  };

  return (
    <section className='card flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div className='flex items-start gap-2.5 flex-1 min-w-0'>
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted shrink-0 mt-0.5'>
            1
          </span>
          <div className='flex-1 min-w-0'>
            <span className='text-[15px] font-bold text-slate-text tracking-tight'>
              Taiga Project Management
            </span>
            <div className='xs dim mt-0.5'>
              Task management, sprint backlog, dan sinkronisasi log waktu WAD
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
            <span>Uji Koneksi Taiga</span>
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
                  {cleanTaigaErrorMessage(testResult.message)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='field'>
        <label>Taiga Base URL</label>
        <input
          className='input'
          value={form.taigaBaseUrl || ''}
          placeholder='https://tree.taiga.io'
          onChange={(e) => onChange('taigaBaseUrl', e.target.value)}
        />
      </div>

      {/* Koneksi Otomatis Sesi Taiga via Chrome */}
      <div className='bg-surface-subtle border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-3.5'>
        <div className='flex items-center justify-between flex-wrap gap-2.5'>
          <div className='flex items-center gap-2 font-bold text-xs sm:text-[13px] text-slate-800'>
            <Sparkles size={16} className='gradient-text' />
            <span>Koneksi Otomatis Sesi Taiga:</span>
          </div>

          <div className='flex items-center flex-wrap gap-2'>
            <button
              type='button'
              className='btn btn-sm btn-primary inline-flex items-center gap-1.5'
              onClick={handleSyncFromChrome}
              disabled={syncingChrome}
              title='Ambil sesi dan token Taiga langsung dari tab Google Chrome yang aktif'
            >
              {syncingChrome ? (
                <span className='spinner' />
              ) : (
                <Sparkles size={13} />
              )}
              <span>
                {syncingChrome ? 'Membaca Chrome...' : 'Tarik Sesi dari Chrome'}
              </span>
            </button>

            <a
              href={form.taigaBaseUrl || 'https://tree.taiga.io'}
              target='_blank'
              rel='noreferrer'
              className='btn btn-sm btn-ghost inline-flex items-center gap-1.5'
            >
              <span>Buka Taiga</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {chromeSyncMsg && (
          <div
            className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs border animate-in fade-in ${
              chromeSyncMsg.ok
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                : 'bg-rose-50/70 border-rose-200/80 text-rose-800'
            }`}
          >
            {chromeSyncMsg.ok ? (
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
            <span className='font-medium leading-relaxed'>
              {chromeSyncMsg.msg}
            </span>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>
              Langkah 1
            </span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Buka tab <strong>Taiga</strong> di Google Chrome dan pastikan Anda sudah login SSO.
            </span>
          </div>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>
              Langkah 2
            </span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Pastikan halaman tidak tertahan verifikasi Cloudflare (<em>&quot;Tunggu sebentar...&quot;</em>).
            </span>
          </div>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>
              Langkah 3
            </span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Klik tombol <strong>Tarik Sesi dari Chrome</strong> di atas untuk sinkronisasi token secara otomatis.
            </span>
          </div>
        </div>

        <div className='text-xs text-slate-500 leading-relaxed'>
          💡{' '}
          <em>
            Fitur <strong>Tarik Sesi dari Chrome</strong> mengambil token langsung dari tab browser yang terbuka di macOS. Anda juga tetap dapat menempelkan JSON session atau token bearer secara manual pada kolom di bawah.
          </em>
        </div>

        <div className='field'>
          <div className='flex items-center justify-between mb-1.5'>
            <label className='text-xs font-bold text-slate-700 m-0'>
              JSON Session / Token
            </label>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                className='btn btn-xs btn-ghost inline-flex items-center gap-1 px-2 py-0.5 text-[11px]'
                onClick={() => setShowToken(!showToken)}
                title={showToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showToken ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              {sessionInput && (
                <button
                  type='button'
                  className='btn btn-xs btn-ghost px-2 py-0.5 text-[11px]'
                  onClick={() => onSessionInputChange('')}
                >
                  Hapus Isian
                </button>
              )}
            </div>
          </div>
          <textarea
            className={`font-mono text-[12px] min-h-[64px] max-h-[140px] leading-relaxed bg-surface border border-border-strong rounded-xl p-3 text-slate-text focus:outline-2 focus:outline-brand focus:border-brand w-full ${!showToken ? '[-webkit-text-security:disc]' : ''}`}
            placeholder='Tempel JSON session atau token bearer di sini (misal: eyJhbGciOi...). Nilai tersimpan dan dapat diedit langsung kapan saja.'
            value={sessionInput}
            onChange={(e) => onSessionInputChange(e.target.value)}
          />
          {form.taigaTokenSet && !sessionInput && (
            <div className='flex items-center gap-1.5 text-xs text-emerald-600 mt-1.5 font-medium'>
              <Check size={14} className='shrink-0' />
              <span className='truncate'>Token SSO aktif tersimpan:</span>
              <span className='font-mono text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 max-w-[200px] truncate inline-block'>
                {form.taigaToken || '••••••••'}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
