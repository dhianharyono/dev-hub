'use client';

import Link from 'next/link';
import { Settings, ZapOff } from 'lucide-react';
import type { WorkloadData } from '@/lib/workload';
import { DAILY_TARGET_HOURS } from '@/lib/workload/daily-target';
import { EmptyState } from '@/components/EmptyState';
import { WadSkeletonCard } from './DashboardSkeleton';

interface WadAnalyticsCardProps {
  workload: WorkloadData | null;
  connected?: boolean;
  loading?: boolean;
}

type WadStatus = 'Fit' | 'Underload' | 'Overload' | 'Empty';

const STATUS_PALETTE: Record<
  WadStatus,
  { box: string; badge: string; text: string; pill: string }
> = {
  Fit: {
    box: 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    text: 'text-emerald-600',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Underload: {
    box: 'bg-amber-50/60 border-amber-200 text-amber-950',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    text: 'text-amber-600',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Overload: {
    box: 'bg-purple-50/60 border-purple-200 text-purple-950',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    text: 'text-purple-600',
    pill: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Empty: {
    box: 'bg-rose-50/60 border-rose-200 text-rose-950',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    text: 'text-rose-600',
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

const PORTAL_LABEL: Record<WadStatus, string> = {
  Fit: 'Fit',
  Underload: 'Perlu Pengisian',
  Overload: 'Lembur',
  Empty: 'Perlu Pengisian',
};

export function WadAnalyticsCard({
  workload,
  connected = true,
  loading = false,
}: WadAnalyticsCardProps) {
  if (loading && !workload) {
    return <WadSkeletonCard />;
  }

  const isDisconnected = !connected || !workload;

  const kpis = workload?.kpis;
  const rawStatus = (kpis?.status || '').toLowerCase();
  const percentage = kpis?.percentage ?? 0;

  let statusType: WadStatus = 'Empty';

  if (!workload || percentage === 0) {
    statusType = 'Empty';
  } else if (
    rawStatus.includes('fit') ||
    (percentage >= 95 && percentage <= 115)
  ) {
    statusType = 'Fit';
  } else if (rawStatus.includes('over') || percentage > 115) {
    statusType = 'Overload';
  } else {
    statusType = 'Underload';
  }

  const palette = STATUS_PALETTE[statusType];
  const statusLabel =
    statusType === 'Empty' ? 'BELUM LOG' : statusType.toUpperCase();

  const stats = [
    {
      label: 'Jam Kerja Aktif',
      value: `${kpis?.timeSpent || 0}h`,
      hint: `dari ${kpis?.expectedHours || 0}h`,
      tone: 'text-slate-text',
    },
    {
      label: 'Tugas Selesai',
      value: `${workload?.statusBreakdown?.done || 0}`,
      hint: `dari ${kpis?.activitiesCount || 0}`,
      tone: 'text-slate-text',
    },
    {
      label: 'Hari Kerja',
      value: `${kpis?.workdaysPassed || 0}`,
      hint: `dari ${kpis?.totalMonthWorkdays || 0}`,
      tone: 'text-slate-text',
    },
    {
      label: 'Status Portal',
      value: PORTAL_LABEL[statusType],
      hint: '',
      tone:
        statusType === 'Overload'
          ? 'text-purple-600'
          : statusType === 'Fit'
            ? 'text-emerald-600'
            : statusType === 'Underload'
              ? 'text-amber-600'
              : 'text-rose-600',
    },
  ];

  return (
    <section
      className='bg-surface border border-border rounded-card p-5 shadow-card flex flex-col gap-4'
      aria-label='Analitik WAD Kepatuhan dan Workload'
    >
      <div className='flex items-start justify-between gap-3 pb-3 border-b border-border'>
        <div>
          <h2 className='text-[15px] font-bold tracking-tight text-slate-text leading-tight'>
            WAD · Workload Analysis
          </h2>
          <span className='text-[11.5px] text-slate-muted mt-0.5 block'>
            Kepatuhan jam kerja 8 jam/hari kerja, dihitung dari log aktivitas
            tugas terverifikasi.
          </span>
        </div>
        {!isDisconnected && (
          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${palette.pill}`}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {isDisconnected ? (
        <div className='py-3 pb-4'>
          <EmptyState
            tone='amber'
            icon={<ZapOff size={22} />}
            title='Layanan WAD Memerlukan Koneksi Taiga'
            description='Monitoring kepatuhan 8 jam kerja harian dihitung secara otomatis dari aktivitas tugas di Taiga. Hubungkan sesi Taiga di menu Pengaturan untuk mengaktifkan pemantauan.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline max-w-full text-center whitespace-normal h-auto min-h-10.5 py-2 px-4 text-[13px] leading-snug'
                id='btn-wad-settings'
              >
                <Settings size={15} className='shrink-0' />
                <span>Konfigurasi Taiga di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] gap-4 items-stretch'>
          <div
            className={`rounded-xl p-3.5 border flex flex-col gap-2 ${palette.box}`}
          >
            <div className='flex items-center justify-between gap-2'>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${palette.badge}`}
              >
                STATUS {statusLabel}
              </span>
              <span className={`text-[12.5px] font-extrabold ${palette.text}`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div>
              <div className='text-xl font-extrabold text-slate-text leading-snug my-2'>
                {kpis?.compliance ||
                  (percentage === 0
                    ? 'Belum Ada Log Hari Ini'
                    : 'Status Belum Terdata')}
              </div>
              <p className='text-[11px] text-slate-muted leading-relaxed mt-1'>
                Target {DAILY_TARGET_HOURS} jam/hari kerja dihitung berdasarkan
                log aktivitas tugas terverifikasi.
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className='bg-slate-50/80 border border-border rounded-xl p-4 flex flex-col justify-center gap-1 min-h-[104px] transition-all hover:bg-surface-hover hover:border-border-strong'
              >
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-muted leading-tight'>
                  {stat.label}
                </span>
                <span
                  className={`text-[22px] font-extrabold tracking-tight leading-none ${stat.tone}`}
                >
                  {stat.value}
                </span>
                {stat.hint && (
                  <span className='text-[11px] font-normal text-slate-dim'>
                    {stat.hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
