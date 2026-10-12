'use client';

import { useState } from 'react';
import {
  Check,
  CopyIcon,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
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
  const [copiedConsoleScript, setCopiedConsoleScript] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:4000';

  // 1-Click Console script that automatically grabs token, POSTs to DevHub, or redirects with query params
  const autoConnectScript = `(function(){try{var t=localStorage.getItem('token')||localStorage.token,r=localStorage.getItem('refresh')||localStorage.refresh;if(!t&&localStorage.userInfo){try{var u=JSON.parse(localStorage.userInfo);t=u.auth_token||u.token;r=r||u.refresh;}catch(e){}}if(!t){alert('❌ Token Taiga tidak ditemukan! Pastikan Anda sudah login di Taiga.');return;}t=String(t).replace(/^["']+|["']+$/g,'').trim();if(r)r=String(r).replace(/^["']+|["']+$/g,'').trim();fetch('${origin}/api/settings/taiga-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,refresh:r})}).then(function(res){return res.json();}).then(function(d){if(d.ok){alert('✅ Taiga Berhasil Terhubung ke DevHub!');window.location.href='${origin}/settings';}else{window.location.href='${origin}/settings?taiga_token='+encodeURIComponent(t)+(r?'&taiga_refresh='+encodeURIComponent(r):'');}}).catch(function(){window.location.href='${origin}/settings?taiga_token='+encodeURIComponent(t)+(r?'&taiga_refresh='+encodeURIComponent(r):'');});}catch(err){alert('Error: '+err.message);}})();`;

  const handleCopyConsoleScript = () => {
    navigator.clipboard.writeText(autoConnectScript);
    setCopiedConsoleScript(true);
    setTimeout(() => setCopiedConsoleScript(false), 3000);
  };

  return (
    <section className='card flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div
          className='flex items-start gap-2.5 flex-1 min-w-0'
        >
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
            <span>Uji Koneksi Taiga</span>
          </button>
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

      {/* Script Auto-Connect (1-Langkah Otomatis) */}
      <div className='bg-surface-subtle border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-3.5'>
        <div className='flex items-center justify-between flex-wrap gap-2.5'>
          <div className='flex items-center gap-2 font-bold text-xs sm:text-[13px] text-slate-800'>
            <Sparkles size={16} className='gradient-text' />
            <span>Koneksi Otomatis Token Taiga:</span>
          </div>

          <div className='flex items-center flex-wrap gap-2'>
            <button
              type='button'
              className={`btn btn-sm ${copiedConsoleScript ? 'btn-primary' : ''}`}
              onClick={handleCopyConsoleScript}
              title='Salin script otomatis yang langsung menghubungkan Taiga ke DevHub'
            >
              {copiedConsoleScript ? (
                <Check size={13} />
              ) : (
                <CopyIcon size={13} />
              )}
              <span>
                {copiedConsoleScript
                  ? 'Script Berhasil Disalin!'
                  : 'Script Auto-Connect'}
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

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>Langkah 1</span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Klik tombol <strong>Script Auto-Connect</strong> di atas.
            </span>
          </div>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>Langkah 2</span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Buka tab <strong>Taiga</strong> yang sudah login SSO, tekan{' '}
              <strong>F12</strong> (Console), paste (Cmd+V) dan tekan{' '}
              <strong>Enter</strong>.
            </span>
          </div>
          <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
            <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>Langkah 3</span>
            <span className='text-xs text-slate-muted leading-relaxed'>
              Selesai! Script otomatis membaca token, mengirim ke DevHub,
              dan mengalihkan Anda kembali dengan status langsung terhubung.
            </span>
          </div>
        </div>

        <div className='text-xs text-slate-500 leading-relaxed bg-slate-100/60 border border-slate-200/50 p-2.5 px-3 rounded-lg mt-1'>
          💡{' '}
          <em>
            Jika console browser memunculkan peringatan keamanan saat paste,
            ketik <code>allow pasting</code> lalu tekan Enter, kemudian paste
            script kembali.
          </em>
        </div>

        <div className='field mt-2'>
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
