'use client';

import { useState } from 'react';
import {
  Server,
  Play,
  RotateCw,
  Square,
  RefreshCw,
  Info,
  AlertCircle,
  ExternalLink,
  Terminal,
  Activity,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Pm2Status } from './usePm2';

interface Pm2SettingsSectionProps {
  status: Pm2Status | null;
  loading: boolean;
  actionLoading: string | null;
  lastOutput: string | null;
  onRefresh: () => void;
  onAction: (action: 'start' | 'restart' | 'stop') => void;
}

export function Pm2SettingsSection({
  status,
  loading,
  actionLoading,
  lastOutput,
  onRefresh,
  onAction,
}: Pm2SettingsSectionProps) {
  const [showLogs, setShowLogs] = useState(false);

  const isOnline = Boolean(status?.running && status?.status === 'online');
  const isStopped = Boolean(status?.exists && status?.status === 'stopped');
  const isErrored = Boolean(
    status?.exists &&
    (status?.status === 'errored' || status?.status === 'error'),
  );
  const notInstalled = status?.status === 'not_installed';

  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let badgeText = 'Belum Diaktifkan';

  if (isOnline) {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    badgeText = 'Berjalan di Layar Belakang';
  } else if (isErrored) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeText = 'Error / Port Konflik';
  } else if (isStopped) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeText = 'Layanan Berhenti';
  } else if (notInstalled) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeText = 'PM2 Belum Terpasang';
  }

  const formatMemory = (bytes?: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <section className='card flex flex-col gap-6 p-6'>
      {/* Header Section */}
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div className='flex items-start gap-2.5 flex-1 min-w-0'>
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted shrink-0 mt-0.5'>
            4
          </span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[15px] font-bold text-slate-text tracking-tight'>
                Background Process Service (PM2)
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-current'
                  }`}
                />
                {badgeText}
              </span>
            </div>
            <div className='xs dim mt-0.5'>
              Kontrol proses server DEV HUB di layar belakang agar tetap aktif
              tanpa perlu membuka jendela terminal.
            </div>
          </div>
        </div>

        <div className='shrink-0 flex items-center gap-2'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={onRefresh}
            disabled={loading || actionLoading !== null}
            title='Periksa status PM2 terkini'
          >
            {loading ? (
              <span className='spinner' />
            ) : (
              <RefreshCw
                size={13}
                className={actionLoading ? 'animate-spin' : ''}
              />
            )}
            <span>Segarkan Status</span>
          </button>
        </div>
      </div>

      {/* Kotak Informasi Utama (Penjelasan Fitur - Warna Netral) */}
      <div className='rounded-xl border border-border bg-surface-subtle/70 p-4.5 text-slate-text flex flex-col sm:flex-row gap-3.5 items-start'>
        <div className='w-9 h-9 rounded-lg bg-surface border border-border text-slate-700 flex items-center justify-center shrink-0 shadow-2xs'>
          <Layers size={18} />
        </div>
        <div className='flex-1 text-[13px] leading-relaxed'>
          <h4 className='font-bold text-[14px] text-slate-text mb-1 flex items-center gap-2'>
            <span>Tentang Menjalankan Aplikasi di Layar Belakang</span>
          </h4>
          <p className='text-slate-text-2'>
            Tombol di bawah ini digunakan untuk{' '}
            <strong className='text-slate-text font-semibold'>
              mengaktifkan PM2
            </strong>{' '}
            agar aplikasi DEV HUB berjalan secara otomatis di{' '}
            <strong className='text-slate-text font-semibold'>
              layar belakang (background process)
            </strong>
            .
          </p>
          <ul className='mt-2.5 space-y-1 text-[12px] text-slate-text-2 list-disc list-inside'>
            <li>
              <strong className='text-slate-text font-semibold'>
                Bebas Terminal:
              </strong>{' '}
              Anda tidak perlu membiarkan jendela terminal aktif; server terus
              bekerja melayani permintaan di background.
            </li>
            <li>
              <strong className='text-slate-text font-semibold'>
                Pemulihan Otomatis:
              </strong>{' '}
              PM2 akan secara mandiri me-restart server jika terjadi kegagalan
              atau crash.
            </li>
            <li>
              <strong className='text-slate-text font-semibold'>
                Port Independen (4001):
              </strong>{' '}
              PM2 dijalankan di port{' '}
              <code className='px-1.5 py-0.5 rounded bg-surface border border-border text-slate-800 font-mono text-[11px]'>
                4001
              </code>{' '}
              sehingga Anda bisa langsung mengaktifkannya dengan tombol di bawah
              tanpa bentrok dengan terminal development (port{' '}
              <code className='px-1.5 py-0.5 rounded bg-surface border border-border text-slate-800 font-mono text-[11px]'>
                4000
              </code>
              ).
            </li>
          </ul>
        </div>
      </div>

      {/* Metric Cards jika PM2 Sedang Aktif */}
      {isOnline && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-subtle p-3.5 rounded-xl border border-border'>
          <div className='flex items-center gap-2.5 p-2'>
            <Activity size={18} className='text-emerald-500 shrink-0' />
            <div className='min-w-0'>
              <div className='text-[11px] text-slate-muted'>PID Proses</div>
              <div className='text-xs font-bold text-slate-text'>
                {status?.pid || '-'}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2.5 p-2'>
            <Cpu size={18} className='text-indigo-500 shrink-0' />
            <div className='min-w-0'>
              <div className='text-[11px] text-slate-muted'>Penggunaan CPU</div>
              <div className='text-xs font-bold text-slate-text'>
                {status?.cpu !== undefined ? `${status.cpu.toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2.5 p-2'>
            <Server size={18} className='text-blue-500 shrink-0' />
            <div className='min-w-0'>
              <div className='text-[11px] text-slate-muted'>Pemakaian RAM</div>
              <div className='text-xs font-bold text-slate-text'>
                {formatMemory(status?.memory)}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2.5 p-2'>
            <RotateCw size={18} className='text-amber-500 shrink-0' />
            <div className='min-w-0'>
              <div className='text-[11px] text-slate-muted'>Jumlah Restart</div>
              <div className='text-xs font-bold text-slate-text'>
                {status?.restarts ?? 0} kali
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peringatan jika PM2 mengalami crash / errored (biasanya konflik port EADDRINUSE) */}
      {isErrored && (
        <div className='rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-950 text-xs flex items-start gap-3 shadow-2xs'>
          <AlertCircle size={18} className='text-rose-600 shrink-0 mt-0.5' />
          <div className='flex-1 leading-relaxed'>
            <span className='font-bold text-[13px] text-rose-900 block mb-1'>
              Layanan PM2 Mengalami Masalah (Errored / Konflik Port):
            </span>
            <p className='text-rose-800 mb-2'>
              Server PM2 gagal berjalan karena{' '}
              <strong>
                Port 4000 masih digunakan oleh terminal development
              </strong>{' '}
              (<code>npm run dev</code>).
            </p>
            <div className='bg-rose-100/70 p-2.5 rounded-lg border border-rose-200 text-rose-900'>
              <strong>Cara Mengatasinya:</strong>
              <ol className='list-decimal list-inside mt-1 space-y-0.5'>
                <li>
                  Buka terminal tempat <code>npm run dev</code> berjalan, lalu
                  tekan <strong>Ctrl + C</strong> (perintah <code>clear</code>{' '}
                  tidak mematikan server).
                </li>
                <li>
                  Setelah terminal mati, klik tombol{' '}
                  <strong>&quot;Restart Layanan PM2&quot;</strong> di bawah ini
                  agar PM2 mengambil alih server di background.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Peringatan jika PM2 belum terpasang */}
      {notInstalled && (
        <div className='rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 text-xs flex items-start gap-3'>
          <Info size={16} className='text-rose-600 shrink-0 mt-0.5' />
          <div>
            <span className='font-bold block'>
              PM2 CLI belum terpasang di sistem:
            </span>
            Jalankan perintah <code>npm install -g pm2</code> di terminal Anda,
            lalu segarkan kembali halaman ini.
          </div>
        </div>
      )}

      {/* Kontrol Tombol Aksi */}
      <div className='pt-2 border-t border-border place-items-end'>
        <div className='flex gap-2.5 flex-wrap'>
          {/* Tombol Stop jika sedang online */}
          {isOnline && (
            <button
              type='button'
              className='btn btn-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              onClick={() => onAction('stop')}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'stop' ? (
                <span className='spinner' />
              ) : (
                <Square size={14} />
              )}
              <span>Hentikan Layanan</span>
            </button>
          )}

          {/* Tombol Buka Web jika online di port 4001 */}
          {isOnline && (
            <a
              href={`http://localhost:${status?.port || 4001}`}
              target='_blank'
              rel='noreferrer'
              className='btn btn-sm bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 font-semibold'
            >
              <ExternalLink size={13} />
              <span>Buka http://localhost:{status?.port || 4001}</span>
            </a>
          )}

          {/* Tombol Utama: Aktifkan PM2 / Restart */}
          <button
            type='button'
            className='btn btn-primary flex items-center gap-2 px-4 py-2 font-semibold shadow-sm'
            onClick={() => onAction(isOnline ? 'restart' : 'start')}
            disabled={actionLoading !== null || notInstalled}
          >
            {actionLoading === 'start' || actionLoading === 'restart' ? (
              <>
                <span className='spinner' />
                <span>Memproses PM2...</span>
              </>
            ) : isOnline ? (
              <>
                <RotateCw size={15} />
                <span>Restart Layanan PM2</span>
              </>
            ) : (
              <>
                <Play size={15} className='fill-current' />
                <span>Aktifkan PM2 di Layar Belakang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drawer Log Output Terminal (Jika Ada Output) */}
      {lastOutput && (
        <div className='rounded-xl border border-border bg-slate-950 text-slate-100 overflow-hidden shadow-xs'>
          <button
            type='button'
            onClick={() => setShowLogs(!showLogs)}
            className='w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors'
          >
            <div className='flex items-center gap-2'>
              <Terminal size={13} className='text-emerald-400' />
              <span>Log Terminal PM2 Terakhir</span>
            </div>
            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showLogs && (
            <pre className='p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-300 border-t border-slate-800 max-h-48 whitespace-pre-wrap'>
              {lastOutput}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
