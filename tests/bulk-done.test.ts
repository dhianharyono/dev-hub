import { describe, it, expect } from 'vitest';
import {
  buildBulkDonePlan,
  pickDoneStatus,
} from '../src/app/tasks/board/bulk-done';
import type { AssignedTaskItem } from '../src/app/api/taiga/assigned/route';
import type { Status } from '../src/app/tasks/board/types';

function task(
  id: number,
  activityDate: string | null,
  extra: Partial<AssignedTaskItem> = {},
): AssignedTaskItem {
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
    ...extra,
  };
}

const status = (
  id: number,
  name: string,
  isClosed: boolean,
): Status => ({
  id,
  name,
  color: '#000000',
  is_closed: isClosed,
});

const projectStatuses: Record<number, Status[]> = {
  1: [status(1, 'New', false), status(5, 'Done', true)],
  2: [status(1, 'New', false), status(6, 'Cancelled', true)],
  3: [status(1, 'New', false)],
};

describe('bulk done helper', () => {
  it('includes active tasks of every date, not only today', () => {
    const plan = buildBulkDonePlan(
      [
        task(1, '2026-11-12'),
        task(2, '2026-11-13T08:30:00.000Z'),
        task(3, '2026-11-20'),
        task(4, null),
      ],
      projectStatuses,
    );

    expect(plan.targets.map((t) => t.task.id)).toEqual([1, 2, 3, 4]);
    expect(plan.alreadyClosed).toBe(0);
    expect(plan.withoutDoneStatus).toBe(0);
  });

  it('skips tasks that are already closed', () => {
    const plan = buildBulkDonePlan(
      [
        task(1, '2026-11-12'),
        task(2, '2026-11-20', { isClosed: true }),
        task(3, '2026-11-13', {
          statusExtraInfo: { name: 'Done', color: '#000', is_closed: true },
        }),
      ],
      projectStatuses,
    );

    expect(plan.targets.map((t) => t.task.id)).toEqual([1]);
    expect(plan.alreadyClosed).toBe(2);
  });

  it('marks tasks of projects without a closed status as skipped', () => {
    const plan = buildBulkDonePlan(
      [task(1, '2026-11-12', { projectId: 3 })],
      projectStatuses,
    );

    expect(plan.targets).toEqual([]);
    expect(plan.withoutDoneStatus).toBe(1);
  });

  it('prefers a status named Done over another closed status', () => {
    expect(pickDoneStatus(projectStatuses[2])?.id).toBe(6);
  });

  it('prefers Done when several closed statuses exist', () => {
    const statuses = [
      status(1, 'New', false),
      status(6, 'Cancelled', true),
      status(7, 'Done', true),
    ];
    expect(pickDoneStatus(statuses)?.id).toBe(7);
  });

  it('falls back to the first closed status when nothing is named Done', () => {
    const statuses = [status(1, 'New', false), status(8, 'Archived', true)];
    expect(pickDoneStatus(statuses)?.id).toBe(8);
  });

  it('returns an empty plan when the board has no task', () => {
    const plan = buildBulkDonePlan([], projectStatuses);

    expect(plan.targets).toEqual([]);
    expect(plan.alreadyClosed).toBe(0);
    expect(plan.withoutDoneStatus).toBe(0);
  });
});
