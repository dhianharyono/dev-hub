import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/taiga/client', () => ({
  taiga: vi.fn(),
}));

vi.mock('../src/lib/settings', () => ({
  getSettings: () => ({
    taigaBaseUrl: 'https://taiga.test',
    taigaProjectSlug: 'spa',
  }),
}));

import { taiga } from '../src/lib/taiga/client';
import {
  createItem,
  linkUserStoryToEpic,
  resolveEpicId,
} from '../src/lib/taiga/mutations';

const taigaMock = vi.mocked(taiga);

describe('dukungan epic Taiga', () => {
  beforeEach(() => {
    taigaMock.mockReset();
  });

  it('mencari id epic lewat endpoint by_ref', async () => {
    taigaMock.mockResolvedValueOnce({ id: 7117, ref: 67174 });

    await expect(resolveEpicId(269, 67174)).resolves.toBe(7117);
    expect(taigaMock).toHaveBeenCalledWith('/epics/by_ref?ref=67174&project=269');
    expect(taigaMock).toHaveBeenCalledTimes(1);
  });

  it('memakai daftar epic saat by_ref tidak tersedia', async () => {
    taigaMock
      .mockRejectedValueOnce(new Error('404 Not Found'))
      .mockResolvedValueOnce([
        { id: 7116, ref: 67170 },
        { id: 7117, ref: 67174 },
      ]);

    await expect(resolveEpicId(269, 67174)).resolves.toBe(7117);
    expect(taigaMock).toHaveBeenLastCalledWith('/epics?project=269');
  });

  it('menolak epic yang tidak ada di project', async () => {
    taigaMock
      .mockRejectedValueOnce(new Error('404 Not Found'))
      .mockResolvedValueOnce([]);

    await expect(resolveEpicId(269, 99999)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('menautkan user story ke epic lewat related_userstories', async () => {
    taigaMock.mockResolvedValueOnce(undefined);

    await linkUserStoryToEpic(501, 7117);

    expect(taigaMock).toHaveBeenCalledWith(
      '/epics/7117/related_userstories',
      {
        method: 'POST',
        body: JSON.stringify({ epic: 7117, user_story: 501 }),
      },
    );
  });

  it('membuat user story lalu menautkannya ke epic tujuan', async () => {
    taigaMock.mockImplementation(async (path: string) => {
      if (path === '/userstories') {
        return {
          id: 501,
          ref: 77,
          subject: 'Release',
          project_extra_info: { slug: 'spa' },
        };
      }
      if (path.startsWith('/epics/by_ref')) {
        return { id: 7117, ref: 67174 };
      }
      return undefined;
    });

    const result = await createItem(269, {
      kind: 'userstory',
      subject: '[Control Tower] (19/11) Deployment Checklist Release Tracker',
      assignedTo: 693,
      epicRef: 67174,
    });

    expect(result.epic).toEqual({ id: 7117, ref: 67174 });
    expect(result.url).toBe('https://taiga.test/project/spa/us/77');
    expect(taigaMock).toHaveBeenCalledWith(
      '/epics/7117/related_userstories',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(taigaMock.mock.calls.map(([path]) => path)).toEqual([
      '/userstories',
      '/epics/by_ref?ref=67174&project=269',
      '/epics/7117/related_userstories',
    ]);
  });

  it('tidak menautkan epic bila epicRef tidak diisi', async () => {
    taigaMock.mockResolvedValueOnce({
      id: 502,
      ref: 78,
      subject: 'Tanpa epic',
      project_extra_info: { slug: 'spa' },
    });

    const result = await createItem(269, {
      kind: 'userstory',
      subject: 'Tanpa epic',
    });

    expect(result.epic).toBeNull();
    expect(taigaMock).toHaveBeenCalledTimes(1);
  });
});
