import { describe, expect, it } from 'vitest';
import {
  buildNewTaskItem,
  changedTaskUpdates,
  toTaskDrafts,
} from '../src/lib/release-note/edit';
import type { ReleaseNoteTask } from '../src/lib/release-note/model';

function task(overrides: Partial<ReleaseNoteTask> = {}): ReleaseNoteTask {
  return {
    id: 804338,
    ref: 74561,
    subject: '[FE] Deployment Staging',
    description: '',
    statusId: 11,
    activityDate: '2026-11-18',
    startTime: '09:00',
    totalTimeSpentMinutes: 60,
    status: { name: 'Done', color: '#A8E440', isClosed: true },
    url: 'https://taiga.example.com/project/SPA/task/74561',
    ...overrides,
  };
}

describe('edit release note', () => {
  it('mengambil nilai awal editor dari task, termasuk timesheet', () => {
    expect(toTaskDrafts([task()])).toEqual([
      {
        id: 804338,
        subject: '[FE] Deployment Staging',
        description: '',
        statusId: 11,
        activityDate: '2026-11-18',
        startTime: '09:00',
        totalTimeSpentMinutes: 60,
      },
    ]);
  });

  it('memakai nilai timesheet kosong bila task belum punya', () => {
    const drafts = toTaskDrafts([
      task({
        activityDate: undefined,
        startTime: undefined,
        totalTimeSpentMinutes: undefined,
      }),
    ]);
    expect(drafts[0]).toMatchObject({
      activityDate: '',
      startTime: '',
      totalTimeSpentMinutes: null,
    });
  });

  it('tidak mengirim task yang tidak berubah', () => {
    const original = [task()];
    const drafts = toTaskDrafts(original);
    expect(changedTaskUpdates(original, drafts)).toEqual([]);
  });

  it('mengirim hanya task yang berubah', () => {
    const original = [
      task(),
      task({ id: 804339, ref: 74562, subject: '[BE] Deployment Staging' }),
    ];
    const drafts = toTaskDrafts(original);
    drafts[0] = { ...drafts[0], subject: ' [FE] Deployment Production ' };
    drafts[1] = { ...drafts[1], description: 'cek migrasi' };

    expect(changedTaskUpdates(original, drafts)).toEqual([
      {
        taskId: 804338,
        subject: '[FE] Deployment Production',
        description: '',
        statusId: 11,
      },
      {
        taskId: 804339,
        subject: '[BE] Deployment Staging',
        description: 'cek migrasi',
        statusId: 11,
      },
    ]);
  });

  it('mengirim timesheet hanya saat tanggal, jam, atau durasi berubah', () => {
    const original = [task()];
    const drafts = toTaskDrafts(original);
    drafts[0] = {
      ...drafts[0],
      activityDate: '2026-11-19',
      startTime: '10:30',
      totalTimeSpentMinutes: 90,
    };

    expect(changedTaskUpdates(original, drafts)).toEqual([
      {
        taskId: 804338,
        subject: '[FE] Deployment Staging',
        description: '',
        statusId: 11,
        activityDate: '2026-11-19',
        startTime: '10:30',
        totalTimeSpentMinutes: 90,
      },
    ]);
  });

  it('mengirim ulang timesheet yang sama bila task diubah karena field lain', () => {
    const original = [task()];
    const drafts = toTaskDrafts(original);
    drafts[0] = { ...drafts[0], activityDate: '2026-11-19' };

    expect(changedTaskUpdates(original, drafts)).toEqual([
      {
        taskId: 804338,
        subject: '[FE] Deployment Staging',
        description: '',
        statusId: 11,
        activityDate: '2026-11-19',
        startTime: '09:00',
        totalTimeSpentMinutes: 60,
      },
    ]);
  });

  it('mengabaikan status kosong dan judul kosong', () => {
    const original = [task()];
    const drafts = toTaskDrafts(original);

    expect(
      changedTaskUpdates(original, [{ ...drafts[0], statusId: 0 }]),
    ).toEqual([]);
    expect(
      changedTaskUpdates(original, [{ ...drafts[0], subject: '   ' }]),
    ).toEqual([]);
  });
});

describe('tambah task release note', () => {
  const empty = {
    subject: '  Deployment Production Baru  ',
    description: '',
    statusId: 0,
    activityDate: '',
    startTime: '',
    totalTimeSpentMinutes: null,
  };

  it('mengirim subject terpotong dan terhubung ke user story', () => {
    expect(buildNewTaskItem(768826, empty)).toEqual({
      kind: 'task',
      subject: 'Deployment Production Baru',
      userStoryId: 768826,
    });
  });

  it('mengirim status, deskripsi, dan timesheet bila diisi', () => {
    expect(
      buildNewTaskItem(768826, {
        ...empty,
        description: 'cek deploy',
        statusId: 1813,
        activityDate: '2026-11-20',
        startTime: '10:00',
        totalTimeSpentMinutes: 45,
      }),
    ).toEqual({
      kind: 'task',
      subject: 'Deployment Production Baru',
      userStoryId: 768826,
      description: 'cek deploy',
      statusId: 1813,
      activityDate: '2026-11-20',
      startTime: '10:00',
      totalTimeSpentMinutes: 45,
    });
  });

  it('mengirim durasi nol bila diisi eksplisit', () => {
    expect(
      buildNewTaskItem(768826, { ...empty, totalTimeSpentMinutes: 0 }),
    ).toEqual({
      kind: 'task',
      subject: 'Deployment Production Baru',
      userStoryId: 768826,
      totalTimeSpentMinutes: 0,
    });
  });
});
