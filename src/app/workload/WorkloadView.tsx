'use client';

import React from 'react';
import Link from 'next/link';
import { FolderGit2, Settings, RefreshCw } from 'lucide-react';
import { useIntegrations } from '@/components/hooks';
import { EmptyState } from '@/components/EmptyState';
import { useNotification } from '@/components/Notification';
import { useAiTask } from '@/components/ai-task/AiTaskContext';
import {
  AssignmentBarChart,
  StatusProgressDonut,
  WorkloadTrendsChart,
} from './WorkloadCharts';
import { TimesheetGapHealerModal } from './TimesheetGapHealerModal';
import { WorkloadActivitiesTable } from './components/WorkloadActivitiesTable';
import { WorkloadAssignmentsAndInsights } from './components/WorkloadAssignmentsAndInsights';
import { WorkloadComplianceSection } from './components/WorkloadComplianceSection';
import { WorkloadHeader } from './components/WorkloadHeader';
import { WorkloadKpiCards } from './components/WorkloadKpiCards';
import { WorkloadProfileCard } from './components/WorkloadProfileCard';
import { WorkloadSkeleton } from './components/WorkloadSkeleton';
import { useWorkload } from './components/useWorkload';

export default function WorkloadView() {
  const {
    data,
    loading,
    setLoading,
    error,
    selectedMonth,
    setSelectedMonth,
    isHealerOpen,
    setIsHealerOpen,
    healerDay,
    setHealerDay,
    search,
    setSearch,
    filterProject,
    setFilterProject,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    refreshData,
    availableProjects,
  } = useWorkload();

  const {
    integrations,
    loading: loadingIntegrations,
    refresh: refreshIntegrations,
  } = useIntegrations();

  const isTaigaConnected = Boolean(integrations?.taiga?.connected);
  const taigaError = integrations?.taiga?.error;
  const { notify } = useNotification();
  const { restoreTarget, clearRestoreTarget } = useAiTask();

  // Restore gap healer modal from floating dock
  React.useEffect(() => {
    if (restoreTarget?.type === 'gap_healer' && data?.days) {
      const targetDay =
        data.days.find((d) => d.date === restoreTarget.date) ||
        data.days.find((d) => d.isWeekday && d.hoursSpent < 7.5) ||
        null;
      setHealerDay(targetDay);
      setIsHealerOpen(true);
      clearRestoreTarget();
    }
  }, [restoreTarget, data?.days, setHealerDay, setIsHealerOpen, clearRestoreTarget]);

  React.useEffect(() => {
    if (isTaigaConnected && error) {
      notify.error(error, 'Workload Analysis');
    }
  }, [isTaigaConnected, error, notify]);

  return (
    <div className='flex flex-col gap-5'>
      <WorkloadHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        loading={loading}
        setLoading={setLoading}
        availableMonths={data?.availableMonths}
        onRefresh={refreshData}
        connected={isTaigaConnected}
      />

      {/* Loading Skeleton */}
      {(loadingIntegrations || (loading && !data && isTaigaConnected)) && (
        <WorkloadSkeleton />
      )}

      {/* Disconnected Negative Case */}
      {!loadingIntegrations && !isTaigaConnected && (
        <EmptyState
          tone='rose'
          icon={<FolderGit2 size={26} strokeWidth={2.2} />}
          title='Layanan Taiga Tidak Terhubung'
          description={
            taigaError
              ? `${taigaError}. Pemantauan beban kerja harian dan kepatuhan jam kerja wajib 8h/hari dihitung langsung dari aktivitas log Taiga. Hubungkan kembali sesi Taiga di menu Pengaturan.`
              : 'Pemantauan beban kerja harian dan kepatuhan jam kerja wajib 8h/hari dihitung langsung dari aktivitas log Taiga. Hubungkan sesi Taiga di menu Pengaturan untuk mengaktifkan pemantauan.'
          }
          action={
            <div className='flex items-center gap-2.5 flex-wrap'>
              <Link
                href='/settings'
                className='btn btn-primary no-underline'
                id='btn-workload-settings'
              >
                <Settings size={15} />
                <span>Konfigurasi Taiga di Pengaturan</span>
              </Link>
              <button
                type='button'
                className='btn btn-ghost border border-border gap-1.5'
                onClick={() => {
                  refreshIntegrations(true);
                  refreshData();
                }}
              >
                <RefreshCw size={14} />
                <span>Periksa Ulang Status</span>
              </button>
            </div>
          }
        />
      )}

      {!loadingIntegrations && isTaigaConnected && data && (
        <WorkloadProfileCard user={data.user} lastUpdated={data.lastUpdated} />
      )}

      {!loadingIntegrations && isTaigaConnected && data && (
        <>
          <WorkloadKpiCards kpis={data.kpis} />

          <WorkloadAssignmentsAndInsights
            assignments={data.assignments}
            insights={data.insights}
          />

          <section className='card animate-fade-up'>
            <div className='card-title mb-4'>
              <span>Workload &amp; Activity Trends</span>
              <span className='xs dim'>
                6 Bulan Terakhir · Bar: Total Aktivitas | Garis Merah: %
                Workload
              </span>
            </div>
            <WorkloadTrendsChart data={data.trends} />
          </section>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-up'>
            <section className='card'>
              <div className='card-title mb-4'>
                <span>Time Spent by Assignment</span>
              </div>
              <AssignmentBarChart assignments={data.assignments} />
            </section>

            <section className='card flex flex-col'>
              <div className='card-title mb-4'>
                <span>Status Progress Activity</span>
              </div>
              <div className='flex-1 flex items-center justify-center min-h-[260px]'>
                <StatusProgressDonut breakdown={data.statusBreakdown} />
              </div>
            </section>
          </div>

          <WorkloadComplianceSection
            days={data.days}
            onOpenHealer={(day) => {
              setHealerDay(day);
              setIsHealerOpen(true);
            }}
          />

          <WorkloadActivitiesTable
            tasks={data.tasks}
            search={search}
            setSearch={setSearch}
            filterProject={filterProject}
            setFilterProject={setFilterProject}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            availableProjects={availableProjects}
            page={page}
            setPage={setPage}
          />
        </>
      )}

      {data && (
        <TimesheetGapHealerModal
          isOpen={isHealerOpen}
          onClose={() => setIsHealerOpen(false)}
          initialDay={healerDay}
          allDays={data.days}
          onSuccess={() => refreshData()}
        />
      )}
    </div>
  );
}
