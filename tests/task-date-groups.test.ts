import { describe, it, expect } from 'vitest';
import {
  formatTaskDateLabel,
  groupTasksByDate,
  paginateDateGroups,
  toDateKey,
  DAYS_PER_PAGE,
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

  it('paginates whole days and never splits a day across pages', () => {
    const tasks: AssignedTaskItem[] = [];
    for (let day = 1; day <= 10; day++) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      for (let n = 1; n <= 4; n++) tasks.push(task(day * 10 + n, date));
    }
    const groups = groupTasksByDate(tasks, today);

    const first = paginateDateGroups(groups, 1, DAYS_PER_PAGE);
    const second = paginateDateGroups(groups, 2, DAYS_PER_PAGE);

    expect(first.groups).toHaveLength(7);
    expect(first.groups.every((g) => g.tasks.length === 4)).toBe(true);
    expect(first.taskCount).toBe(28);
    expect(first.startIndex).toBe(1);
    expect(first.endIndex).toBe(28);
    expect(second.groups).toHaveLength(3);
    expect(second.taskCount).toBe(12);
    expect(second.startIndex).toBe(29);
    expect(second.endIndex).toBe(40);
    expect(second.totalPages).toBe(2);
  });

  it('keeps all tasks of a day on one page', () => {
    const groups = groupTasksByDate(
      [task(1, '2026-11-12'), task(2, '2026-11-12'), task(3, '2026-11-12')],
      today,
    );
    const pageData = paginateDateGroups(groups, 1, 1);

    expect(pageData.groups).toHaveLength(1);
    expect(pageData.groups[0].tasks.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('clamps the page and handles an empty board', () => {
    const empty = paginateDateGroups([], 3);
    expect(empty.totalPages).toBe(1);
    expect(empty.page).toBe(1);
    expect(empty.startIndex).toBe(0);
    expect(empty.endIndex).toBe(0);

    const groups = groupTasksByDate([task(1, '2026-11-12')], today);
    expect(paginateDateGroups(groups, 99).page).toBe(1);
  });
});
