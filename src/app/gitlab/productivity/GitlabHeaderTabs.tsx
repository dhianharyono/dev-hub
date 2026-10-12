import Link from 'next/link';
import {
  Activity,
  GitPullRequest,
  ShieldCheck,
  MessageSquareCode,
} from 'lucide-react';
import type { MetricsData } from '@/components/hooks';

export type GitlabActiveView =
  | 'productivity'
  | 'mr_assistant'
  | 'pre_review'
  | 'incoming_reviews';

interface GitlabHeaderTabsProps {
  activeView: GitlabActiveView;
  onViewChange: (view: GitlabActiveView) => void;
  days: number;
  onDaysChange: (days: number) => void;
  data: MetricsData | null;
  isSyncing?: boolean;
  onSync: () => void;
  connected?: boolean;
}

const RANGES = [
  [30, '30 hari'],
  [90, '90 hari'],
  [180, '6 bulan'],
] as const;

export function GitlabHeaderTabs({
  activeView,
  onViewChange,
  days,
  onDaysChange,
  data,
  isSyncing,
  onSync,
  connected = true,
}: GitlabHeaderTabsProps) {
  return (
    <>
      <header className='page-header items-start'>
        <div className='flex-[1_1_auto] max-w-[1000px]'>
          <div className='eyebrow flex items-center gap-2'>
            <span>
              GitLab ·{' '}
              {activeView === 'productivity'
                ? 'playcourt'
                : activeView === 'incoming_reviews'
                  ? 'Reviewer Hub'
                  : 'AI Developer Assistant'}
            </span>
          </div>
          <h1>
            {activeView === 'productivity' ? (
              <>
                Productivity <span className='gradient-text'>Monitor</span>
              </>
            ) : activeView === 'incoming_reviews' ? (
              <>
                AI Review <span className='gradient-text'>Merge Request</span>
              </>
            ) : activeView === 'mr_assistant' ? (
              <>
                Merge Request <span className='gradient-text'>Generator</span>
              </>
            ) : (
              <>
                AI Review
                <span className='gradient-text'> Code</span>
              </>
            )}
          </h1>
          <p>
            {activeView === 'productivity' ? (
              !connected ? (
                'Koneksi GitLab tidak aktif. Konfigurasikan di Pengaturan.'
              ) : (
                <>
                  {data?.user ? `@${data.user.username} · ` : ''}
                  {data?.lastSync
                    ? `Sinkron terakhir ${new Date(data.lastSync).toLocaleString('id-ID')}`
                    : 'Belum pernah sinkron'}
                </>
              )
            ) : activeView === 'incoming_reviews' ? (
              'Pantau daftar MR tim, telusuri komentar hasil review, dan posting komentar AI otomatis untuk meningkatkan skor kolaborasi.'
            ) : activeView === 'mr_assistant' ? (
              'Generate judul Conventional Commits, deskripsi MR lengkap, dan catatan rilis otomatis berbasis AI.'
            ) : (
              'Audit dini keamanan, deteksi kebocoran kredensial, dan evaluasi higienitas kode sebelum pengajuan MR.'
            )}
          </p>
        </div>
        {activeView === 'productivity' && (
          <div className='row wrap no-print shrink-0 ml-auto items-center'>
            <div className='segmented' role='group' aria-label='Rentang waktu'>
              {RANGES.map(([v, l]) => (
                <button
                  key={v}
                  type='button'
                  id={`range-${v}`}
                  aria-pressed={days === v}
                  onClick={() => onDaysChange(v)}
                  disabled={!connected}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              type='button'
              id='btn-sync'
              className='btn btn-primary'
              onClick={onSync}
              disabled={!connected || isSyncing}
              title={
                !connected
                  ? 'GitLab belum terhubung. Konfigurasikan token di Pengaturan.'
                  : undefined
              }
              style={
                !connected ? { opacity: 0.6, cursor: 'not-allowed' } : undefined
              }
            >
              {isSyncing ? <span className='spinner' /> : ''}{' '}
              {isSyncing ? 'Sinkron…' : 'Sinkron GitLab'}
            </button>
            <Link
              href={connected ? `/report?days=${days}` : '#'}
              className={`btn ${!connected ? 'disabled' : ''}`}
              id='btn-report'
              aria-disabled={!connected}
              style={
                !connected ? { opacity: 0.6, pointerEvents: 'none' } : undefined
              }
            >
              Laporan PDF
            </Link>
          </div>
        )}
      </header>

      {/* View Switcher Tabs */}
      <div
        className='print:hidden flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-border w-fit max-w-full overflow-x-auto mb-8 shadow-xs'
        role='tablist'
        aria-label='Pilihan Modul GitLab'
      >
        <button
          type='button'
          role='tab'
          aria-selected={activeView === 'productivity'}
          onClick={() => onViewChange('productivity')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'productivity'
              ? 'bg-brand text-white shadow-sm border border-brand font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
          }`}
          id='tab-productivity-monitor'
        >
          <Activity size={15} />
          <span>Monitor Produktivitas</span>
        </button>

        <button
          type='button'
          role='tab'
          aria-selected={activeView === 'mr_assistant'}
          onClick={() => onViewChange('mr_assistant')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'mr_assistant'
              ? 'bg-brand text-white shadow-sm border border-brand font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
          }`}
          id='tab-mr-assistant'
        >
          <GitPullRequest size={15} />
          <span>MR Generator</span>
        </button>

        <button
          type='button'
          role='tab'
          aria-selected={activeView === 'pre_review'}
          onClick={() => onViewChange('pre_review')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'pre_review'
              ? 'bg-brand text-white shadow-sm border border-brand font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
          }`}
          id='tab-pre-review'
        >
          <ShieldCheck size={15} />
          <span>AI Review Code</span>
        </button>

        <button
          type='button'
          role='tab'
          aria-selected={activeView === 'incoming_reviews'}
          onClick={() => onViewChange('incoming_reviews')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'incoming_reviews'
              ? 'bg-brand text-white shadow-sm border border-brand font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
          }`}
          id='tab-incoming-reviews'
        >
          <MessageSquareCode size={15} />
          <span>AI Review MR</span>
        </button>
      </div>
    </>
  );
}
