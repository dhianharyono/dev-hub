'use client';

import { useMemo, useState } from 'react';
import { type Draft, getTodayDateString, uid } from './types';

export function useDrafts(defaultParentId: number | null, defaultMode: 'auto' | 'userstory' | 'task') {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const addBlank = (count = 1) => {
    const blanks: Draft[] = Array.from({ length: count }, () => ({
      key: uid(),
      selected: true,
      kind: defaultMode === 'userstory' ? 'userstory' : 'task',
      subject: '',
      description: '',
      userStoryId: defaultParentId,
      statusId: null,
      assignToMe: true,
      tags: [],
      estimateHours: 1,
      activityDate: getTodayDateString(),
      startTime: '09:00',
      totalTimeSpentMinutes: 60,
    }));
    setDrafts((ds) => [...ds, ...blanks]);
  };

  const updateDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const removeDraft = (key: string) =>
    setDrafts((ds) => ds.filter((d) => d.key !== key));

  const selectedDrafts = useMemo(
    () => drafts.filter((d) => d.selected),
    [drafts],
  );

  const allSelected = drafts.length > 0 && selectedDrafts.length === drafts.length;

  const toggleSelectAll = () => {
    const next = !allSelected;
    setDrafts((ds) => ds.map((d) => ({ ...d, selected: next })));
  };

  const bulkSetUserStory = (usId: number | null) =>
    setDrafts((ds) => ds.map((d) => (d.selected ? { ...d, userStoryId: usId } : d)));

  const bulkSetStatus = (stId: number | null) =>
    setDrafts((ds) => ds.map((d) => (d.selected ? { ...d, statusId: stId } : d)));

  const bulkSetDate = (date: string) =>
    setDrafts((ds) => ds.map((d) => (d.selected ? { ...d, activityDate: date } : d)));

  const bulkSetStartTime = (time: string) =>
    setDrafts((ds) => ds.map((d) => (d.selected ? { ...d, startTime: time } : d)));

  const bulkDeleteSelected = () =>
    setDrafts((ds) => ds.filter((d) => !d.selected));

  const totalHours = useMemo(
    () => selectedDrafts.reduce((sum, d) => sum + (d.estimateHours ?? 0), 0),
    [selectedDrafts],
  );

  const invalid = useMemo(
    () => selectedDrafts.some((d) => !d.subject.trim()),
    [selectedDrafts],
  );

  return {
    drafts,
    setDrafts,
    addBlank,
    updateDraft,
    removeDraft,
    selectedDrafts,
    allSelected,
    toggleSelectAll,
    bulkSetUserStory,
    bulkSetStatus,
    bulkSetDate,
    bulkSetStartTime,
    bulkDeleteSelected,
    totalHours,
    invalid,
  };
}
