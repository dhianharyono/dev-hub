'use client';

import { useState, useEffect } from 'react';
import type { WorkloadDaySummary, HealerSuggestion, MetaData, HealerDetectedCommit } from './types';
import { normalizeMeta } from './types';

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
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<HealerSuggestion[]>([]);
  const [detectedCommits, setDetectedCommits] = useState<HealerDetectedCommit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

    try {
      let curMeta = meta;
      if (!curMeta?.projectId) {
        try {
          const mRes = await fetch('/api/taiga/meta');
          if (mRes.ok) {
            const raw = await mRes.json();
            curMeta = normalizeMeta(raw);
            if (curMeta) setMeta(curMeta);
          }
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/workload/timesheet-healer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: theDate,
          missingHours: theHours,
          userStories: (curMeta?.userStories ?? []).map((u) => ({
            id: u.id,
            ref: u.ref,
            subject: u.subject,
          })),
          projectSlug: curMeta?.projectSlug,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error || 'Gagal menghasilkan saran task dengan AI',
        );
      }

      setSuggestions(json.suggestions || []);
      setDetectedCommits(json.commits || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // Otomatis jalankan saran task AI berbasis GitLab commit saat modal dibuka atau tanggal berubah
  useEffect(() => {
    if (!isOpen || !activeDay?.date) return;

    let isCancelled = false;
    const theDate = activeDay.date;
    const theHours = missingHours;

    const timer = setTimeout(() => {
      if (!isCancelled) {
        handleGenerate(theDate, theHours);
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeDay?.date, missingHours]);

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
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
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

      setSuccessMsg(
        `Berhasil membuat ${suggestions.length} task di Taiga (Status: In Progress & di-assign ke Anda) serta mengisi jam WAD!`,
      );
      setSuggestions([]);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    meta,
    generating,
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
    handleAddManualSuggestion,
    handleSubmitToTaiga,
  };
}
