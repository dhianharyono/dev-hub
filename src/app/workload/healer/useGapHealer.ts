import { useState, useEffect, useRef } from 'react';
import type { WorkloadDaySummary, HealerSuggestion, MetaData, HealerDetectedCommit } from './types';
import { normalizeMeta } from './types';
import { useNotification } from '@/components/Notification';
import { useAiTask } from '@/components/ai-task/AiTaskContext';

interface UseGapHealerProps {
  isOpen: boolean;
  activeDay: WorkloadDaySummary | undefined;
  missingHours: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function useGapHealer({
  isOpen,
  activeDay,
  missingHours,
  onSuccess,
  onClose,
}: UseGapHealerProps) {
  const { notify } = useNotification();
  const { runAiTask, getTask, minimizeTask, dismissTask } = useAiTask();
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<HealerSuggestion[]>([]);
  const [detectedCommits, setDetectedCommits] = useState<HealerDetectedCommit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const taskId = `gap-healer-${activeDay?.date || 'default'}`;
  const currentTask = getTask(taskId);
  const isGenerating = generating || currentTask?.status === 'running';
  const lastConsumedTaskIdRef = useRef<string | null>(null);

  // Sync background result - only consume once per task completion so deletions are never overwritten
  useEffect(() => {
    if (
      currentTask?.status === 'completed' &&
      currentTask.result &&
      lastConsumedTaskIdRef.current !== currentTask.id
    ) {
      lastConsumedTaskIdRef.current = currentTask.id;
      const res = currentTask.result as {
        suggestions: HealerSuggestion[];
        commits?: HealerDetectedCommit[];
      };
      if (res.suggestions) setSuggestions(res.suggestions);
      if (res.commits) setDetectedCommits(res.commits);
    }
  }, [currentTask]);

  const handleMinimize = () => {
    minimizeTask(taskId);
  };

  // Load Taiga metadata once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadMeta() {
      try {
        const res = await fetch('/api/taiga/meta');
        if (res.ok && isMounted) {
          const data = await res.json();
          const normalized = normalizeMeta(data);
          if (normalized) {
            setMeta(normalized);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat metadata Taiga:', err);
      }
    }
    loadMeta();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleGenerate = async (targetDate?: string, targetHours?: number) => {
    const theDate = targetDate ?? activeDay?.date;
    const theHours = targetHours ?? missingHours;
    if (!theDate) return;

    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    const taskDate = theDate;
    const taskHours = theHours;
    lastConsumedTaskIdRef.current = null;

    try {
      const result = await runAiTask<{
        suggestions: HealerSuggestion[];
        commits: HealerDetectedCommit[];
      }>({
        id: taskId,
        type: 'gap_healer',
        title: `Timesheet Healer (${taskDate} · ${taskHours} jam)`,
        subtitle: `Menyelaraskan kekurangan jam kerja dengan commit GitLab & Taiga`,
        initialStep: 'Memeriksa metadata Taiga & commit GitLab...',
        params: {
          date: taskDate,
          missingHours: taskHours,
        },
        runner: async (updateStep, signal) => {
          let curMeta = meta;
          if (!curMeta?.projectId) {
            try {
              const mRes = await fetch('/api/taiga/meta', { signal });
              if (mRes.ok) {
                const raw = await mRes.json();
                curMeta = normalizeMeta(raw);
                if (curMeta) setMeta(curMeta);
              }
            } catch {
              // ignore
            }
          }

          updateStep('Menganalisis commit GitLab & merumuskan pengisian gap...', 50);

          const res = await fetch('/api/workload/timesheet-healer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: taskDate,
              missingHours: taskHours,
              userStories: (curMeta?.userStories ?? []).map((u) => ({
                id: u.id,
                ref: u.ref,
                subject: u.subject,
              })),
              projectSlug: curMeta?.projectSlug,
            }),
            signal,
          });

          updateStep('Memproses rekomendasi task Taiga...', 85);

          const json = await res.json();
          if (!res.ok || !json.ok) {
            throw new Error(
              json.error || 'Gagal menghasilkan saran task dengan AI',
            );
          }

          return {
            suggestions: json.suggestions || [],
            commits: json.commits || [],
          };
        },
      });

      if (result) {
        lastConsumedTaskIdRef.current = taskId;
        setSuggestions(result.suggestions || []);
        setDetectedCommits(result.commits || []);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateSuggestion = (
    index: number,
    field: keyof HealerSuggestion,
    value: unknown,
  ) => {
    setSuggestions((prev) => {
      const updated = [...prev];
      const cur = { ...updated[index], [field]: value };
      if (field === 'durationHours') {
        cur.totalTimeSpentMinutes = Math.round(Number(value) * 60);
      }
      updated[index] = cur;
      return updated;
    });
  };

  const handleRemoveSuggestion = (index: number) => {
    setSuggestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setDetectedCommits([]);
        lastConsumedTaskIdRef.current = taskId;
        if (taskId) dismissTask(taskId);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setSuggestions([]);
    setDetectedCommits([]);
    setError(null);
    lastConsumedTaskIdRef.current = taskId;
    if (taskId) {
      dismissTask(taskId);
    }
  };

  const handleAddManualSuggestion = () => {
    const defaultStory = meta?.userStories?.[0]?.id ?? null;
    const newSug: HealerSuggestion = {
      subject: 'Penyesuaian logic dan pengujian komponen',
      description: '- Melakukan verifikasi alur data dan unit test',
      activityDate: activeDay?.date || new Date().toISOString().slice(0, 10),
      startTime: '13:00',
      durationHours: 1.5,
      totalTimeSpentMinutes: 90,
      parentUserStoryId: defaultStory,
      tags: ['refactor'],
    };
    setSuggestions((prev) => [...prev, newSug]);
  };

  const handleSubmitToTaiga = async () => {
    let activeMeta = meta;
    if (!activeMeta?.projectId) {
      try {
        const mRes = await fetch('/api/taiga/meta');
        if (mRes.ok) {
          activeMeta = normalizeMeta(await mRes.json());
          if (activeMeta) setMeta(activeMeta);
        }
      } catch (err) {
        console.warn('Gagal memuat metadata Taiga saat submit:', err);
      }
    }

    if (!activeMeta?.projectId) {
      setError(
        'Metadata Taiga belum tersedia atau belum terhubung di Pengaturan.',
      );
      return;
    }
    if (suggestions.length === 0) {
      setError('Belum ada item task yang akan dikirim.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Cari status 'In Progress' dari daftar taskStatuses Taiga
      const inProgressStatus =
        activeMeta.taskStatuses?.find(
          (s) =>
            /in[\s-_]?progress/i.test(s.name) ||
            (s.slug && /in[\s-_]?progress/i.test(s.slug)) ||
            /sedang[\s-_]?dikerjakan/i.test(s.name) ||
            /progress/i.test(s.name),
        ) ??
        activeMeta.statuses?.find(
          (s) =>
            /in[\s-_]?progress/i.test(s.name) ||
            (s.slug && /in[\s-_]?progress/i.test(s.slug)) ||
            /progress/i.test(s.name),
        );

      const inProgressStatusId = inProgressStatus?.id ?? null;
      const assignedToId = activeMeta.me?.id ?? null;

      const payload = {
        projectId: activeMeta.projectId,
        projectSlug: activeMeta.projectSlug,
        milestoneId: activeMeta.milestoneId,
        rawInput: `Timesheet Gap Healer [${activeDay?.date}]`,
        items: suggestions.map((s) => ({
          kind: 'task' as const,
          subject: s.subject,
          description: s.description,
          userStoryId: s.parentUserStoryId,
          statusId: inProgressStatusId,
          assignedTo: assignedToId,
          activityDate: s.activityDate,
          startTime: s.startTime,
          totalTimeSpentMinutes: s.totalTimeSpentMinutes,
          tags: s.tags,
        })),
      };

      const res = await fetch('/api/taiga/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan task ke Taiga');
      }

      const successText = `Berhasil membuat ${suggestions.length} task di Taiga & mengisi jam kerja WAD!`;
      setSuccessMsg(successText);
      notify.success(successText, 'Timesheet Healer Berhasil');
      setSuggestions([]);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      const errMsg = (e as Error).message;
      setError(errMsg);
      notify.error(errMsg, 'Gagal Mengisi Timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    meta,
    generating: isGenerating,
    handleMinimize,
    taskId,
    submitting,
    suggestions,
    setSuggestions,
    detectedCommits,
    setDetectedCommits,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    handleGenerate,
    handleUpdateSuggestion,
    handleRemoveSuggestion,
    handleClearAll,
    handleAddManualSuggestion,
    handleSubmitToTaiga,
  };
}
