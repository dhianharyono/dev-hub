import { describe, expect, it } from 'vitest';
import {
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
    status: { name: 'Done', color: '#A8E440', isClosed: true },
    url: 'https://taiga.example.com/project/SPA/task/74561',
    ...overrides,
  };
}

describe('edit release note', () => {
  it('mengambil nilai awal editor dari task', () => {
    expect(toTaskDrafts([task()])).toEqual([
      {
        id: 804338,
        subject: '[FE] Deployment Staging',
        description: '',
        statusId: 11,
      },
    ]);
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
