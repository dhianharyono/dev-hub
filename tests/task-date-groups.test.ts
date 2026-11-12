import { describe, it, expect } from 'vitest';
import {
  formatTaskDateLabel,
  groupTasksByDate,
  toDateKey,
} from '../src/app/tasks/board/task-date-groups';
import type { AssignedTaskItem } from '../src/app/api/taiga/assigned/route';

function task(id: number, activityDate?: string | null): AssignedTaskItem {
  return {
    id,
    ref: id,
    subject: `Task ${id}`,
    status: 1,
    statusExtraInfo: { name: 'New', color: '#000000', is_closed: false },
    projectId: 1,
    projectName: 'Project',
    projectSlug: 'project',
    userStory: null,
    milestoneSlug: null,
    isClosed: false,
    hours: null,
    activityDate,
    createdDate: '2026-11-01T00:00:00.000Z',
    modifiedDate: '2026-11-01T00:00:00.000Z',
    url: 'https://tree.taiga.io/project/project/task/1',
  };
}

const today = new Date(2026, 10, 12, 10, 0, 0);

describe('task date groups', () => {
  it('normalizes stored activity dates to YYYY-MM-DD', () => {
    expect(toDateKey('2026-11-12')).toBe('2026-11-12');
    expect(toDateKey('2026-11-12T08:30:00.000Z')).toBe('2026-11-12');
    expect(toDateKey(null)).toBeNull();
    expect(toDateKey('12/11/2026')).toBeNull();
  });

  it('labels today, tomorrow, yesterday, and other dates', () => {
    expect(formatTaskDateLabel('2026-11-12', today)).toBe('Hari ini');
    expect(formatTaskDateLabel('2026-11-13', today)).toBe('Besok');
    expect(formatTaskDateLabel('2026-11-11', today)).toBe('Kemarin');
    expect(formatTaskDateLabel('2026-11-20', today)).toContain('20 November 2026');
    expect(formatTaskDateLabel(null, today)).toBe('Tanpa tanggal');
  });

  it('keeps tasks of different dates in separate groups', () => {
    const groups = groupTasksByDate(
      [task(2, '2026-11-13'), task(1, '2026-11-12'), task(3, '2026-11-12')],
      today,
    );

    expect(groups.map((g) => g.label)).toEqual(['Hari ini', 'Besok']);
    expect(groups[0].tasks.map((t) => t.id)).toEqual([1, 3]);
    expect(groups[1].tasks.map((t) => t.id)).toEqual([2]);
  });

  it('orders groups as today, upcoming, past, then undated', () => {
    const groups = groupTasksByDate(
      [
        task(1, '2026-11-20'),
        task(2, '2026-11-13'),
        task(3, '2026-11-12'),
        task(4, '2026-11-10'),
        task(5, '2026-11-05'),
        task(6, null),
        task(7, 'not-a-date'),
      ],
      today,
    );

    expect(groups.map((g) => g.key)).toEqual([
      '2026-11-12',
      '2026-11-13',
      '2026-11-20',
      '2026-11-10',
      '2026-11-05',
      'no-date',
    ]);
    expect(groups[5].tasks.map((t) => t.id)).toEqual([6, 7]);
  });
});
