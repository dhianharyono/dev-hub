'use client';

import { RefreshCw, Search } from 'lucide-react';

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
          <h2 id='my-tasks-title' className='text-lg font-bold tracking-tight text-slate-text m-0'>
            Tiket Taiga yang Ditugaskan
          </h2>
          <p className='text-xs sm:text-sm text-slate-muted m-0 mt-1'>
            Perbarui status dan detail tiket kerja tanpa perlu membuka portal Taiga
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
        <div className='flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-xl border border-slate-300/80' role='group' aria-label='Filter status task'>
          <button
            type='button'
            aria-pressed={assignedActiveOnly}
            onClick={() => {
              setAssignedActiveOnly(true);
              onRefresh(true);
            }}
            className={`text-xs sm:text-[13px] font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              assignedActiveOnly
                ? 'bg-white text-brand shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            Task Aktif Saja
          </button>
          <button
            type='button'
            aria-pressed={!assignedActiveOnly}
            onClick={() => {
              setAssignedActiveOnly(false);
              onRefresh(false);
            }}
            className={`text-xs sm:text-[13px] font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              !assignedActiveOnly
                ? 'bg-white text-brand shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            Semua Task (Termasuk Done)
          </button>
        </div>

        {/* Project Quick Filter Tabs / Badges */}
        {assignedProjects.length > 1 && (
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-xs font-semibold text-slate-muted mr-0.5'>
              Proyek:
            </span>
            <button
              type='button'
              onClick={() => setSelectedAssignedProject('all')}
              className={`badge text-xs cursor-pointer py-1.5 px-3 rounded-lg ${
                selectedAssignedProject === 'all'
                  ? 'badge-primary'
                  : 'badge-neutral'
              }`}
            >
              Semua Proyek
            </button>
            {assignedProjects.map((p) => (
              <button
                key={p.id}
                type='button'
                onClick={() => setSelectedAssignedProject(p.id)}
                className={`badge text-xs cursor-pointer py-1.5 px-3 rounded-lg ${
                  selectedAssignedProject === p.id
                    ? 'badge-primary'
                    : 'badge-neutral'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Search Box */}
        <div className='relative min-w-[260px] flex-1 sm:flex-initial'>
          <Search
            size={15}
            className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
          />
          <input
            type='text'
            className='input !pl-10 !h-10 !text-xs sm:!text-sm !bg-white rounded-xl'
            placeholder='Cari judul task atau #ref...'
            value={assignedSearch}
            onChange={(e) => setAssignedSearch(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
