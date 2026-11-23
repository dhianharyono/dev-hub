'use client';

import { useEffect, useState, useCallback } from 'react';
import { useIntegrations, useMetrics, useSync } from '@/components/hooks';
import { triggerTelemetryRefresh } from '@/components/SidebarTelemetry';
import { useAppMode } from '@/components/AppModeContext';
import type { WorkloadData } from '@/lib/workload';
import type { Scorecard } from '@/lib/scoring';
import { GitlabVelocityCard } from './dashboard/GitlabVelocityCard';
import { RightActivityPanel } from './dashboard/RightActivityPanel';
import { TaigaDeliveryCard } from './dashboard/TaigaDeliveryCard';
import { WadAnalyticsCard } from './dashboard/WadAnalyticsCard';
import { WorkloadCalendarCard } from './dashboard/WorkloadCalendarCard';

export default function Home() {
  const { isMonitoring } = useAppMode();

  const { integrations, loading: integrationsLoading } = useIntegrations();
  const gitlabConnected = Boolean(integrations?.gitlab?.connected);
  const taigaConnected = Boolean(integrations?.taiga?.connected);

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [workloadLoading, setWorkloadLoading] = useState(true);
  const [velocityDays, setVelocityDays] = useState<number>(0);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    reload: reloadMetrics,
  } = useMetrics(velocityDays, 'identity');

  const loadScorecardData = useCallback(async (d: number) => {
    try {
      const r = await fetch(`/api/gitlab/score?days=${d}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setScorecard(j as Scorecard);
    } catch {
      setScorecard(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadScorecardData(velocityDays);
  }, [velocityDays, loadScorecardData]);

  const handleGitlabSyncDone = useCallback(() => {
    reloadMetrics();
    loadScorecardData(velocityDays);
    triggerTelemetryRefresh();
  }, [reloadMetrics, loadScorecardData, velocityDays]);
  const { status: gitlabSyncStatus, start: startGitlabSync } =
    useSync(handleGitlabSyncDone);

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
          <div className='flex items-center gap-2.5'>
            <h1 className='text-xl font-extrabold tracking-tight text-slate-text'>
              {isMonitoring
                ? 'Dashboard Monitoring'
                : 'Dashboard Produktivitas'}
            </h1>
          </div>
          <p className='text-slate-muted mt-1 text-sm'>
            {isMonitoring
              ? 'Monitoring komprehensif kepatuhan jam kerja WAD dan efisiensi delivery tugas Taiga.'
              : 'Monitoring komprehensif kepatuhan jam kerja WAD, velocity rilis GitLab, dan efisiensi delivery tugas Taiga.'}
          </p>
        </div>
      </header>

      <WadAnalyticsCard
        workload={workload}
        connected={taigaConnected}
        loading={effectiveWorkloadLoading}
      />

      {isMonitoring ? (
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
      ) : (
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <GitlabVelocityCard
            metrics={metrics}
            scorecard={scorecard}
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
      )}

      <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-stretch xl:h-[740px]'>
        <div className='min-h-0 xl:h-full'>
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
        />
      </div>
    </div>
  );
}
