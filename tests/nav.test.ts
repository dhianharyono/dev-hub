import { describe, expect, it } from 'vitest';
import { PRIMARY_NAV } from '../src/components/Sidebar';
import { filterNavByMode } from '../src/lib/nav';

const labelsFor = (isMonitoring: boolean) =>
  filterNavByMode(PRIMARY_NAV, isMonitoring).map((item) => item.label);

describe('Sidebar navigation per app mode', () => {
  it('shows the Release Note menu in developer mode', () => {
    expect(labelsFor(false)).toEqual([
      'Dashboard',
      'Smart Task',
      'Productivity Monitor',
      'Release Note',
      'Workload Analysis',
      'Pengaturan',
    ]);
  });

  it('hides Productivity Monitor and Release Note in monitoring mode', () => {
    expect(labelsFor(true)).toEqual([
      'Dashboard',
      'Smart Task',
      'Workload Analysis',
      'Pengaturan',
    ]);
  });
});
