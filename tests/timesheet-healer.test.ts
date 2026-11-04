import { describe, it, expect } from 'vitest';
import { normalizeMeta, TIME_SLOTS } from '../src/app/workload/healer/types';
import { getCurrentMonthKey } from '../src/app/workload/components/useWorkload';

describe('Timesheet Gap Healer Types & Normalization', () => {
  it('normalizes metadata including projects list, user stories, and task statuses', () => {
    const raw = {
      projectId: 12,
      projectSlug: 'project-alpha',
      milestoneId: 44,
      projects: [
        { id: 12, name: 'Project Alpha', slug: 'project-alpha' },
        { id: 15, name: 'Project Beta', slug: 'project-beta' },
      ],
      userStories: [
        { id: 101, ref: 1, subject: 'Story Alpha 1' },
        { id: 102, ref: 2, subject: 'Story Alpha 2' },
      ],
      taskStatuses: [
        { id: 1, name: 'New' },
        { id: 2, name: 'In Progress' },
        { id: 3, name: 'Closed' },
      ],
    };

    const meta = normalizeMeta(raw);
    expect(meta).not.toBeNull();
    expect(meta?.projectId).toBe(12);
    expect(meta?.projectSlug).toBe('project-alpha');
    expect(meta?.projects.length).toBe(2);
    expect(meta?.projects[0].name).toBe('Project Alpha');
    expect(meta?.projects[1].name).toBe('Project Beta');
    expect(meta?.userStories.length).toBe(2);
    expect(meta?.taskStatuses.length).toBe(3);
  });

  it('includes hourly options in TIME_SLOTS matching smart task', () => {
    expect(TIME_SLOTS).toContain('08:00');
    expect(TIME_SLOTS).toContain('09:00');
    expect(TIME_SLOTS).toContain('12:00');
    expect(TIME_SLOTS).toContain('13:00');
    expect(TIME_SLOTS).toContain('17:00');
    expect(TIME_SLOTS.length).toBeGreaterThanOrEqual(15);
  });

  it('getCurrentMonthKey returns the current month in YYYY-MM format', () => {
    const key = getCurrentMonthKey();
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(key).toBe(expected);
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });
});

