'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { WorkloadData, WorkloadDaySummary } from '@/lib/workload';

export function useWorkload() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [isHealerOpen, setIsHealerOpen] = useState(false);
  const [healerDay, setHealerDay] = useState<WorkloadDaySummary | null>(null);

  // Search & Filter for table
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const [, startTransition] = useTransition();

  const refreshData = async (m = selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workload?month=${encodeURIComponent(m)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data workload');
      startTransition(() => {
        setData(j);
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch(`/api/workload?month=${encodeURIComponent(selectedMonth)}`)
      .then(async (res) => {
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Gagal memuat data workload');
        if (!ignore) {
          setData(j);
          setLoading(false);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!ignore) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedMonth]);

  // Reset page when filter or month changes
  const filterKey = `${search}|${filterProject}|${filterStatus}|${selectedMonth}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const availableProjects = useMemo(() => {
    return Array.from(
      new Set((data?.tasks || []).map((t) => t.project.toUpperCase())),
    );
  }, [data?.tasks]);

  return {
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
  };
}
