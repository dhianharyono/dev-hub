'use client';

import Link from 'next/link';
import { Settings, ZapOff } from 'lucide-react';
import type { WorkloadData } from '@/lib/workload';
import { EmptyState } from '@/components/EmptyState';
import { WadSkeletonCard } from './DashboardSkeleton';

interface WadAnalyticsCardProps {
  workload: WorkloadData | null;
  connected?: boolean;
  loading?: boolean;
}

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

  let statusType: 'Fit' | 'Underload' | 'Overload' | 'Empty' = 'Empty';

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

  const boxColors = {
    Fit: 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
    Underload: 'bg-amber-50/60 border-amber-200 text-amber-950',
    Overload: 'bg-purple-50/60 border-purple-200 text-purple-950',
    Empty: 'bg-rose-50/60 border-rose-200 text-rose-950',
  }[statusType];

  const badgeColors = {
    Fit: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Underload: 'bg-amber-100 text-amber-800 border-amber-300',
    Overload: 'bg-purple-100 text-purple-800 border-purple-300',
    Empty: 'bg-rose-100 text-rose-800 border-rose-300',
  }[statusType];

  const textColors = {
    Fit: 'text-emerald-600',
    Underload: 'text-amber-600',
    Overload: 'text-purple-600',
    Empty: 'text-rose-600',
  }[statusType];

  return (
    <section
      className='bg-surface border border-border rounded-[18px] p-5 shadow-card flex flex-col gap-3.5'
      aria-label='Analitik WAD Kepatuhan dan Workload'
    >
      <div className='flex items-center justify-between pb-2.5 border-b border-border'>
        <div>
          <h2 className='text-[15px] font-bold tracking-tight text-slate-text leading-tight'>
            WAD · Workload Analysis
          </h2>
          <span className='text-[11.5px] text-slate-muted mt-0.5 block'>
            Monitoring kepatuhan jam kerja wajib 8h/hari (weekday)
          </span>
        </div>
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
                className='btn btn-primary no-underline'
                id='btn-wad-settings'
              >
                <Settings size={15} />
                <span>Konfigurasi Taiga di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] gap-3.5 items-stretch'>
            <div
              className={`rounded-xl p-3.5 border flex flex-col gap-2 ${boxColors}`}
            >
              <div className='flex items-center justify-between'>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${badgeColors}`}
                >
                  STATUS{' '}
                  {statusType === 'Empty'
                    ? 'BELUM LOG'
                    : statusType.toUpperCase()}
                </span>
                <span className={`text-[12.5px] font-extrabold ${textColors}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div>
                <div className='text-lg font-bold text-slate-text leading-snug my-4'>
                  {kpis?.compliance ||
                    (percentage === 0
                      ? 'Belum Ada Log Hari Ini'
                      : 'Status Belum Terdata')}
                </div>
                <p className='text-[11px] text-slate-muted leading-relaxed mt-1'>
                  Target 8 jam/hari kerja dihitung berdasarkan log aktivitas
                  tugas terverifikasi.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <div className='bg-slate-50/80 border border-border rounded-xl p-2.5 px-3 flex flex-col justify-between min-h-[55px] gap-0.5 transition-all hover:bg-surface-hover hover:border-border-strong hover:shadow-xs'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-muted leading-tight'>
                  Jam Kerja Aktif
                </span>
                <div className='flex items-baseline gap-1'>
                  <span className='text-[16px] font-extrabold tracking-tight font-mono text-brand leading-none'>
                    {workload?.kpis?.timeSpent || 0}h
                  </span>
                  <span className='text-[10.5px] font-normal text-slate-dim'>
                    / {workload?.kpis?.expectedHours || 0}h
                  </span>
                </div>
                <span className='text-[10px] text-slate-dim truncate leading-tight'>
                  {workload?.kpis?.timeSpent &&
                  workload.kpis.expectedHours &&
                  workload.kpis.timeSpent >= workload.kpis.expectedHours
                    ? 'Kapasitas Terpenuhi'
                    : 'Target Jam Bulanan'}
                </span>
              </div>

              <div className='bg-slate-50/80 border border-border rounded-xl p-2.5 px-3 flex flex-col justify-between min-h-[55px] gap-0.5 transition-all hover:bg-surface-hover hover:border-border-strong hover:shadow-xs'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-muted leading-tight'>
                  Tugas Selesai
                </span>
                <div className='flex items-baseline gap-1'>
                  <span className='text-[16px] font-extrabold tracking-tight font-mono text-emerald-600 leading-none'>
                    {workload?.statusBreakdown?.done || 0}
                  </span>
                  <span className='text-[10.5px] font-normal text-slate-dim'>
                    / {workload?.kpis?.activitiesCount || 0}
                  </span>
                </div>
                <span className='text-[10px] text-slate-dim truncate leading-tight'>
                  {workload?.kpis?.activitiesCount &&
                  workload.kpis.activitiesCount > 0
                    ? `${Math.round(((workload?.statusBreakdown?.done || 0) / workload.kpis.activitiesCount) * 100)}% Selesai`
                    : 'Aktivitas Tercatat'}
                </span>
              </div>

              <div className='bg-slate-50/80 border border-border rounded-xl p-2.5 px-3 flex flex-col justify-between min-h-[55px] gap-0.5 transition-all hover:bg-surface-hover hover:border-border-strong hover:shadow-xs'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-muted leading-tight'>
                  Hari Kerja
                </span>
                <div className='flex items-baseline gap-1'>
                  <span className='text-[16px] font-extrabold tracking-tight font-mono text-violet-600 leading-none'>
                    {workload?.kpis?.workdaysPassed || 0}
                  </span>
                  <span className='text-[10.5px] font-normal text-slate-dim'>
                    / {workload?.kpis?.totalMonthWorkdays || 0}
                  </span>
                </div>
                <span className='text-[10px] text-slate-dim truncate leading-tight'>
                  Hari Bulan Ini
                </span>
              </div>

              <div className='bg-slate-50/80 border border-border rounded-xl p-2.5 px-3 flex flex-col justify-between min-h-[55px] gap-0.5 transition-all hover:bg-surface-hover hover:border-border-strong hover:shadow-xs'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-muted leading-tight'>
                  Status Portal
                </span>
                <span className='text-[15px] font-extrabold tracking-tight font-mono text-sky-600 leading-none truncate'>
                  {workload?.kpis?.status === 'Fit'
                    ? 'Fit'
                    : workload?.kpis?.status === 'Overload'
                      ? 'Lembur'
                      : 'Perlu Pengisian'}
                </span>
                <span className='text-[10px] text-slate-dim truncate leading-tight'>
                  Portal Timesheet (WAD)
                </span>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between text-[11px] text-slate-muted pt-2.5 border-t border-border flex-wrap gap-2'>
            <div className='flex items-center'>
              <span>Periode {workload?.monthLabel || 'Bulan Berjalan'}</span>
            </div>
            <span className='font-semibold text-slate-dim'>
              Standar Kepatuhan: 08:00 - 17:00 WIB (8 Jam / Hari)
            </span>
          </div>
        </>
      )}
    </section>
  );
}
