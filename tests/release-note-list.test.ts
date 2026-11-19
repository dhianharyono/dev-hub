import { describe, expect, it } from 'vitest';
import {
  emptyReleaseNoteList,
  isAssignedTo,
  sortReleaseNotes,
  toReleaseNoteSummary,
  type ReleaseNoteSummary,
} from '../src/lib/release-note/model';

const ctx = { baseUrl: 'https://taiga.example.com', projectSlug: 'SPA' };

function story(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    ref: 12487,
    subject: '[CT] (19/11) Deployment Checklist Release Tracker',
    status: 10,
    status_extra_info: { name: 'Ready', color: '#51A3D3' },
    milestone: null,
    milestone_extra_info: { name: 'Sprint 56' },
    is_closed: false,
    created_date: '2026-11-18T10:00:00Z',
    modified_date: '2026-11-18T12:00:00Z',
    ...overrides,
  };
}

describe('release note list', () => {
  it('memetakan user story Taiga menjadi baris daftar', () => {
    const note = toReleaseNoteSummary(story(), ctx, 'Staging');
    expect(note).toMatchObject({
      id: 1,
      ref: 12487,
      subject: '[CT] (19/11) Deployment Checklist Release Tracker',
      source: 'Staging',
      milestone: 'Sprint 56',
      url: 'https://taiga.example.com/project/SPA/us/12487',
    });
    expect(note.status).toEqual({
      name: 'Ready',
      color: '#51A3D3',
      isClosed: false,
    });
  });

  it('memakai nilai cadangan saat status tidak dikenal', () => {
    const note = toReleaseNoteSummary(
      story({ status_extra_info: undefined, milestone_extra_info: null }),
      ctx,
      'Production',
    );
    expect(note.status).toEqual({
      name: 'Unknown',
      color: '#94a3b8',
      isClosed: false,
    });
    expect(note.milestone).toBeNull();
  });

  it('menandai cerita tertutup meski status belum menutup', () => {
    const note = toReleaseNoteSummary(story({ is_closed: true }), ctx, 'Staging');
    expect(note.status.isClosed).toBe(true);
  });

  it('memakai milestone_name saat extra info tidak tersedia', () => {
    const note = toReleaseNoteSummary(
      story({ milestone_extra_info: null, milestone_name: 'Sprint 60' }),
      ctx,
      'Production',
    );
    expect(note.milestone).toBe('Sprint 60');
  });

  it('hanya menerima tiket milik user login', () => {
    expect(isAssignedTo({ assigned_to: 693 }, 693)).toBe(true);
    expect(isAssignedTo({ assigned_to: 12 }, 693)).toBe(false);
    expect(isAssignedTo({ assigned_to: null }, 693)).toBe(false);
    expect(
      isAssignedTo({ assigned_to: 12, assigned_users: [12, 693] }, 693),
    ).toBe(true);
    expect(
      isAssignedTo({ assigned_to: null, assigned_users: [12] }, 693),
    ).toBe(false);
  });

  it('mengembalikan daftar kosong saat sesi belum ada', () => {
    const list = emptyReleaseNoteList([
      { source: 'Staging', epicRef: 67174 },
      { source: 'Production', epicRef: 67170 },
    ]);
    expect(list.needsLogin).toBe(true);
    expect(list.notes).toEqual([]);
    expect(list.project).toBeNull();
    expect(list.assignee).toBeNull();
    expect(list.epics.map((epic) => epic.count)).toEqual([0, 0]);
  });

  it('mengurutkan catatan dari yang terbaru dibuat', () => {
    const base = toReleaseNoteSummary(story(), ctx, 'Staging');
    const older: ReleaseNoteSummary = {
      ...base,
      ref: 100,
      createdDate: '2026-11-01T09:00:00Z',
      modifiedDate: '2026-11-25T09:00:00Z',
    };
    const newer: ReleaseNoteSummary = {
      ...base,
      ref: 200,
      createdDate: '2026-11-20T09:00:00Z',
      modifiedDate: '2026-11-21T09:00:00Z',
    };
    expect(sortReleaseNotes([older, base, newer]).map((n) => n.ref)).toEqual([
      200, 12487, 100,
    ]);
  });
});
