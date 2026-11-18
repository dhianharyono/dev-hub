import { describe, expect, it } from 'vitest';
import {
  DEPLOYMENT_FORM_URL,
  FORM_FIELDS,
  FORM_SECTION_ORDER,
  FORM_SERVICE_FIELDS,
  buildFormAnswers,
  isDeploymentFormUrl,
  missingRequiredFields,
  resolveDeploymentFormUrl,
} from '../src/lib/release-deployment/form';
import { buildFillScript } from '../src/lib/release-deployment/fill-script';
import type { DeploymentFormInput } from '../src/lib/release-deployment/model';

function input(
  overrides: Partial<DeploymentFormInput> = {},
): DeploymentFormInput {
  return {
    judul: 'Release Tracker',
    tiket: 'https://tree.taiga.io/project/spa/us/4821',
    squad: 'Control Tower',
    environment: 'Staging',
    picDeveloper: 'Dhian Haryono',
    picQa: ['Fabiola Matara'],
    picHoe: 'Budi Hari Sulaksono',
    deployDate: '2026-11-19',
    deployTime: '',
    deployTimeBe: '14:00',
    deployTimeFe: '14:30',
    deployTimeMobile: '',
    envVault: '',
    envVaultBe: '',
    envVaultFe: '',
    databaseTypes: [],
    databaseName: '',
    tableName: '',
    columnName: '',
    databaseDescription: '',
    fullstackDatabaseTypes: [],
    fullstackDatabaseName: '',
    fullstackTableName: '',
    fullstackColumnName: '',
    fullstackDatabaseDescription: '',
    firestore: '',
    linkApk: '',
    kafkaMessage: '',
    kafkaConsumer: '',
    kafkaProducer: '',
    kafkaTopic: '',
    services: {},
    ...overrides,
  };
}

function answerFor(answers: ReturnType<typeof buildFormAnswers>, id: string) {
  return answers.find((answer) => answer.id === id);
}

