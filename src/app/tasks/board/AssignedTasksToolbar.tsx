'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Select } from '@/components/Select';

interface AssignedTasksToolbarProps {
  loadingAssigned: boolean;
  assignedActiveOnly: boolean;
  setAssignedActiveOnly: (activeOnly: boolean) => void;
  onRefresh: (activeOnly?: boolean) => void;
  assignedProjects: { id: number; name: string; slug: string }[];
  selectedAssignedProject: number | 'all';
  setSelectedAssignedProject: (id: number | 'all') => void;
  assignedSearch: string;
  setAssignedSearch: (q: string) => void;
}

export function AssignedTasksToolbar({
  loadingAssigned,
  assignedActiveOnly,
  setAssignedActiveOnly,
  onRefresh,
  assignedProjects,
  selectedAssignedProject,
  setSelectedAssignedProject,
  assignedSearch,
  setAssignedSearch,
}: AssignedTasksToolbarProps) {
  return (
    <>
      {/* Section Header */}
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 mb-6 border-b border-border'>
        <div>
          <h2
            id='my-tasks-title'
            className='text-lg font-bold tracking-tight text-slate-text m-0'
          >
            Daftar Tiket Taiga
          </h2>
          <p className='text-xs sm:text-sm text-slate-muted m-0 mt-1'>
            Perbarui status dan detail tiket kerja tanpa perlu membuka portal
            Taiga
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='btn btn-ghost btn-sm text-xs sm:text-sm px-4'
            onClick={() => onRefresh(assignedActiveOnly)}
            disabled={loadingAssigned}
          >
            <RefreshCw size={14} className={loadingAssigned ? 'spin' : ''} />
            <span>{loadingAssigned ? 'Memuat...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className='flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-50/90 border border-border rounded-2xl mb-6 shadow-xs'>
        {/* Active / All Toggle */}
        <div
          className='flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-xl border border-slate-300/80'
          role='group'
          aria-label='Filter status task'
        >
          <button
            type='button'
            aria-pressed={assignedActiveOnly}
            onClick={() => {
              if (loadingAssigned || assignedActiveOnly) return;
              setAssignedActiveOnly(true);
              onRefresh(true);
            }}
            disabled={loadingAssigned}
            className={`text-xs sm:text-[13px] font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              assignedActiveOnly
                ? 'bg-white text-brand shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            Task Aktif
          </button>
          <button
            type='button'
            aria-pressed={!assignedActiveOnly}
            onClick={() => {
              if (loadingAssigned || !assignedActiveOnly) return;
              setAssignedActiveOnly(false);
              onRefresh(false);
            }}
            disabled={loadingAssigned}
            className={`text-xs sm:text-[13px] font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              !assignedActiveOnly
                ? 'bg-white text-brand shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            Semua Task
          </button>
        </div>

        {/* Right Filter Controls: Project Select & Search Filter */}
        <div className='flex items-center gap-3 flex-wrap flex-1 sm:flex-initial justify-end'>
          {/* Project Select Filter */}
          <div className='w-full sm:w-[220px]'>
            <Select
              size='sm'
              value={String(selectedAssignedProject)}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedAssignedProject(val === 'all' ? 'all' : Number(val));
              }}
              className='w-full !h-10 text-xs sm:text-sm rounded-xl !bg-white'
              aria-label='Filter berdasarkan Proyek'
            >
              <option value='all'>Semua Proyek</option>
              {assignedProjects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Search Box */}
          <div className='relative w-full sm:w-[250px]'>
            <Search
              size={15}
              className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
            />
            <input
              type='text'
              className='input !pl-10 !h-10 !text-xs sm:!text-sm !bg-white rounded-xl w-full'
              placeholder='Cari judul task atau #ref...'
              value={assignedSearch}
              onChange={(e) => setAssignedSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
