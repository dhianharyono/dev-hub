import { describe, expect, it } from 'vitest';
import {
  RELEASE_TARGETS,
  TASK_TEMPLATES,
  buildStorySubject,
  deploymentTaskPayload,
  formatReleaseDayMonth,
  makeDeploymentTask,
} from '../src/lib/release-deployment/model';

describe('release deployment model', () => {
  it('memformat tanggal release menjadi dd/MM', () => {
    expect(formatReleaseDayMonth('2026-11-19')).toBe('19/11');
    expect(formatReleaseDayMonth('2026-01-05')).toBe('05/01');
    expect(formatReleaseDayMonth('19/11')).toBe('');
  });

  it('menyusun judul user story sesuai format', () => {
    expect(
      buildStorySubject({
        squad: 'Control Tower',
        releaseDate: '2026-11-19',
        featureName: 'Release Tracker',
      }),
    ).toBe('[Control Tower] (19/11) Deployment Checklist Release Tracker');
  });

  it('membuang tanda kutip ganda pada nama fitur', () => {
    expect(
      buildStorySubject({
        squad: 'Core',
        releaseDate: '2026-12-01',
        featureName: '"Filter Status"',
      }),
    ).toBe('[Core] (01/12) Deployment Checklist Filter Status');
  });

  it('mengembalikan string kosong bila isian belum lengkap', () => {
    expect(
      buildStorySubject({ squad: '', releaseDate: '2026-11-19', featureName: 'X' }),
    ).toBe('');
    expect(
      buildStorySubject({ squad: 'Core', releaseDate: '', featureName: 'X' }),
    ).toBe('');
    expect(
      buildStorySubject({ squad: 'Core', releaseDate: '2026-11-19', featureName: '  ' }),
    ).toBe('');
  });

  it('menyediakan tujuh chip template deployment', () => {
    expect(TASK_TEMPLATES.map((template) => template.label)).toEqual([
      '[FE] Deployment',
      '[BE] Deployment',
      'Update Env/Vault',
      'Update Query Database',
      'Verifikasi Build & Smoke Test',
      'Defect Dojo',
      'SonarQube',
    ]);
  });

  it('menandai task template dan memberi id unik', () => {
    const first = makeDeploymentTask('[FE] Deployment', true);
    const second = makeDeploymentTask('Task manual', false);

    expect(first.template).toBe(true);
    expect(second.template).toBe(false);
    expect(first.id).not.toBe(second.id);
  });

  it('mengirim assignee, activity date, start time, dan total time spent bila diisi', () => {
    const task = makeDeploymentTask('[BE] Deployment', true);
    const payload = deploymentTaskPayload({
      ...task,
      assigneeId: 387,
      activityDate: '2026-11-19',
      startTime: '14:00',
      totalTimeSpent: '90',
    });

    expect(payload).toEqual({
      subject: '[BE] Deployment',
      assignedTo: 387,
      activityDate: '2026-11-19',
      startTime: '14:00',
      totalTimeSpentMinutes: 90,
    });
  });

  it('tidak mengirim custom attribute yang kosong', () => {
    const payload = deploymentTaskPayload(
      makeDeploymentTask('Task manual', false),
    );

    expect(payload).toEqual({ subject: 'Task manual' });
    expect(payload.assignedTo).toBeUndefined();
    expect(
      deploymentTaskPayload({
        ...makeDeploymentTask('Task manual', false),
        totalTimeSpent: ' ',
      }).totalTimeSpentMinutes,
    ).toBeUndefined();
  });

  it('memetakan target rilis ke epic dan environment form', () => {
    expect(RELEASE_TARGETS.staging).toMatchObject({
      epicRef: 67174,
      environment: 'Staging',
    });
    expect(RELEASE_TARGETS.production).toMatchObject({
      epicRef: 67170,
      environment: 'Production',
    });
  });
});
