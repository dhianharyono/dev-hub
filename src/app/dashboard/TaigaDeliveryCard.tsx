'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import type { WorkloadData, WorkloadTask } from '@/lib/workload';
import { EmptyState } from '@/components/EmptyState';
import { useAppMode } from '@/components/AppModeContext';
import { TaigaSkeletonCard } from './DashboardSkeleton';
import { TaigaActiveTasksList } from './TaigaActiveTasksList';
import { TaigaReleaseNoteSection } from './TaigaReleaseNoteSection';

interface TaigaDeliveryCardProps {
  workload: WorkloadData | null;
  connected?: boolean;
  loading?: boolean;
  activeTasks?: WorkloadTask[];
  totalTasks: number;
  doneCount: number;
  inProgressCount: number;
  todoCount: number;
  donePct: number;
  progPct: number;
  todoPct: number;
  avgHoursPerTask: string;
  projectCount: number;
}

export function TaigaDeliveryCard({
  workload,
  connected = true,
  loading = false,
  activeTasks = [],
  totalTasks,
  doneCount,
  inProgressCount,
  todoCount,
  donePct,
  progPct,
  todoPct,
  avgHoursPerTask,
  projectCount,
}: TaigaDeliveryCardProps) {
  const { isMonitoring } = useAppMode();
  const tasks = workload?.tasks;

  const projectAllocations = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const map = new Map<
      string,
      {
        name: string;
        count: number;
        doneCount: number;
        progCount: number;
        todoCount: number;
        hours: number;
      }
    >();

    for (const t of tasks) {
      const key = t.projectName || t.project || 'Taiga';
      const cur = map.get(key) || {
        name: key,
        count: 0,
        doneCount: 0,
        progCount: 0,
        todoCount: 0,
        hours: 0,
      };
      cur.count += 1;
      cur.hours += t.timeSpentHours || 0;
      const s = (t.status || '').toLowerCase();
      if (
        t.isClosed ||
        s.includes('done') ||
        s.includes('closed') ||
        s.includes('selesai') ||
        s.includes('resolved')
      ) {
        cur.doneCount += 1;
      } else if (
        s.includes('progress') ||
        s.includes('review') ||
        s.includes('test')
      ) {
        cur.progCount += 1;
      } else {
        cur.todoCount += 1;
      }
      map.set(key, cur);
    }

    const totalHours = Array.from(map.values()).reduce(
      (sum, p) => sum + p.hours,
      0,
    );

    const colorClasses = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-amber-500',
      'bg-pink-500',
    ];

    return Array.from(map.values())
      .map((p, idx) => ({
        ...p,
        hoursFormatted: p.hours.toFixed(1),
        pct: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0,
        taskPct: p.count > 0 ? Math.round((p.doneCount / p.count) * 100) : 0,
        colorClass: colorClasses[idx % colorClasses.length],
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [tasks]);

  if (loading && !workload) {
    return <TaigaSkeletonCard />;
  }

  const isDisconnected = !connected;

  const renderPipelineFlow = (detailed = false) => (
    <div
      className={`flex flex-col gap-2 p-5 bg-surface-subtle border border-border rounded-2xl${
        detailed ? ' h-full gap-3' : ''
      }`}
    >
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between text-xs font-bold text-slate-text'>
          <span>Pipeline Status Delivery</span>
          <span className='text-emerald-600 font-extrabold'>{donePct}%</span>
        </div>
        {(() => {
          const doneBarStyle: React.CSSProperties = { width: `${donePct}%` };
          const progBarStyle: React.CSSProperties = { width: `${progPct}%` };
          const todoBarStyle: React.CSSProperties = { width: `${todoPct}%` };
          return (
            <div className='flex h-2.5 w-full rounded-full bg-slate-200 overflow-hidden gap-0.5'>
              <div
                className='bg-emerald-500 transition-all duration-500'
                style={doneBarStyle}
                title={`Selesai: ${doneCount} tugas`}
              />
              <div
                className='bg-blue-500 transition-all duration-500'
                style={progBarStyle}
                title={`Dalam Proses: ${inProgressCount} tugas`}
              />
              <div
                className='bg-slate-400 transition-all duration-500'
                style={todoBarStyle}
                title={`Antrean: ${todoCount} tugas`}
              />
            </div>
          );
        })()}
        <div className='flex items-center gap-4 flex-wrap pt-0.5'>
          <div className='flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-text-2'>
            <span className='w-2 h-2 rounded-full bg-emerald-500' />
            <span>Selesai: {doneCount}</span>
          </div>
          <div className='flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-text-2'>
            <span className='w-2 h-2 rounded-full bg-blue-500' />
            <span>Proses: {inProgressCount}</span>
          </div>
          <div className='flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-text-2'>
            <span className='w-2 h-2 rounded-full bg-slate-400' />
            <span>Antrean: {todoCount}</span>
          </div>
        </div>
      </div>

      {detailed && projectAllocations.length > 0 && (
        <div className='flex flex-1 flex-col gap-2.5 border-t border-border/60 pt-3'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[10.5px] font-bold uppercase tracking-wider text-slate-muted'>
              Status per Proyek
            </span>
            <span className='grid w-36 shrink-0 grid-cols-3 gap-1 text-right text-[9.5px] font-bold uppercase tracking-wide text-slate-muted'>
              <span>Selesai</span>
              <span>Proses</span>
              <span>Antrean</span>
            </span>
          </div>

          <div className='flex flex-1 flex-col gap-1.5'>
            {projectAllocations.slice(0, 4).map((p) => (
              <div
                key={`pipe-proj-${p.name}`}
                className='flex flex-1 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2'
              >
                <span className='flex items-center gap-1.5 min-w-0'>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.colorClass}`}
                  />
                  <span
                    className='text-[11.5px] font-semibold text-slate-text truncate'
                    title={p.name}
                  >
                    {p.name}
                  </span>
                </span>
                <span className='grid w-36 shrink-0 grid-cols-3 gap-1 text-right text-[11px] font-bold tabular-nums'>
                  <span className='text-emerald-600'>{p.doneCount}</span>
                  <span className='text-blue-600'>{p.progCount}</span>
                  <span className='text-slate-400'>{p.todoCount}</span>
                </span>
              </div>
            ))}
            {projectAllocations.length > 4 && (
              <span className='text-[10.5px] font-semibold text-slate-muted'>
                +{projectAllocations.length - 4} proyek lain
              </span>
            )}
          </div>

          <div className='mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-[10.5px] font-semibold text-slate-muted'>
            <span>{projectAllocations.length} proyek terpantau</span>
            <span>{inProgressCount + todoCount} tugas belum selesai</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjectAllocations = (maxItems = 3) => (
    <div className='flex flex-col justify-between gap-4 p-5 sm:p-6 bg-slate-50/70 border border-border rounded-2xl flex-1 box-border'>
      <div className='flex flex-col gap-3.5 flex-1'>
        <div className='flex items-center justify-between gap-2 shrink-0'>
          <h3 className='text-[13px] font-bold text-slate-text m-0'>
            Alokasi &amp; Fokus Proyek
          </h3>
          <span className='badge badge-cyan xs'>
            {projectAllocations.length || projectCount || 1} Proyek Aktif
          </span>
        </div>

        {projectAllocations.length > 0 ? (
          <div className='flex flex-col gap-2.5 shrink-0'>
            {projectAllocations.slice(0, maxItems).map((p) => {
              const allocWidthStyle: React.CSSProperties = {
                width: `${Math.max(6, p.pct)}%`,
              };
              return (
                <div
                  key={`proj-alloc-${p.name}`}
                  className='flex flex-col gap-2 p-3 sm:p-3.5 bg-surface border border-border rounded-xl shadow-2xs shrink-0 transition-all hover:border-slate-300 hover:shadow-xs'
                >
                  <div className='flex items-center justify-between gap-2 min-w-0'>
                    <div className='flex items-center gap-2 min-w-0 flex-1 overflow-hidden'>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${p.colorClass}`}
                      />
                      <span
                        className='text-xs font-bold text-slate-text truncate block'
                        title={p.name}
                      >
                        {p.name}
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-[11.5px] shrink-0 whitespace-nowrap'>
                      <span className='font-bold text-slate-text'>
                        {p.hoursFormatted}h
                      </span>
                      <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-text-2'>
                        {p.pct}%
                      </span>
                    </div>
                  </div>

                  <div className='w-full h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0'>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${p.colorClass}`}
                      style={allocWidthStyle}
                    />
                  </div>

                  <div className='flex items-center justify-between gap-2 text-[10.5px] text-slate-muted leading-snug'>
                    <span>
                      {p.doneCount} dari {p.count} tugas selesai
                    </span>
                    <span className='font-bold text-slate-text'>
                      {p.taskPct}% tuntas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='py-6 px-3 text-center text-xs text-slate-text-3 my-auto'>
            <CheckCircle2
              size={24}
              className='text-emerald-600 mb-1.5 inline-block'
            />
            <div className='font-semibold text-xs text-slate-text'>
              Belum Ada Alokasi Proyek
            </div>
            <p className='text-[11px] text-slate-muted mt-1 mb-0'>
              Log waktu dan status tugas Taiga akan otomatis terpetakan di sini.
            </p>
          </div>
        )}
      </div>

      {projectAllocations.length > 0 && (
        <div className='flex items-center justify-between pt-2.5 border-t border-border/60 text-[11px] text-slate-text-2 mt-auto shrink-0'>
          <span>
            Total <strong>{projectAllocations.length} proyek</strong> terpetakan
          </span>
          <Link
            href='/workload'
            className='inline-flex items-center gap-1 font-bold text-brand hover:underline'
            title='Lihat detail beban kerja di Workload'
          >
            <span>Detail Workload</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <section
      className='card flex flex-col gap-5'
      aria-label='Taiga Tasks dan Delivery Pipeline'
    >
      <div className='flex items-center justify-between pb-3.5 border-b border-border flex-wrap gap-3'>
        <div className='flex items-center gap-2.5'>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-base font-bold tracking-tight text-slate-text'>
                {isMonitoring ? 'Taiga Tasks & Delivery Hub' : 'Taiga Tasks'}
              </h2>
            </div>
            <span className='text-xs text-slate-muted font-medium mt-0.5 block'>
              {isMonitoring
                ? 'Monitoring komprehensif pipeline delivery, daftar tugas aktif tim, dan alokasi proyek'
                : 'Monitoring pipeline delivery dan tren aktivitas'}
            </span>
          </div>
        </div>
      </div>

      {isDisconnected ? (
        <div className='py-2 pb-4 w-full'>
          <EmptyState
            tone='purple'
            icon={<CheckCircle2 size={24} />}
            title='Layanan Taiga Tidak Terhubung'
            description='Koneksikan token sesi Taiga SSO di menu Pengaturan untuk memantau pipeline delivery, status story, dan tren penyelesaian tugas tim.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline max-w-full text-center whitespace-normal h-auto min-h-10.5 py-2 px-4 text-[13px] leading-snug'
                id='btn-taiga-settings'
              >
                <Settings size={15} className='shrink-0' />
                <span>Konfigurasi Taiga di Pengaturan</span>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {!isMonitoring && <TaigaReleaseNoteSection />}

          {/* Task Delivery KPIs */}
          {isMonitoring ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 bg-surface-subtle border border-border rounded-2xl p-5 sm:p-6'>
              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Story &amp; Task
                </span>
                <span className='text-[17px] font-extrabold text-slate-text truncate'>
                  {totalTasks} Item
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  {doneCount} Selesai
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Delivery Rate
                </span>
                <span className='text-[17px] font-extrabold truncate text-emerald-600'>
                  {donePct}%
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  {inProgressCount} Dalam Proses
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Tugas Aktif
                </span>
                <span className='text-[17px] font-extrabold truncate text-purple-600'>
                  {activeTasks.length}
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  {todoCount} Antrean
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Rata-Rata Durasi
                </span>
                <span className='text-[17px] font-extrabold truncate text-brand'>
                  {avgHoursPerTask}h
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  Per Aktivitas
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Proyek Terpetakan
                </span>
                <span className='text-[17px] font-extrabold truncate text-violet-600'>
                  {projectAllocations.length || projectCount || 0} Proyek
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  Alokasi Tim
                </span>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-subtle border border-border rounded-2xl p-5 sm:p-6'>
              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Story &amp; Task
                </span>
                <span className='text-[17px] font-extrabold text-slate-text truncate'>
                  {totalTasks} Item
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  {doneCount} Selesai
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Delivery
                </span>
                <span className='text-[17px] font-extrabold truncate text-emerald-600'>
                  {donePct}%
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  0 Blocker
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Rata-Rata
                </span>
                <span className='text-[17px] font-extrabold truncate text-brand'>
                  {avgHoursPerTask}h
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  Per Aktivitas
                </span>
              </div>

              <div className='flex flex-col justify-between min-h-18 gap-1.5'>
                <span className='text-[10.5px] font-bold text-slate-muted uppercase tracking-wider'>
                  Proyek Aktif
                </span>
                <span className='text-[17px] font-extrabold truncate text-violet-600'>
                  {projectCount || 1}
                </span>
                <span className='text-[11.5px] text-slate-muted truncate'>
                  Alokasi Terfokus
                </span>
              </div>
            </div>
          )}

          {/* Visual Charts & Allocations */}
          {isMonitoring ? (
            <>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch'>
                <div className='flex flex-col gap-4'>
                  {renderPipelineFlow(true)}
                </div>
                <div className='flex flex-col'>
                  {renderProjectAllocations(5)}
                </div>
              </div>

              {/* Rich In-Flight Active Tasks List */}
              <TaigaActiveTasksList
                tasks={activeTasks}
                totalActiveCount={activeTasks.length}
              />
            </>
          ) : (
            <>
              {renderPipelineFlow()}
              {renderProjectAllocations(3)}
            </>
          )}

        </>
      )}
    </section>
  );
}