describe('buildFormAnswers', () => {
  it('memetakan field wajib memakai id pertanyaan', () => {
    const answers = buildFormAnswers(input());

    expect(answerFor(answers, FORM_FIELDS.environment.id)?.value).toEqual([
      'Staging',
    ]);
    expect(answerFor(answers, FORM_FIELDS.squad.id)?.value).toEqual([
      'Control Tower',
    ]);
    expect(answerFor(answers, FORM_FIELDS.ticket.id)?.value).toBe(
      'https://tree.taiga.io/project/spa/us/4821',
    );
    expect(answerFor(answers, FORM_FIELDS.releaseTitle.id)?.value).toBe(
      'Release Tracker',
    );
    expect(answerFor(answers, FORM_FIELDS.picQa.id)?.value).toEqual([
      'Fabiola Matara',
    ]);
    expect(answerFor(answers, FORM_FIELDS.deployDate.id)).toMatchObject({
      kind: 'date',
      value: '2026-11-19',
    });
  });

  it('hanya mengirim satu field PIC Developer berupa pilihan', () => {
    const answers = buildFormAnswers(input());
    const picDevelopers = answers.filter(
      (answer) => answer.title === 'PIC Developer',
    );

    expect(picDevelopers).toHaveLength(1);
    expect(picDevelopers[0]).toMatchObject({
      id: FORM_FIELDS.picDeveloper.id,
      kind: 'choice',
      value: ['Dhian Haryono'],
    });
  });

  it('mengelompokkan jawaban sesuai section dan urutan form', () => {
    const answers = buildFormAnswers(
      input({
        services: { 'ms-core': 'https://gitlab/!1', 'fe-buyer': 'https://gitlab/!2' },
      }),
    );
    const sections = answers.map((answer) => answer.section);
    const expectedOrder = [...FORM_SECTION_ORDER];

    expect(sections).toEqual(
      [...sections].sort(
        (a, b) => expectedOrder.indexOf(a) - expectedOrder.indexOf(b),
      ),
    );

    const umum = answers
      .filter((answer) => answer.section === 'Umum')
      .map((answer) => answer.title);
    expect(umum).toEqual([
      'Tanggal Deploy',
      'Skuad',
      'Environment',
      'Judul Release Dev',
      'Tiket Taiga Deployment Checklist Dev',
      'PIC HoE',
      'PIC Developer',
      'PIC Software Quality Assurance',
    ]);

    const backend = answers.filter(
      (answer) => answer.section === 'Technical Backend',
    );
    expect(backend[0].title).toBe('Waktu Deploy BE');
    expect(backend.find((answer) => answer.title === 'Service ms-core')).toBeTruthy();
    expect(
      answers.some(
        (answer) =>
          answer.section === 'Technical Frontend' &&
          answer.title === 'Service fe-buyer',
      ),
    ).toBe(true);
  });

  it('tidak mengirim field yang kosong', () => {
    const answers = buildFormAnswers(
      input({ deployTime: '', deployTimeBe: '', deployTimeFe: '' }),
    );

    expect(answerFor(answers, FORM_FIELDS.deployTime.id)).toBeUndefined();
    expect(answerFor(answers, FORM_FIELDS.deployTimeBe.id)).toBeUndefined();
    expect(answerFor(answers, FORM_FIELDS.deployTimeFe.id)).toBeUndefined();
  });

  it('memisahkan pertanyaan database Backend dan Fullstack yang judulnya sama', () => {
    const answers = buildFormAnswers(
      input({
        databaseTypes: ['PostgreSQL'],
        databaseName: 'ms-core',
        tableName: 'orders',
        columnName: 'status',
        databaseDescription: 'Tambah kolom status',
        fullstackDatabaseTypes: ['MongoDB'],
        fullstackDatabaseName: 'dashboard',
        fullstackTableName: 'releases',
        fullstackColumnName: 'stage',
        fullstackDatabaseDescription: 'Tambah kolom stage',
      }),
    );

    const backend = answers.filter(
      (answer) => answer.section === 'Technical Backend',
    );
    const fullstack = answers.filter(
      (answer) => answer.section === 'Technical Fullstack New',
    );

    expect(answerFor(backend, 'r50fd3d69ff5d468cb9b2286f59d161b7')?.value).toEqual([
      'PostgreSQL',
    ]);
    expect(answerFor(backend, 'r9a2c4d4a2d6b419f885f7f37de251495')?.value).toBe(
      'ms-core',
    );
    expect(answerFor(backend, 'r5c8ccb197b8f403b997d51749879d516')?.value).toBe(
      'orders',
    );
    expect(answerFor(backend, 'r5d90946e1c7b4c0e9962f2169c21be02')?.value).toBe(
      'status',
    );
    expect(answerFor(backend, 'r5595c8a7c69e4f0ea01d9b998cf2e283')?.value).toBe(
      'Tambah kolom status',
    );

    expect(
      answerFor(fullstack, 'rbb7c438b60684d43acac19129d1bbf8a')?.value,
    ).toEqual(['MongoDB']);
    expect(answerFor(fullstack, 'r8b22b2429d5d4cf6a09806e1cd87fbca')?.value).toBe(
      'dashboard',
    );
    expect(answerFor(fullstack, 'r818f9d7a471d4d349d492e71de417b9b')?.value).toBe(
      'releases',
    );
    expect(answerFor(fullstack, 'rca97995d77784b0d9962ed20feb76060')?.value).toBe(
      'stage',
    );
    expect(answerFor(fullstack, 'ra363f35b9c364d77bfb781bd899be603')?.value).toBe(
      'Tambah kolom stage',
    );
  });

  it('memetakan link MR ke pertanyaan service pada section yang sesuai', () => {
    const msCore = FORM_SERVICE_FIELDS.find((field) => field.name === 'ms-core');
    const buyer = FORM_SERVICE_FIELDS.find((field) => field.name === 'fe-buyer');
    const answers = buildFormAnswers(
      input({
        services: {
          'ms-core': 'https://gitlab/!1',
          'fe-buyer': 'https://gitlab/!2',
          '  ': 'https://gitlab/!3',
          'ms-order': '   ',
        },
      }),
    );

    expect(answerFor(answers, msCore!.id)).toMatchObject({
      section: 'Technical Backend',
      value: 'https://gitlab/!1',
    });
    expect(answerFor(answers, buyer!.id)).toMatchObject({
      section: 'Technical Frontend',
      value: 'https://gitlab/!2',
    });
    expect(answers.filter((answer) => answer.value === 'https://gitlab/!3')).toEqual(
      [],
    );
    expect(answerFor(answers, 'r1dfd3f6e11e54c84816f69b5e4e73cd3')).toBeUndefined();
  });

  it('melaporkan field wajib yang belum diisi', () => {
    const missing = missingRequiredFields(
      input({ squad: '', picQa: [], picHoe: '', deployDate: '' }),
    );

    expect(missing).toEqual([
      'Skuad',
      'PIC Software Quality Assurance',
      'PIC HoE',
      'Tanggal Deploy',
    ]);
    expect(missingRequiredFields(input())).toEqual([]);
  });

  it('menghasilkan skrip browser yang valid dan membawa jawaban', () => {
    const script = buildFillScript(
      buildFormAnswers(input({ judul: 'Release "Tracker"' })),
    );

    expect(() => new Function(script)).not.toThrow();
    expect(script).toContain(FORM_FIELDS.environment.id);
    expect(script).toContain('Release \\"Tracker\\"');
  });
});

describe('link form deployment', () => {
  it('memakai link bawaan saat setting kosong', () => {
    expect(resolveDeploymentFormUrl('')).toBe(DEPLOYMENT_FORM_URL);
    expect(resolveDeploymentFormUrl('   ')).toBe(DEPLOYMENT_FORM_URL);
  });

  it('memakai nilai setting saat diisi', () => {
    const custom =
      'https://forms.cloud.microsoft/pages/responsepage.aspx?id=abc123';

    expect(resolveDeploymentFormUrl(custom)).toBe(custom);
  });

  it('menerima host form Microsoft dan menolak URL lain', () => {
    expect(
      isDeploymentFormUrl(
        'https://forms.cloud.microsoft/pages/responsepage.aspx?id=abc123',
      ),
    ).toBe(true);
    expect(
      isDeploymentFormUrl(
        'https://forms.office.com/pages/responsepage.aspx?id=abc123',
      ),
    ).toBe(true);
    expect(isDeploymentFormUrl('https://example.com/form')).toBe(false);
    expect(isDeploymentFormUrl('bukan-url')).toBe(false);
  });
});
