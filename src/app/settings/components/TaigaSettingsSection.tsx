'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cleanTaigaErrorMessage } from '@/lib/taiga/types';
import { triggerTelemetryRefresh } from '@/components/SidebarTelemetry';
import type { PublicSettings, TestResult, TestingState } from '../types';

interface TaigaSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  testResult?: TestResult['taiga'];
  testing?: TestingState['taiga'];
  onTest: () => void;
  sessionInput: string;
  onSessionInputChange: (val: string) => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function TaigaSettingsSection({
  form,
  onChange,
  testResult,
  testing,
  onTest,
  sessionInput,
  onSessionInputChange,
  minimized,
  onToggleMinimize,
}: TaigaSettingsSectionProps) {
  const [localMinimized, setLocalMinimized] = useState(true);
  const isMinimized = minimized !== undefined ? minimized : localMinimized;
  const handleToggleMinimize = onToggleMinimize || (() => setLocalMinimized((prev) => !prev));

  const [showToken, setShowToken] = useState(false);
  const [syncingChrome, setSyncingChrome] = useState(false);
  const [copiedConsoleScript, setCopiedConsoleScript] = useState(false);
  const [chromeSyncMsg, setChromeSyncMsg] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:4000';

  // 1-Click Console script that automatically grabs token, POSTs to DevHub, or redirects with query params
  const autoConnectScript = `(function(){try{var docTitle=document.title||'';if(docTitle.indexOf('Just a moment')!==-1||docTitle.indexOf('Tunggu sebentar')!==-1){alert('⚠️ Halaman Taiga sedang dalam verifikasi Cloudflare (\"Tunggu sebentar...\"). Mohon selesaikan verifikasi di layar browser terlebih dahulu.');return;}var t=localStorage.getItem('token')||localStorage.token,r=localStorage.getItem('refresh')||localStorage.refresh;if(!t&&localStorage.userInfo){try{var u=JSON.parse(localStorage.userInfo);t=u.auth_token||u.token;r=r||u.refresh;}catch(e){}}if(!t){alert('❌ Token Taiga tidak ditemukan! Pastikan Anda sudah login di Taiga.');return;}t=String(t).replace(/^["']+|["']+$/g,'').trim();if(r)r=String(r).replace(/^["']+|["']+$/g,'').trim();var originUrl=window.location.origin;fetch('${origin}/api/settings/taiga-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,refresh:r,baseUrl:originUrl})}).then(function(res){return res.json();}).then(function(d){if(d.ok){alert('✅ Taiga Berhasil Terhubung ke DevHub!');window.location.href='${origin}/settings';}else{window.location.href='${origin}/settings?taiga_token='+encodeURIComponent(t)+(r?'&taiga_refresh='+encodeURIComponent(r):'')+'&taiga_url='+encodeURIComponent(originUrl);}}).catch(function(){window.location.href='${origin}/settings?taiga_token='+encodeURIComponent(t)+(r?'&taiga_refresh='+encodeURIComponent(r):'')+'&taiga_url='+encodeURIComponent(originUrl);});}catch(err){alert('Error: '+err.message);}})();`;

  const handleCopyConsoleScript = () => {
    navigator.clipboard.writeText(autoConnectScript);
    setCopiedConsoleScript(true);
    setTimeout(() => setCopiedConsoleScript(false), 3000);
  };

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
        triggerTelemetryRefresh();
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
    <section className={`card flex flex-col ${isMinimized ? 'p-5 sm:p-6' : 'p-6 gap-5'}`}>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div
          className='flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer select-none group'
          onClick={handleToggleMinimize}
          title={isMinimized ? 'Klik untuk memperluas' : 'Klik untuk meminimalkan'}
        >
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted group-hover:border-brand/40 group-hover:text-brand shrink-0 mt-0.5 transition-colors'>
            1
          </span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[15px] font-bold text-slate-text tracking-tight group-hover:text-brand transition-colors'>
                Taiga Project Management
              </span>
              {isMinimized && (
                <span className='inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200'>
                  Diminimalkan
                </span>
              )}
            </div>
            <div className='xs dim mt-0.5'>
              Task management, sprint backlog, dan sinkronisasi log waktu WAD
            </div>
          </div>
        </div>

        <div className='shrink-0 flex flex-col items-start sm:items-end gap-2 max-w-full sm:max-w-md'>
          <div className='flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end'>
            <button
              type='button'
              className='btn btn-sm'
              onClick={onTest}
              disabled={testing}
            >
              {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
              <span>Uji Koneksi Taiga</span>
            </button>

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

          {!testing && testResult && (
            <div
              className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs border w-full sm:w-auto animate-in fade-in ${testResult.ok
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

      <div className={isMinimized ? 'hidden' : 'flex flex-col gap-6 pt-5 border-t border-border'}>

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
                className={`btn btn-sm ${copiedConsoleScript ? 'btn-primary' : 'btn-secondary'} inline-flex items-center gap-1.5`}
                onClick={handleCopyConsoleScript}
                title='Salin script otomatis yang langsung menghubungkan Taiga ke DevHub via Console browser (Windows & Semua OS)'
              >
                {copiedConsoleScript ? <Check size={13} /> : <Copy size={13} />}
                <span>
                  {copiedConsoleScript ? 'Script Berhasil Disalin!' : 'Script Auto Connect (Windows)'}
                </span>
              </button>

              <button
                type='button'
                className='btn btn-sm inline-flex items-center gap-1.5'
                onClick={handleSyncFromChrome}
                disabled={syncingChrome}
                title='Ambil sesi langsung dari tab Google Chrome yang aktif (khusus macOS)'
              >
                {syncingChrome ? (
                  <span className='spinner' />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>
                  {syncingChrome ? 'Membaca Chrome...' : 'Tarik Sesi (macOS)'}
                </span>
              </button>

              <a
                href={form.taigaBaseUrl || 'https://projects.digitaltelkom.id'}
                target='_blank'
                rel='noreferrer'
                className='btn btn-sm inline-flex items-center gap-1.5'
              >
                <span>Buka Taiga</span>
              </a>
            </div>
          </div>

          {chromeSyncMsg && (
            <div
              className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs border animate-in fade-in ${chromeSyncMsg.ok
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
                Klik tombol <strong>&quot;Salin Script DevTools&quot;</strong> di atas, buka tab Taiga, tekan <strong>F12</strong> (Console), paste (Ctrl+V) dan tekan <strong>Enter</strong>.
              </span>
            </div>
            <div className='bg-surface border border-border rounded-xl p-3.5 flex flex-col gap-1.5 shadow-xs'>
              <span className='text-[11px] font-extrabold tracking-wider uppercase text-brand flex items-center gap-1.5'>
                Langkah 3
              </span>
              <span className='text-xs text-slate-muted leading-relaxed'>
                Selesai! Script otomatis mengirim token ke DevHub dan halaman Pengaturan langsung terhubung.
              </span>
            </div>
          </div>

          <div className='text-xs text-slate-500 leading-relaxed bg-surface/80 border border-border/80 rounded-xl p-3 flex flex-col gap-1.5'>
            <div>
              <strong>Panduan Cepat Windows:</strong> Klik <strong>&quot;Script Auto Connect (Windows)&quot;</strong> di atas, lalu di tab Taiga tekan <strong>F12</strong> &gt; tab <strong>Console</strong>, lalu paste (Ctrl+V) dan Enter. <br /><em>(Jika console memunculkan peringatan keamanan, ketik <code>allow pasting</code> lalu tekan Enter terlebih dahulu).</em>
            </div>
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
      </div>
    </section>
  );
}
