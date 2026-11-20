import { describe, expect, it } from 'vitest';
import {
  buildDeploymentDraft,
  canonicalSquad,
  parseReleaseNoteSubject,
  releaseDateFromSubject,
} from '../src/lib/release-deployment/from-note';
import type { ReleaseNoteDetail } from '../src/lib/release-note/model';

function note(overrides: Partial<ReleaseNoteDetail> = {}): ReleaseNoteDetail {
  return {
    id: 768826,
    ref: 74560,
    subject: '[Dakocan] (18/11) Deployment Checklist Enhancement Kurasi Produk',
    source: 'Staging',
    status: { name: 'Done', color: '#A8E440', isClosed: true },
    milestone: null,
    createdDate: '2026-11-18T06:21:18.203Z',
    modifiedDate: '2026-11-18T06:34:20.092Z',
    url: 'https://taiga.example.com/project/SPA/us/74560',
    description: 'Tambahkan filter tanggal upload.',
    tasks: [
      {
        id: 804338,
        ref: 74561,
        subject: '[FE] Deployment Staging',
        status: { name: 'Done', color: '#A8E440', isClosed: true },
        url: 'https://taiga.example.com/project/SPA/task/74561',
      },
    ],
    ...overrides,
  };
}

describe('release note ke form deployment', () => {
  it('memecah judul menjadi skuad, tanggal, dan nama fitur', () => {
    expect(
      parseReleaseNoteSubject(
        '[Dakocan] (18/11) Deployment Checklist Enhancement Kurasi Produk',
      ),
    ).toEqual({
      squad: 'Dakocan',
      day: 18,
      month: 11,
      featureName: 'Enhancement Kurasi Produk',
    });
  });

  it('menerima judul tanpa tanda kurung tanggal dan tanggal satu digit', () => {
    expect(
      parseReleaseNoteSubject(
        '[Control Tower] 07/10 Deployment Checklist (Security Hardening) Phase 1',
      ),
    ).toMatchObject({ day: 7, month: 10, featureName: '(Security Hardening) Phase 1' });

    expect(
      parseReleaseNoteSubject(
        '[CT] (13/7) Deployment Checklist Fix Field Search Pada Menu Kelola Pengguna',
      ),
    ).toMatchObject({ day: 13, month: 7, featureName: 'Fix Field Search Pada Menu Kelola Pengguna' });
  });

  it('membuang awalan Deployment Checklist dan spasi ganda', () => {
    expect(
      parseReleaseNoteSubject('[Control Tower] (12/10) Deployment Checklist: VAPT')
        .featureName,
    ).toBe('VAPT');
    expect(
      parseReleaseNoteSubject(
        '[Control Tower] 24/07 Deployment Checklist  Add dynamic brand name',
      ).featureName,
    ).toBe('Add dynamic brand name');
    expect(
      parseReleaseNoteSubject(
        '[Dakocan] (17/11) Deployment Kurasi Produk & Release Tracker (Integrasi BigQuery)',
      ).featureName,
    ).toBe('Kurasi Produk & Release Tracker (Integrasi BigQuery)');
  });

  it('memakai seluruh judul bila format tidak dikenali', () => {
    expect(parseReleaseNoteSubject('Deployment tanpa judul baku')).toEqual({
      squad: '',
      day: null,
      month: null,
      featureName: 'Deployment tanpa judul baku',
    });
  });

  it('menyamakan skuad dengan pilihan form', () => {
    expect(canonicalSquad('ct')).toBe('Control Tower');
    expect(canonicalSquad('Control Tower')).toBe('Control Tower');
    expect(canonicalSquad('payment')).toBe('Payment');
    expect(canonicalSquad('Dakocan')).toBe('');
    expect(canonicalSquad('')).toBe('');
  });

  it('menyusun tanggal release dan menyeberang tahun bila perlu', () => {
    expect(releaseDateFromSubject({ day: 18, month: 11 }, '2026-11-18T06:21:18Z')).toBe(
      '2026-11-18',
    );
    expect(releaseDateFromSubject({ day: 2, month: 1 }, '2025-12-28T06:21:18Z')).toBe(
      '2026-01-02',
    );
    expect(releaseDateFromSubject({ day: null, month: null }, '2026-11-18T06:21:18Z')).toBe(
      '',
    );
  });

  it('membangun draft production beserta story dan task Taiga', () => {
    const draft = buildDeploymentDraft(
      note({
        source: 'Production',
        subject: '[Dakocan] (17/11) Deployment Kurasi Produk & Release Tracker',
      }),
    );

    expect(draft.form).toEqual({
      target: 'production',
      squad: '',
      releaseDate: '2026-11-17',
      featureName: 'Kurasi Produk & Release Tracker',
      subject: '[Dakocan] (17/11) Deployment Kurasi Produk & Release Tracker',
      description: 'Tambahkan filter tanggal upload.',
      assigneeId: null,
    });
    expect(draft.created.story).toEqual({
      id: 768826,
      ref: 74560,
      url: 'https://taiga.example.com/project/SPA/us/74560',
    });
    expect(draft.created.tasks).toEqual([
      {
        subject: '[FE] Deployment Staging',
        ok: true,
        ref: 74561,
        url: 'https://taiga.example.com/project/SPA/task/74561',
      },
    ]);
  });

  it('mengisi skuad untuk release note staging yang cocok dengan pilihan form', () => {
    const draft = buildDeploymentDraft(
      note({ subject: '[Control Tower] (12/10) Deployment Checklist: VAPT' }),
    );
    expect(draft.form.target).toBe('staging');
    expect(draft.form.squad).toBe('Control Tower');
    expect(draft.form.featureName).toBe('VAPT');
  });
});
