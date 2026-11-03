'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import type { WorkloadTask } from '@/lib/workload';

interface TaigaActiveTasksListProps {
  tasks: WorkloadTask[];
  totalActiveCount: number;
}

export function TaigaActiveTasksList({
  tasks,
  totalActiveCount,
}: TaigaActiveTasksListProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'progress' | 'todo'>('all');
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (newTab: 'all' | 'progress' | 'todo') => {
    if (newTab === filterTab) return;
    setIsTabSwitching(true);
    setFilterTab(newTab);
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 280);
  };

  const inProgressTasks = useMemo(() => {
    return tasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return (
        s.includes('progress') ||
        s.includes('working') ||
        s.includes('proses') ||
        s.includes('ongoing')
      );
    });
  }, [tasks]);

  const todoTasks = useMemo(() => {
    return tasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return (
        !s.includes('progress') &&
        !s.includes('working') &&
        !s.includes('proses') &&
        !s.includes('ongoing')
      );
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filterTab === 'progress') {
      list = inProgressTasks;
    } else if (filterTab === 'todo') {
      list = todoTasks;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          (t.projectName && t.projectName.toLowerCase().includes(q)) ||
          (t.status && t.status.toLowerCase().includes(q)) ||
          String(t.ref || t.id).includes(q),
      );
    }

    return list;
  }, [tasks, filterTab, inProgressTasks, todoTasks, searchQuery]);

  const getStatusBadge = (statusName: string) => {
    const s = (statusName || '').toLowerCase();
    if (
      s.includes('progress') ||
      s.includes('working') ||
      s.includes('proses')
    ) {
      return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
          <span className='w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse' />
          {statusName || 'Dalam Proses'}
        </span>
      );
    }
    if (s.includes('test') || s.includes('qa') || s.includes('review')) {
      return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200'>
          <span className='w-1.5 h-1.5 rounded-full bg-purple-500' />
          {statusName || 'Review / QA'}
        </span>
      );
    }
    if (s.includes('block') || s.includes('kendala')) {
      return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200'>
          <AlertCircle size={10} className='text-rose-600' />
          {statusName || 'Tertunda'}
        </span>
      );
    }
    return (
      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200'>
        <span className='w-1.5 h-1.5 rounded-full bg-slate-400' />
        {statusName || 'Antrean'}
      </span>
    );
  };

  const renderSkeleton = () => (
    <div className='flex flex-col gap-2'>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={`task-skel-${i}`}
          className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl animate-pulse shadow-2xs'
        >
          <div className='flex items-start gap-2.5 min-w-0 flex-1'>
            <div className='w-9 h-5 rounded-md bg-slate-200 shrink-0 mt-0.5' />
            <div className='flex flex-col gap-2 flex-1'>
              <div
                className='h-3.5 bg-slate-200 rounded'
                style={{ width: `${55 + (i % 3) * 18}%` }}
              />
              <div className='flex items-center gap-2'>
                <div className='w-14 h-3 rounded bg-slate-100' />
                <div className='w-20 h-3 rounded bg-slate-100' />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3 shrink-0 pt-2 sm:pt-0'>
            <div className='w-10 h-3.5 rounded bg-slate-100' />
            <div className='w-20 h-5 rounded-md bg-slate-100' />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className='flex flex-col gap-4 p-5 sm:p-6 bg-slate-50/70 border border-border rounded-2xl'>
      {/* Sub-Header */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-2.5'>
          <div>
            <h3 className='text-[14px] font-bold text-slate-text leading-tight m-0'>
              Daftar Tugas Aktif Tim
            </h3>
            <span className='text-[11px] text-slate-muted'>
              Pantau pekerjaan yang sedang berlangsung dan antrean sprint
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          {/* Search box */}
          <div className='relative flex items-center min-w-[160px] sm:min-w-[200px]'>
            <Search
              size={13}
              className='absolute left-2.5 text-slate-400 pointer-events-none'
            />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Cari nomor / judul tugas...'
              className='w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-xl text-slate-text placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand'
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='flex items-center gap-1.5 border-b border-border pb-2.5 overflow-x-auto'>
        <button
          type='button'
          onClick={() => handleTabChange('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'all'
              ? 'bg-surface text-brand font-bold shadow-2xs border border-border'
              : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
          }`}
        >
          Semua Aktif ({totalActiveCount})
        </button>
        <button
          type='button'
          onClick={() => handleTabChange('progress')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'progress'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
              : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
          }`}
        >
          Sedang Dikerjakan ({inProgressTasks.length})
        </button>
        <button
          type='button'
          onClick={() => handleTabChange('todo')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            filterTab === 'todo'
              ? 'bg-slate-200 text-slate-800 font-bold border border-slate-300'
              : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
          }`}
        >
          Antrean / To Do ({todoTasks.length})
        </button>
      </div>

      {/* Task List Table / Cards */}
      {isTabSwitching ? (
        renderSkeleton()
      ) : filteredTasks.length > 0 ? (
        <div className='flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 animate-in fade-in duration-200'>
          {filteredTasks.slice(0, 10).map((t) => {
            const hasUrl = Boolean(t.url);
            return (
              <div
                key={`monitoring-task-${t.id}-${t.ref}`}
                className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all'
              >
                <div className='flex items-start gap-2.5 min-w-0 flex-1'>
                  <span className='px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-bold shrink-0 mt-0.5'>
                    #{t.ref || t.id}
                  </span>

                  <div className='flex flex-col min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span
                        className='text-xs font-bold text-slate-text hover:text-brand transition-colors line-clamp-1'
                        title={t.subject}
                      >
                        {t.subject}
                      </span>
                    </div>

                    <div className='flex items-center gap-2 flex-wrap mt-1 text-[11px] text-slate-muted'>
                      <span className='px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold text-[10px] border border-purple-200'>
                        {t.projectName || t.project || 'Taiga'}
                      </span>
                      {t.activityDate && (
                        <span>Aktivitas: {t.activityDate}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40'>
                  <div className='flex items-center gap-1.5 text-xs text-slate-text font-semibold'>
                    <Clock size={12} className='text-slate-400' />
                    <span>{(t.timeSpentHours || 0).toFixed(1)}h</span>
                  </div>

                  {getStatusBadge(t.status)}

                  {hasUrl ? (
                    <a
                      href={t.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-1 text-slate-400 hover:text-brand transition-colors shrink-0'
                      title='Buka tugas di Taiga'
                    >
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <Link
                      href='/tasks'
                      className='p-1 text-slate-400 hover:text-brand transition-colors shrink-0'
                      title='Kelola di Smart Task'
                    >
                      <Sparkles size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTasks.length > 10 && (
            <div className='text-center pt-2 text-xs text-slate-muted'>
              Menampilkan 10 dari {filteredTasks.length} tugas. Kelola
              selengkapnya di{' '}
              <Link
                href='/tasks'
                className='text-brand font-bold hover:underline'
              >
                Smart Task Board
              </Link>
              .
            </div>
          )}
        </div>
      ) : (
        <div className='py-8 px-4 text-center bg-surface border border-dashed border-border rounded-xl'>
          <CheckCircle2 size={26} className='text-emerald-500 mx-auto mb-2' />
          <h4 className='text-xs font-bold text-slate-text m-0'>
            {searchQuery ? 'Tugas Tidak Ditemukan' : 'Tidak Ada Tugas Aktif'}
          </h4>
          <p className='text-[11px] text-slate-muted mt-1 max-w-sm mx-auto'>
            {searchQuery
              ? `Tidak ada tugas aktif yang cocok dengan kata kunci "${searchQuery}".`
              : 'Semua tugas pada sprint/periode ini telah diselesaikan atau belum ada tugas aktif yang ditugaskan.'}
          </p>
        </div>
      )}
    </div>
  );
}
