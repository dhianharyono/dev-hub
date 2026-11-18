import { describe, expect, it } from 'vitest';
import {
  FORM_FIELDS,
  FORM_SERVICE_FIELDS,
  buildFormAnswers,
  missingRequiredFields,
} from '../src/lib/release-deployment/form';
import { buildFillScript } from '../src/lib/release-deployment/fill-script';
import type { DeploymentFormInput } from '../src/lib/release-deployment/model';

function input(
  overrides: Partial<DeploymentFormInput> = {},
): DeploymentFormInput {
  return {
    judul: 'Release Tracker',
    tiket: 'SPA-us-4821',
    squad: 'Control Tower',
    environment: 'Staging',
    picDeveloper: 'Dhian Haryono',
    picQa: ['Fabiola Matara'],
    picHoe: 'Budi Hari Sulaksono',
    deployDate: '2026-11-19',
    deployTime: '14:00',
    deployTimeBe: '14:00',
    deployTimeFe: '14:30',
    envVault: '',
    envVaultBe: '',
    envVaultFe: '',
    databaseTypes: [],
    databaseName: '',
    tableName: '',
    columnName: '',
    databaseDescription: '',
    kafkaMessage: '',
    kafkaConsumer: '',
    kafkaProducer: '',
    kafkaTopic: '',
    services: [],
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
    expect(answerFor(answers, FORM_FIELDS.ticket.id)?.value).toBe('SPA-us-4821');
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

  it('tidak mengirim field yang kosong', () => {
    const answers = buildFormAnswers(
      input({ deployTime: '', deployTimeBe: '', deployTimeFe: '' }),
    );

    expect(answerFor(answers, FORM_FIELDS.deployTime.id)).toBeUndefined();
    expect(answerFor(answers, FORM_FIELDS.deployTimeBe.id)).toBeUndefined();
    expect(answerFor(answers, FORM_FIELDS.deployTimeFe.id)).toBeUndefined();
  });

  it('mengisi kedua pertanyaan database yang judulnya sama', () => {
    const answers = buildFormAnswers(
      input({
        databaseTypes: ['PostgreSQL'],
        databaseName: 'ms-core',
        tableName: 'orders',
        columnName: 'status',
        databaseDescription: 'Tambah kolom status',
      }),
    );

    for (const id of [
      'r50fd3d69ff5d468cb9b2286f59d161b7',
      'rbb7c438b60684d43acac19129d1bbf8a',
    ]) {
      expect(answerFor(answers, id)?.value).toEqual(['PostgreSQL']);
    }
    for (const id of [
      'r9a2c4d4a2d6b419f885f7f37de251495',
      'r8b22b2429d5d4cf6a09806e1cd87fbca',
    ]) {
      expect(answerFor(answers, id)?.value).toBe('ms-core');
    }
    for (const id of [
      'r5c8ccb197b8f403b997d51749879d516',
      'r818f9d7a471d4d349d492e71de417b9b',
    ]) {
      expect(answerFor(answers, id)?.value).toBe('orders');
    }
    for (const id of [
      'r5d90946e1c7b4c0e9962f2169c21be02',
      'rca97995d77784b0d9962ed20feb76060',
    ]) {
      expect(answerFor(answers, id)?.value).toBe('status');
    }
    for (const id of [
      'r5595c8a7c69e4f0ea01d9b998cf2e283',
      'ra363f35b9c364d77bfb781bd899be603',
    ]) {
      expect(answerFor(answers, id)?.value).toBe('Tambah kolom status');
    }
  });

  it('memetakan link MR ke pertanyaan service yang sesuai', () => {
    const service = FORM_SERVICE_FIELDS.find(
      (field) => field.name === 'ms-core',
    );
    const answers = buildFormAnswers(
      input({
        services: [
          { id: 'svc-1', service: 'ms-core', url: 'https://gitlab/!1' },
          { id: 'svc-2', service: 'tidak-ada', url: 'https://gitlab/!2' },
          { id: 'svc-3', service: 'ms-order', url: '   ' },
        ],
      }),
    );

    expect(answerFor(answers, service!.id)?.value).toBe('https://gitlab/!1');
    expect(answers.filter((answer) => answer.value === 'https://gitlab/!2')).toEqual(
      [],
    );
    expect(answers.filter((answer) => answer.title === 'Service ms-order')).toEqual(
      [],
    );
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
