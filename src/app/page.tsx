'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntegrations, useMetrics, useSync } from '@/components/hooks';
import type { WorkloadData } from '@/lib/workload';
import { GitlabVelocityCard } from './dashboard/GitlabVelocityCard';
import { RightActivityPanel } from './dashboard/RightActivityPanel';
import { TaigaDeliveryCard } from './dashboard/TaigaDeliveryCard';
import { WadAnalyticsCard } from './dashboard/WadAnalyticsCard';
import { WorkloadCalendarCard } from './dashboard/WorkloadCalendarCard';

export default function Home() {
  const mainColRef = useRef<HTMLElement>(null);
  const calendarCardRef = useRef<HTMLDivElement>(null);
  const [activityPanelHeight, setActivityPanelHeight] = useState<
    number | undefined
  >(undefined);

  const { integrations, loading: integrationsLoading } = useIntegrations();
  const gitlabConnected = Boolean(integrations?.gitlab?.connected);
  const taigaConnected = Boolean(integrations?.taiga?.connected);

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [workloadLoading, setWorkloadLoading] = useState(true);
  const [velocityDays, setVelocityDays] = useState<number>(90);
  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    reload: reloadMetrics,
  } = useMetrics(velocityDays);
  const { status: gitlabSyncStatus, start: startGitlabSync } =
    useSync(reloadMetrics);

  const handleMonthChange = (newMonth: string) => {
    setWorkloadLoading(true);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    let ignore = false;
    fetch(`/api/workload?month=${currentMonth}`)
      .then((r) => {
        if (!r.ok) throw new Error('Workload fetch error');
        return r.json();
      })
      .then((w) => {
        if (!ignore) {
          setWorkload(w);
          setWorkloadLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setWorkload(null);
          setWorkloadLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [currentMonth]);

  useEffect(() => {
    const syncHeight = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth <= 1200) {
        setActivityPanelHeight(undefined);
        return;
      }
      if (mainColRef.current && calendarCardRef.current) {
        const mainHeight = mainColRef.current.offsetHeight;
        const calHeight = calendarCardRef.current.offsetHeight;
        const target = mainHeight - calHeight - 20;
        if (target > 220) {
          setActivityPanelHeight(target);
        }
      }
    };

    const timeout = setTimeout(syncHeight, 60);
    const observer = new ResizeObserver(syncHeight);
    if (mainColRef.current) observer.observe(mainColRef.current);
    if (calendarCardRef.current) observer.observe(calendarCardRef.current);
    window.addEventListener('resize', syncHeight);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, [workload, metrics]);

  const effectiveWorkloadLoading = integrationsLoading || workloadLoading;
  const effectiveMetricsLoading = integrationsLoading || metricsLoading;

  // Taiga Task & Pipeline metrics calculated honestly without dummy fallback numbers
  const todoCount =
    taigaConnected && workload?.statusBreakdown?.todo
      ? workload.statusBreakdown.todo
      : 0;
  const inProgressCount =
    taigaConnected && workload?.statusBreakdown?.inProgress
      ? workload.statusBreakdown.inProgress
      : 0;
  const doneCount = taigaConnected
    ? workload?.statusBreakdown?.done || workload?.kpis?.activitiesCount || 0
    : 0;
  const totalTasks = taigaConnected
    ? todoCount + inProgressCount + doneCount ||
      workload?.kpis?.activitiesCount ||
      0
    : 0;
  const donePct =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const progPct =
    totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
  const todoPct = totalTasks > 0 ? Math.max(0, 100 - donePct - progPct) : 0;

  const projectDistribution =
    taigaConnected && workload?.tasks
      ? Array.from(
          workload.tasks
            .reduce((map, t) => {
              const key = t.projectName || t.project || 'Taiga';
              const cur = map.get(key) || { name: key, count: 0, hours: 0 };
              cur.count += 1;
              cur.hours += t.timeSpentHours || 0;
              map.set(key, cur);
              return map;
            }, new Map<string, { name: string; count: number; hours: number }>())
            .values(),
        )
      : [];

  const activeTasks =
    taigaConnected && workload?.tasks
      ? workload.tasks.filter((t) => {
          if (t.isClosed) return false;
          const s = (t.status || '').toLowerCase();
          return (
            !s.includes('done') &&
            !s.includes('closed') &&
            !s.includes('selesai')
          );
        })
      : [];

  const avgHoursPerTask =
    totalTasks > 0 && workload?.kpis?.timeSpent
      ? (workload.kpis.timeSpent / totalTasks).toFixed(1)
      : '0.0';

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex items-end justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-extrabold tracking-tight text-slate-text'>
            Dashboard Produktivitas
          </h1>
          <p className='text-slate-muted mt-1 text-sm'>
            Monitoring komprehensif kepatuhan jam kerja WAD, velocity rilis
            GitLab, dan efisiensi delivery tugas Taiga.
          </p>
        </div>
      </header>

      <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start'>
        <main ref={mainColRef} className='flex flex-col gap-6 min-w-0'>
          <WadAnalyticsCard
            workload={workload}
            connected={taigaConnected}
            loading={effectiveWorkloadLoading}
          />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
            <GitlabVelocityCard
              metrics={metrics}
              connected={gitlabConnected}
              loading={effectiveMetricsLoading}
              error={metricsError}
              days={velocityDays}
              onDaysChange={setVelocityDays}
              onSync={() => startGitlabSync(velocityDays)}
              isSyncing={Boolean(gitlabSyncStatus?.running)}
            />

            <TaigaDeliveryCard
              workload={workload}
              connected={taigaConnected}
              loading={effectiveWorkloadLoading}
              activeTasks={activeTasks}
              totalTasks={totalTasks}
              doneCount={doneCount}
              inProgressCount={inProgressCount}
              todoCount={todoCount}
              donePct={donePct}
              progPct={progPct}
              todoPct={todoPct}
              avgHoursPerTask={avgHoursPerTask}
              projectCount={projectDistribution.length}
            />
          </div>
        </main>

        <div className='flex flex-col gap-6 w-full xl:w-[400px] shrink-0'>
          <div ref={calendarCardRef}>
            <WorkloadCalendarCard
              workload={workload}
              connected={taigaConnected}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              loading={effectiveWorkloadLoading}
            />
          </div>
          <RightActivityPanel
            workload={workload}
            connected={taigaConnected}
            loading={effectiveWorkloadLoading}
            customHeight={activityPanelHeight}
          />
        </div>
      </div>
    </div>
  );
}
