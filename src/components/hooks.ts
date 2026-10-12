"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LoadedMetrics } from "@/lib/stats";

export type MetricsData = LoadedMetrics;

export interface SyncStatus {
  running: boolean;
  phase: string;
  done: number;
  total: number;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  log: string[];
  summary?: { projects: number; commits: number; mrs: number; events: number; pipelines: number; projectErrors: number };
}

export function useMetrics(days: number) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/gitlab/stats?days=${d}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const r = await fetch(`/api/gitlab/stats?days=${days}`);
        const j = await r.json();
        if (!ignore) {
          if (!r.ok) throw new Error(j.error);
          setData(j);
        }
      } catch (e) {
        if (!ignore) setError((e as Error).message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [days]);

  const reload = useCallback(() => fetchMetrics(days), [fetchMetrics, days]);

  return { data, loading, error, reload };
}

export function useSync(onDone?: () => void) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasRunning = useRef(false);
  const activeSession = useRef(false);

  const poll = useCallback(async () => {
    const r = await fetch("/api/gitlab/sync");
    const s = (await r.json()) as SyncStatus;
    if (s.running || activeSession.current) {
      setStatus(s);
    }
    if (wasRunning.current && !s.running) {
      wasRunning.current = false;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      onDone?.();
    }
    if (s.running) {
      wasRunning.current = true;
      activeSession.current = true;
    }
    return s;
  }, [onDone]);

  const watch = useCallback(() => {
    if (timer.current) return;
    timer.current = setInterval(poll, 1200);
  }, [poll]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/gitlab/sync")
      .then((r) => r.json())
      .then((s: SyncStatus) => {
        if (!ignore) {
          // If a sync was actively running on the server when the page opened/refreshed, monitor it
          if (s.running) {
            activeSession.current = true;
            wasRunning.current = true;
            setStatus(s);
            watch();
          }
          // If s.running is false, it's a finished sync from the past - do NOT display it on page load
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [watch]);

  const start = useCallback(
    async (days: number, full = false) => {
      activeSession.current = true;
      wasRunning.current = true;
      const r = await fetch(`/api/gitlab/sync?days=${days}${full ? "&full=1" : ""}`, { method: "POST" });
      setStatus(await r.json());
      watch();
    },
    [watch],
  );

  return { status, start };
}

export interface IntegrationServiceStatus {
  connected: boolean;
  configured: boolean;
  username?: string;
  error?: string;
}

export interface IntegrationStatus {
  gitlab: IntegrationServiceStatus;
  taiga: IntegrationServiceStatus;
  wad: IntegrationServiceStatus;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/integrations/status${force ? '?force=1' : ''}`);
      if (res.ok) {
        const data = (await res.json()) as IntegrationStatus;
        setIntegrations(data);
      }
    } catch {
      // Keep previous state or fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/integrations/status');
        if (!ignore && res.ok) {
          const data = (await res.json()) as IntegrationStatus;
          setIntegrations(data);
        }
      } catch {
        // Silently catch
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStatus();
    return () => {
      ignore = true;
    };
  }, []);

  return { integrations, loading, refresh };
}

