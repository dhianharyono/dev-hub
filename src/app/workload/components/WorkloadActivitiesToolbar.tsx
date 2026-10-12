'use client';

import { Select } from '@/components/Select';

interface WorkloadActivitiesToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  filterProject: string;
  setFilterProject: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  availableProjects: string[];
}

export function WorkloadActivitiesToolbar({
  search,
  setSearch,
  filterProject,
  setFilterProject,
  filterStatus,
  setFilterStatus,
  availableProjects,
}: WorkloadActivitiesToolbarProps) {
  return (
    <div className='flex items-center justify-between flex-wrap gap-4 mb-5'>
      <div>
        <h3 className='text-base sm:text-lg font-bold text-slate-text m-0'>
          Detail Activity per Individu
        </h3>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative w-[280px]'>
          <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-xs opacity-50 pointer-events-none'>
            🔍
          </span>
          <input
            type='text'
            className='input pl-9 pr-3 h-10 text-xs sm:text-sm rounded-xl'
            placeholder='Search by activities title or key'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          size='sm'
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className='w-[155px] !h-10 text-xs sm:text-sm rounded-xl'
        >
          <option value='ALL'>Semua Proyek</option>
          {availableProjects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>

        <Select
          size='sm'
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className='w-[145px] !h-10 text-xs sm:text-sm rounded-xl'
        >
          <option value='ALL'>Semua Status</option>
          <option value='IN_PROGRESS'>In Progress</option>
          <option value='DONE'>Done</option>
        </Select>
      </div>
    </div>
  );
}
