'use client';

import { useEffect, useMemo } from 'react';
import { Search, RefreshCw, GitPullRequest } from 'lucide-react';
import { Select } from '@/components/Select';
import { MrCard } from './MrCard';
import { useNotification } from '@/components/Notification';
import type {
  IncomingMRItem,
  ReviewScope,
  ReviewStatus,
  DetailTab,
} from './types';

interface MrListProps {
  mrs: IncomingMRItem[];
  loading: boolean;
  error: string | null;
  selectedMr: IncomingMRItem | null;
  onSelectMr: (mr: IncomingMRItem) => void;
  onOpenModal: (mr: IncomingMRItem, tab: DetailTab) => void;
  scope: ReviewScope;
  onScopeChange: (scope: ReviewScope) => void;
  status: ReviewStatus;
  onStatusChange: (status: ReviewStatus) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
}

export function MrList({
  mrs,
  loading,
  error,
  selectedMr,
  onSelectMr,
  onOpenModal,
  scope,
  onScopeChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  onRefresh,
}: MrListProps) {
  const { notify } = useNotification();

  useEffect(() => {
    if (error) {
      notify.error(error, 'Merge Request');
    }
  }, [error, notify]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return mrs;
    return mrs.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.projectName.toLowerCase().includes(q) ||
        m.author.name.toLowerCase().includes(q) ||
        m.author.username.toLowerCase().includes(q),
    );
  }, [mrs, search]);

  return (
    <div className='flex flex-col gap-4'>
      {/* Top Controls Bar */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        {/* Scope Switcher */}
        <div className='flex items-center gap-3'>
          <div className='segmented' role='group' aria-label='Cakupan MR'>
            <button
              type='button'
              aria-pressed={scope === 'authored'}
              onClick={() => onScopeChange('authored')}
              className='text-xs px-3.5 py-1.5'
            >
              MR Saya
            </button>
            <button
              type='button'
              aria-pressed={scope === 'assigned'}
              onClick={() => onScopeChange('assigned')}
              className='text-xs px-3.5 py-1.5'
            >
              Perlu Review Saya
            </button>
            <button
              type='button'
              aria-pressed={scope === 'all_team'}
              onClick={() => onScopeChange('all_team')}
              className='text-xs px-3.5 py-1.5'
            >
              Semua MR Tim
            </button>
          </div>
          <Select
            size='sm'
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ReviewStatus)}
            className='w-[115px] h-8 text-[12.5px]'
            aria-label='Filter status merge request'
          >
            <option value='opened'>Open</option>
            <option value='merged'>Merged</option>
            <option value='closed'>Closed</option>
            <option value='all'>Semua</option>
          </Select>
        </div>

        {/* Status Chips & Refresh Button */}
        <div className='flex items-center gap-2 flex-wrap'>
          <button
            type='button'
            className='btn btn-ghost xs text-[11.5px] px-2.5 py-1 gap-1.5'
            onClick={onRefresh}
            disabled={loading}
            title='Muat ulang daftar MR dari GitLab'
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Result Count */}
      <div className='row-between items-center gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-[260px]'>
          <Search
            size={14}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-text-3'
          />
          <input
            type='text'
            className='input w-full pl-9 h-[38px] text-[12.5px]'
            placeholder='Cari nomor !123, judul fitur, author, atau repositori...'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className='xs dim font-semibold'>
          {filtered.length} Merge Request ditemukan
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className='flex flex-col items-center justify-center py-12 px-5 gap-2.5'>
          <span className='spinner w-6 h-6' />
          <span className='dim xs'>
            Memuat daftar Merge Request dari GitLab...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-12 px-5 border border-dashed border-border rounded-xl bg-surface-subtle'>
          <GitPullRequest
            size={32}
            className='text-slate-text-3 mx-auto mb-2.5 block'
          />
          <strong className='text-sm text-slate-text'>
            Tidak Ada MR Ditemukan
          </strong>
          <p className='text-xs text-slate-text-3 mt-1.5 mb-0 leading-normal'>
            {scope === 'assigned'
              ? 'Saat ini belum ada MR yang menugaskan Anda sebagai reviewer.'
              : 'Tidak ada MR yang cocok dengan filter pencarian saat ini.'}
          </p>
        </div>
      ) : (
        /* Spacious Responsive Grid for MR Cards */
        <div className='grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-3.5'>
          {filtered.map((mr) => (
            <MrCard
              key={mr.id}
              mr={mr}
              isSelected={selectedMr?.id === mr.id}
              onSelect={() => onSelectMr(mr)}
              onOpenModal={(tab) => onOpenModal(mr, tab)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
