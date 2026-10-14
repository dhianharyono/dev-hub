'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatTaskSubject } from '@/lib/task-utils';
import {
  type Draft,
  type Result,
  getTodayDateString,
  uid,
} from './types';
import { useAssignedTasks } from './useAssignedTasks';
import { useDrafts } from './useDrafts';
import { useTaigaMeta } from './useTaigaMeta';
import { useNotification } from '@/components/Notification';

export function useSmartTask() {
  const { notify } = useNotification();
  const metaState = useTaigaMeta();
  const assignedState = useAssignedTasks();

  const [mode, setMode] = useState<'auto' | 'userstory' | 'task'>('task');
  const [parentId, setParentId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [source, setSource] = useState<'gemini' | 'fallback' | null>(null);

  const [activeTab, setActiveTab] = useState<'smart' | 'bulk'>('smart');
  const [bulkPasteInput, setBulkPasteInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  const draftsState = useDrafts(parentId, mode);

  const { fetchAssignedTasks } = assignedState;
  const { setMeta, setMetaError, setLoadingMeta, setProjectSlug, setSprintSlug } = metaState;

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      const savedProj = localStorage.getItem('devhub_active_project') ?? undefined;
      const q = new URLSearchParams();
      if (savedProj) q.set('project', savedProj);
      try {
        const [metaRes] = await Promise.all([
          fetch(`/api/taiga/meta?${q.toString()}`),
          fetchAssignedTasks(true),
        ]);
        if (!ignore) {
          const metaJson = await metaRes.json();
          if (metaRes.ok) {
            setMeta(metaJson);
            setProjectSlug(metaJson.project?.slug ?? '');
            setSprintSlug(metaJson.sprint?.slug ?? '');
          } else {
            setMetaError(metaJson.error);
          }
        }
      } catch (e) {
        if (!ignore) setMetaError((e as Error).message);
      } finally {
        if (!ignore) setLoadingMeta(false);
      }
    };
    init();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusesFor = useCallback(
    (kind: Draft['kind']) =>
      (kind === 'task' ? metaState.meta?.taskStatuses : metaState.meta?.usStatuses) ?? [],
    [metaState.meta],
  );

  async function parse() {
    if (input.trim().length < 3) return;
    setParsing(true);
    setParseError(null);
    setResults(null);
    try {
      const allStatuses = [
        ...new Set(
          [...(metaState.meta?.usStatuses ?? []), ...(metaState.meta?.taskStatuses ?? [])].map(
            (s) => s.name,
          ),
        ),
      ];
      const r = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          mode,
          defaultParentId: parentId,
          userStories: (metaState.meta?.userStories ?? []).map(({ id, ref, subject }) => ({
            id,
            ref,
            subject,
          })),
          statuses: allStatuses,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSource(j.source);
      const newItems: Draft[] = (
        j.items as Array<{
          kind: Draft['kind'];
          subject: string;
          description: string;
          parentUserStoryId: number | null;
          statusName: string | null;
          estimateHours: number | null;
        }>
      ).map((it) => {
        const st = (
          it.kind === 'task' ? metaState.meta?.taskStatuses : metaState.meta?.usStatuses
        )?.find((s) => s.name === it.statusName);
        return {
          key: uid(),
          selected: true,
          kind: it.kind,
          subject: formatTaskSubject(it.subject),
          description: it.description,
          userStoryId: it.parentUserStoryId ?? parentId,
          statusId: st?.id ?? null,
          assignToMe: true,
          tags: [],
          estimateHours: it.estimateHours,
          activityDate: getTodayDateString(),
          startTime: '09:00',
          totalTimeSpentMinutes:
            it.estimateHours != null ? Math.round(it.estimateHours * 60) : 60,
        };
      });
      draftsState.setDrafts((prev) => [...prev, ...newItems]);
    } catch (e) {
      setParseError((e as Error).message);
    } finally {
      setParsing(false);
    }
  }

  const handleBulkPasteAdd = () => {
    if (!bulkPasteInput.trim()) return;
    const lines = bulkPasteInput
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\s\-*•\d.)\]>]+/, '').trim())
      .filter((l) => l.length > 1);

    const generated: Draft[] = lines.map((line) => {
      const estMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(?:jam|j|h|hours?)\b/i);
      const cleanSubject = line
        .replace(/\(?\s*\d+(?:[.,]\d+)?\s*(?:jam|j|h|hours?)\b\s*\)?/i, '')
        .trim();
      const subject = formatTaskSubject(
        cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1),
      );
      const est = estMatch ? Number(estMatch[1].replace(',', '.')) : null;
      return {
        key: uid(),
        selected: true,
        kind: mode === 'userstory' ? 'userstory' : 'task',
        subject: subject.slice(0, 90),
        description: est ? `Estimasi: ${est} jam` : '',
        userStoryId: parentId,
        statusId: null,
        assignToMe: true,
        tags: [],
        estimateHours: est,
        activityDate: getTodayDateString(),
        startTime: '09:00',
        totalTimeSpentMinutes: est != null ? Math.round(est * 60) : 60,
      };
    });

    draftsState.setDrafts((prev) => [...prev, ...generated]);
    setBulkPasteInput('');
    setActiveTab('smart');
  };

  async function submit() {
    if (!metaState.meta || !draftsState.selectedDrafts.length || draftsState.invalid) return;
    setSubmitting(true);
    setResults(null);
    setSubmitProgress(
      `Menyiapkan pengiriman ${draftsState.selectedDrafts.length} task ke Taiga...`,
    );

    const toSubmit = draftsState.selectedDrafts;
    const okKeys = new Set<string>();

    try {
      const res = await fetch('/api/taiga/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: metaState.meta.project.id,
          projectSlug: metaState.meta.project.slug,
          milestoneId: metaState.meta.sprint?.id ?? null,
          rawInput: input,
          items: toSubmit.map((d) => ({
            kind: d.kind,
            subject: d.subject.trim(),
            description: d.description,
            userStoryId: d.kind === 'task' ? d.userStoryId : null,
            statusId: d.statusId,
            assignedTo: d.assignToMe ? metaState.meta?.me.id : null,
            tags: [],
            activityDate: d.activityDate,
            startTime: d.startTime,
            totalTimeSpentMinutes: d.totalTimeSpentMinutes,
          })),
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      const apiResults = j.results as Result[];
      setResults(apiResults);

      apiResults.forEach((r, idx) => {
        if (r.ok) okKeys.add(toSubmit[idx]?.key);
      });

      const okCount = okKeys.size;
      const failCount = apiResults.length - okCount;

      if (failCount === 0 && okCount > 0) {
        notify.success(
          `Berhasil membuat ${okCount} item di Taiga.`,
          'Submit Berhasil',
        );
      } else if (okCount > 0 && failCount > 0) {
        notify.warning(
          `Berhasil membuat ${okCount} item, namun ${failCount} item gagal dibuat.`,
          'Submit Sebagian',
        );
      } else if (failCount > 0) {
        notify.error(
          'Semua item dalam antrean gagal dibuat ke Taiga.',
          'Submit Gagal',
        );
      }

      draftsState.setDrafts((ds) => ds.filter((d) => !okKeys.has(d.key)));

      if (okKeys.size > 0) {
        setInput('');
        assignedState.fetchAssignedTasks(assignedState.assignedActiveOnly);
        if (toSubmit.some((d) => d.kind === 'userstory')) {
          metaState.loadMeta(metaState.projectSlug, metaState.sprintSlug);
        }
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      notify.error(errMsg, 'Gagal Mengirim Batch');
      setResults([
        {
          ok: false,
          subject: 'Gagal mengirim batch',
          error: errMsg,
        },
      ]);
    } finally {
      setSubmitting(false);
      setSubmitProgress(null);
    }
  }

  return {
    ...metaState,
    ...assignedState,
    ...draftsState,
    mode,
    setMode,
    parentId,
    setParentId,
    input,
    setInput,
    parsing,
    parseError,
    source,
    activeTab,
    setActiveTab,
    bulkPasteInput,
    setBulkPasteInput,
    submitting,
    submitProgress,
    results,
    statusesFor,
    parse,
    handleBulkPasteAdd,
    submit,
  };
}
