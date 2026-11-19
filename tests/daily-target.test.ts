import { describe, expect, it } from 'vitest';
import {
  DAILY_TARGET_HOURS,
  formatDailyTargetPill,
  resolveDailyTargetStatus,
} from '../src/lib/workload/daily-target';

describe('daily target status', () => {
  it('memakai target 8 jam per hari', () => {
    expect(DAILY_TARGET_HOURS).toBe(8);
  });

  it('menentukan status dari jam tercover', () => {
    expect(resolveDailyTargetStatus(0)).toBe('empty');
    expect(resolveDailyTargetStatus(0.5)).toBe('under');
    expect(resolveDailyTargetStatus(7.4)).toBe('under');
    expect(resolveDailyTargetStatus(7.5)).toBe('fit');
    expect(resolveDailyTargetStatus(8)).toBe('fit');
    expect(resolveDailyTargetStatus(8.5)).toBe('fit');
    expect(resolveDailyTargetStatus(8.6)).toBe('over');
  });

  it('menyusun teks pill sesuai status', () => {
    expect(formatDailyTargetPill('under', 6)).toBe('Kurang 2 jam');
    expect(formatDailyTargetPill('under', 7.5)).toBe('Kurang 0,5 jam');
    expect(formatDailyTargetPill('fit', 8)).toBe('Sesuai Target (8h)');
    expect(formatDailyTargetPill('over', 9)).toBe('Lembur (>8h)');
    expect(formatDailyTargetPill('empty', 0)).toBe('Belum Ada Task (0h)');
  });
});
