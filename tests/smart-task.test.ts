import { describe, it, expect } from 'vitest';
import { formatTaskSubject } from '../src/lib/task-utils';
import { fallbackParse } from '../src/lib/ai';

describe('Smart Task Formatting & Prompt Hygiene', () => {
  it('formats Daily Standup into [Meeting] Daily Standup DD/MM', () => {
    // With specific date
    expect(formatTaskSubject('daily standup tim (0.5 jam)', '05/10')).toBe(
      '[Meeting] Daily Standup 05/10',
    );
    expect(formatTaskSubject('pagi daily standup 15mnt', '05/10')).toBe(
      '[Meeting] Daily Standup 05/10',
    );
    expect(formatTaskSubject('standup pagi tim frontend', '05/10')).toBe(
      '[Meeting] Daily Standup 05/10',
    );
    expect(formatTaskSubject('Daily Standup 06/10', '05/10')).toBe(
      '[Meeting] Daily Standup 06/10',
    );
    expect(formatTaskSubject('[Meeting] Daily Standup 05/10')).toBe(
      '[Meeting] Daily Standup 05/10',
    );
  });

  it('prefixes all meeting types with [Meeting]', () => {
    expect(formatTaskSubject('Menghadiri meeting sprint planning')).toBe(
      '[Meeting] Sprint planning',
    );
    expect(
      formatTaskSubject('Sync arsitektur backend dengan tim infra'),
    ).toBe('[Meeting] Sync arsitektur backend dengan tim infra');
    expect(formatTaskSubject('Sprint Retrospective Sprint 42')).toBe(
      '[Meeting] Sprint Retrospective Sprint 42',
    );
    expect(formatTaskSubject('Grooming backlog sprint 43')).toBe(
      '[Meeting] Grooming backlog sprint 43',
    );
    expect(formatTaskSubject('Koordinasi payment gateway dengan vendor')).toBe(
      '[Meeting] Koordinasi payment gateway dengan vendor',
    );
    expect(formatTaskSubject('[Meeting] 1-on-1 dengan Tech Lead')).toBe(
      '[Meeting] 1-on-1 dengan Tech Lead',
    );
  });

  it('leaves non-meeting technical tasks untouched', () => {
    expect(formatTaskSubject('Fix bug login expired di PadiUMKM')).toBe(
      'Fix bug login expired di PadiUMKM',
    );
    expect(formatTaskSubject('Review MR mycarrier api-contract')).toBe(
      'Review MR mycarrier api-contract',
    );
    expect(formatTaskSubject('Integrasi endpoint payment gateway')).toBe(
      'Integrasi endpoint payment gateway',
    );
  });

  it('ensures fallbackParse formats subjects and clears tags', () => {
    const input = `1. Daily standup tim (0.5 jam)
2. Fix bug login expired (2 jam)
3. Sync arsitektur mycarrier (1 jam)`;

    const items = fallbackParse(input, { mode: 'task', defaultParentId: 10 });
    expect(items.length).toBe(3);
    expect(items[0].subject).toContain('[Meeting] Daily Standup');
    expect(items[0].tags).toEqual([]);
    expect(items[1].subject).toBe('Fix bug login expired');
    expect(items[1].tags).toEqual([]);
    expect(items[2].subject).toBe('[Meeting] Sync arsitektur mycarrier');
    expect(items[2].tags).toEqual([]);
  });
});
