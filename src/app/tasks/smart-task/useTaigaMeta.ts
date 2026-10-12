'use client';

import { useCallback, useState } from 'react';
import type { Meta } from './types';

export function useTaigaMeta() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [projectSlug, setProjectSlug] = useState<string>('');
  const [sprintSlug, setSprintSlug] = useState<string>('');

  const loadMeta = useCallback(async (proj?: string, sprint?: string) => {
    setLoadingMeta(true);
    setMetaError(null);
    try {
      const q = new URLSearchParams();
      if (proj) q.set('project', proj);
      if (sprint) q.set('sprint', sprint);
      const r = await fetch(`/api/taiga/meta?${q.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMeta(j);
      setProjectSlug(j.project?.slug ?? '');
      setSprintSlug(j.sprint?.slug ?? '');
    } catch (e) {
      setMetaError((e as Error).message);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const handleProjectChange = useCallback(
    (newSlug: string, onResetParent?: () => void) => {
      setProjectSlug(newSlug);
      localStorage.setItem('devhub_active_project', newSlug);
      onResetParent?.();
      setSprintSlug('');
      loadMeta(newSlug);
    },
    [loadMeta],
  );

  const handleSprintChange = useCallback(
    (newSprintSlug: string, onResetParent?: () => void) => {
      setSprintSlug(newSprintSlug);
      onResetParent?.();
      loadMeta(projectSlug, newSprintSlug);
    },
    [loadMeta, projectSlug],
  );

  return {
    meta,
    setMeta,
    metaError,
    setMetaError,
    loadingMeta,
    setLoadingMeta,
    projectSlug,
    setProjectSlug,
    sprintSlug,
    setSprintSlug,
    loadMeta,
    handleProjectChange,
    handleSprintChange,
  };
}
