'use client';

import { Select } from '@/components/Select';
import type { WorkloadData } from '@/lib/workload';

interface WorkloadHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  availableMonths?: WorkloadData['availableMonths'];
  onRefresh: (m: string) => void;
  connected?: boolean;
}

export function WorkloadHeader({
  selectedMonth,
  setSelectedMonth,
  loading,
  setLoading,
  availableMonths,
  onRefresh,
  connected = true,
}: WorkloadHeaderProps) {
  return (
    <header className='flex items-start justify-between gap-4 flex-wrap mb-2'>
      <div className='flex-1 max-w-2xl'>
        <div className='text-xs font-bold uppercase tracking-wider text-brand mb-1.5'>
          WAD · Workload Analysis
        </div>
        <h1 className='text-3xl font-extrabold tracking-tight text-slate-text flex items-center gap-3'>
          Workload <span className='text-brand'>Monitor</span>
        </h1>
        <p className='text-slate-muted mt-2 text-sm leading-relaxed'>
          {!connected
            ? 'Koneksi Taiga tidak aktif. Konfigurasikan di Pengaturan.'
            : 'Pemantauan workload berdasarkan aktivitas Taiga'}
        </p>
      </div>

      <div className='flex items-center gap-2.5 flex-nowrap shrink-0 ml-auto self-center'>
        <Select
          value={selectedMonth}
          disabled={!connected || loading}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setLoading(true);
          }}
          className='w-[170px] h-[38px] text-[13px] font-semibold rounded-lg'
        >
          {availableMonths?.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          )) || <option value='2026-10'>Oktober 2026</option>}
        </Select>

        <button
          type='button'
          className='btn h-[38px] px-3.5 text-[13px] font-semibold whitespace-nowrap rounded-lg'
          onClick={() => onRefresh(selectedMonth)}
          disabled={!connected || loading}
          title={
            !connected
              ? 'Taiga belum terhubung. Konfigurasikan di Pengaturan.'
              : undefined
          }
        >
          {loading ? <span className='spinner' /> : '↻ Refresh'}
        </button>
      </div>
    </header>
  );
}
