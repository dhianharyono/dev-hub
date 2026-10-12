'use client';

import type { WorkloadTask } from '@/lib/workload';
import { WorkloadActivitiesPagination } from './WorkloadActivitiesPagination';
import { WorkloadActivitiesToolbar } from './WorkloadActivitiesToolbar';

interface WorkloadActivitiesTableProps {
  tasks: WorkloadTask[];
  search: string;
  setSearch: (val: string) => void;
  filterProject: string;
  setFilterProject: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  availableProjects: string[];
  page: number;
  setPage: (updater: number | ((p: number) => number)) => void;
  pageSize?: number;
}

export function WorkloadActivitiesTable({
  tasks,
  search,
  setSearch,
  filterProject,
  setFilterProject,
  filterStatus,
  setFilterStatus,
  availableProjects,
  page,
  setPage,
  pageSize = 10,
}: WorkloadActivitiesTableProps) {
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      String(t.ref).includes(search) ||
      t.project.toLowerCase().includes(search.toLowerCase());

    const matchProj =
      filterProject === 'ALL' || t.project.toUpperCase() === filterProject;

    const matchStat =
      filterStatus === 'ALL' ||
      (filterStatus === 'DONE' && t.isClosed) ||
      (filterStatus === 'IN_PROGRESS' && !t.isClosed);

    return matchSearch && matchProj && matchStat;
  });

  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  return (
    <section className='card animate-fade-up'>
      <WorkloadActivitiesToolbar
        search={search}
        setSearch={setSearch}
        filterProject={filterProject}
        setFilterProject={setFilterProject}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        availableProjects={availableProjects}
      />

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className='table'>
          <thead>
            <tr className='bg-surface-subtle/50'>
              <th className='w-27.5'>Key</th>
              <th className='w-23.75'>Project</th>
              <th>Activity Title</th>
              <th className='w-30'>Status</th>
              <th className='w-22.5'>Priority</th>
              <th className='w-32.5 text-right whitespace-nowrap'>
                Time Spent
              </th>
              <th className='w-55 pl-8'>Updated At ↓</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className='p-8 text-center text-xs text-slate-400'
                >
                  Tidak ada aktivitas yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedTasks.map((t) => (
                <tr
                  key={t.id}
                  className='border-b border-border-subtle last:border-b-0 hover:bg-surface-hover/60 transition-colors'
                >
                  <td>
                    <a
                      href={t.url}
                      target='_blank'
                      rel='noreferrer'
                      className='font-mono text-cyan-600 font-bold hover:underline'
                      title='Buka task di Taiga'
                    >
                      #{t.ref}
                    </a>
                  </td>
                  <td>
                    <span className='badge badge-cyan text-[11px] px-2 py-0.5 rounded-md'>
                      {t.project}
                    </span>
                  </td>
                  <td className='font-medium text-slate-text'>{t.subject}</td>
                  <td>
                    <span
                      className={`badge ${t.isClosed ? 'badge-green' : 'badge-cyan'} text-[11px] px-2 py-0.5 rounded-md`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className='text-slate-500'>{t.priority}</td>
                  <td className='text-right font-bold text-slate-text whitespace-nowrap'>
                    {t.timeSpentHours}{' '}
                    <span className='text-xs text-slate-400 font-normal'>
                      jam
                    </span>
                  </td>
                  <td className='text-slate-500 text-xs pl-8 whitespace-nowrap'>
                    {t.updatedAt}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <WorkloadActivitiesPagination
        totalTasks={totalTasks}
        startIndex={startIndex}
        endIndex={endIndex}
        currentPage={currentPage}
        totalPages={totalPages}
        setPage={setPage}
      />
    </section>
  );
}
