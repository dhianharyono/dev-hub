'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Select } from '@/components/Select';
import {
  RELEASE_TARGETS,
  type DeploymentFormInput,
  type ReleaseCreation,
  type ReleaseStoryForm,
  type ServiceLink,
} from '@/lib/release-deployment/model';
import {
  DATABASE_TYPE_OPTIONS,
  DEPLOYMENT_FORM_URL,
  FORM_SERVICE_FIELDS,
  PIC_DEVELOPER_OPTIONS,
  PIC_HOE_OPTIONS,
  PIC_QA_OPTIONS,
  buildFormAnswers,
  missingRequiredFields,
} from '@/lib/release-deployment/form';

interface DeploymentFormStepProps {
  form: ReleaseStoryForm;
  created: ReleaseCreation;
  projectSlug: string;
  memberName: string;
  onBack: () => void;
}

interface AutofillResponse {
  total: number;
  filled: number;
  results: { id: string; title: string; ok: boolean; reason?: string }[];
}

function makeServiceLink(): ServiceLink {
  return {
    id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    service: '',
    url: '',
  };
}

function initialInput(
  form: ReleaseStoryForm,
  created: ReleaseCreation,
  projectSlug: string,
  memberName: string,
): DeploymentFormInput {
  return {
    judul: form.featureName.trim(),
    tiket: `${projectSlug.toUpperCase()}-us-${created.story.ref}`,
    squad: form.squad,
    environment: RELEASE_TARGETS[form.target].environment,
    picDeveloper: PIC_DEVELOPER_OPTIONS.includes(memberName) ? memberName : '',
    picQa: [],
    picHoe: '',
    deployDate: form.releaseDate,
    deployTime: '',
    deployTimeBe: '',
    deployTimeFe: '',
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
  };
}

export function DeploymentFormStep({
  form,
  created,
  projectSlug,
  memberName,
  onBack,
}: DeploymentFormStepProps) {
  const [input, setInput] = useState<DeploymentFormInput>(() =>
    initialInput(form, created, projectSlug, memberName),
  );
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutofillResponse | null>(null);

  const patch = (changes: Partial<DeploymentFormInput>) => {
    setResult(null);
    setInput((previous) => ({ ...previous, ...changes }));
  };

  const missing = useMemo(() => missingRequiredFields(input), [input]);
  const answers = useMemo(() => buildFormAnswers(input), [input]);

  const toggleList = (
    key: 'picQa' | 'databaseTypes',
    value: string,
  ) => {
    const current = input[key];
    patch({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  const changeService = (id: string, changes: Partial<ServiceLink>) => {
    patch({
      services: input.services.map((service) =>
        service.id === id ? { ...service, ...changes } : service,
      ),
    });
  };

  async function autofill() {
    setFilling(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/release-note/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Gagal menjalankan autofill');
      }
      setResult(data as AutofillResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFilling(false);
    }
  }

  const databaseSummary = [
    input.databaseTypes.join(', '),
    [input.databaseName, input.tableName, input.columnName]
      .filter((value) => value.trim())
      .join(' · '),
  ]
    .filter(Boolean)
    .join(' — ');

  const kafkaSummary = [
    input.kafkaTopic,
    input.kafkaProducer,
    input.kafkaConsumer,
    input.kafkaMessage,
  ]
    .filter((value) => value.trim())
    .join(' · ');

  const summaryRows = [
    { label: 'Skuad', value: input.squad },
    { label: 'Environment', value: input.environment },
    { label: 'Judul Release Dev', value: input.judul },
    { label: 'Tiket Taiga', value: input.tiket },
    {
      label: 'Tanggal & Waktu Deploy',
      value: [
        input.deployDate,
        input.deployTime,
        input.deployTimeBe && `BE ${input.deployTimeBe}`,
        input.deployTimeFe && `FE ${input.deployTimeFe}`,
      ]
        .filter(Boolean)
        .join(' · '),
    },
    { label: 'PIC Developer', value: input.picDeveloper },
    { label: 'PIC QA', value: input.picQa.join(', ') },
    { label: 'PIC HoE', value: input.picHoe },
    { label: 'Database', value: databaseSummary },
    { label: 'Kafka', value: kafkaSummary },
    {
      label: 'Service (link MR)',
      value: input.services
        .filter((service) => service.service && service.url.trim())
        .map((service) => service.service)
        .join(', '),
    },
  ];

  return (
    <div className='space-y-4'>
      <section className='card'>
        <h2 className='card-title'>Autofill Form Deployment</h2>
        <p className='hint'>
          dev-hub mengisi form MS Forms lewat Google Chrome yang sudah login
          Microsoft. Form tidak disubmit otomatis: periksa lalu tekan Submit
          sendiri.
        </p>

        <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
          <div className='field sm:col-span-2'>
            <label htmlFor='deploy-judul'>Judul Release Dev</label>
            <input
              id='deploy-judul'
              className='input'
              value={input.judul}
              onChange={(event) => patch({ judul: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-tiket'>
              Tiket Taiga Deployment Checklist Dev
            </label>
            <input
              id='deploy-tiket'
              className='input'
              value={input.tiket}
              onChange={(event) => patch({ tiket: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-pic-dev'>PIC Developer</label>
            <Select
              id='deploy-pic-dev'
              aria-label='PIC Developer'
              value={input.picDeveloper}
              onChange={(event) =>
                patch({ picDeveloper: event.target.value })
              }
            >
              <option value=''>Pilih developer...</option>
              {PIC_DEVELOPER_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <label htmlFor='deploy-date'>Tanggal Deploy</label>
            <input
              id='deploy-date'
              type='date'
              className='input'
              value={input.deployDate}
              onChange={(event) => patch({ deployDate: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-time'>Waktu Deploy</label>
            <input
              id='deploy-time'
              type='time'
              className='input'
              value={input.deployTime}
              onChange={(event) => patch({ deployTime: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-time-be'>Waktu Deploy BE</label>
            <input
              id='deploy-time-be'
              type='time'
              className='input'
              value={input.deployTimeBe}
              onChange={(event) => patch({ deployTimeBe: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-time-fe'>Waktu Deploy FE</label>
            <input
              id='deploy-time-fe'
              type='time'
              className='input'
              value={input.deployTimeFe}
              onChange={(event) => patch({ deployTimeFe: event.target.value })}
            />
          </div>

          <div className='field sm:col-span-2'>
            <label>PIC Software Quality Assurance</label>
            <div className='flex flex-wrap gap-2'>
              {PIC_QA_OPTIONS.map((name) => {
                const active = input.picQa.includes(name);
                return (
                  <button
                    key={name}
                    type='button'
                    onClick={() => toggleList('picQa', name)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-border-strong text-slate-500 hover:border-brand'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='field'>
            <label htmlFor='deploy-pic-hoe'>PIC HoE</label>
            <Select
              id='deploy-pic-hoe'
              aria-label='PIC HoE'
              value={input.picHoe}
              onChange={(event) => patch({ picHoe: event.target.value })}
            >
              <option value=''>Pilih HoE...</option>
              {PIC_HOE_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className='card'>
        <h2 className='card-title'>Database, Kafka, Env/Vault</h2>

        <div className='field'>
          <label>Database Yang Terdampak</label>
          <div className='flex flex-wrap gap-2'>
            {DATABASE_TYPE_OPTIONS.map((type) => {
              const active = input.databaseTypes.includes(type);
              return (
                <button
                  key={type}
                  type='button'
                  onClick={() => toggleList('databaseTypes', type)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-brand bg-brand-light text-brand'
                      : 'border-border-strong text-slate-500 hover:border-brand'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className='mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
          <div className='field'>
            <label htmlFor='deploy-db-name'>Nama Database</label>
            <input
              id='deploy-db-name'
              className='input'
              value={input.databaseName}
              onChange={(event) => patch({ databaseName: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-db-table'>Nama Tabel Database</label>
            <input
              id='deploy-db-table'
              className='input'
              value={input.tableName}
              onChange={(event) => patch({ tableName: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-db-column'>Nama Field/Kolom Database</label>
            <input
              id='deploy-db-column'
              className='input'
              value={input.columnName}
              onChange={(event) => patch({ columnName: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-db-desc'>Deskripsi Perubahan Database</label>
            <input
              id='deploy-db-desc'
              className='input'
              value={input.databaseDescription}
              onChange={(event) =>
                patch({ databaseDescription: event.target.value })
              }
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-kafka-topic'>Kafka Topic Yang Terdampak</label>
            <input
              id='deploy-kafka-topic'
              className='input'
              value={input.kafkaTopic}
              onChange={(event) => patch({ kafkaTopic: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-kafka-producer'>Kafka Producer</label>
            <input
              id='deploy-kafka-producer'
              className='input'
              value={input.kafkaProducer}
              onChange={(event) => patch({ kafkaProducer: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-kafka-consumer'>Kafka Consumer</label>
            <input
              id='deploy-kafka-consumer'
              className='input'
              value={input.kafkaConsumer}
              onChange={(event) => patch({ kafkaConsumer: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-kafka-message'>Kafka Message</label>
            <input
              id='deploy-kafka-message'
              className='input'
              placeholder='Link wiki kafka message'
              value={input.kafkaMessage}
              onChange={(event) => patch({ kafkaMessage: event.target.value })}
            />
          </div>

          <div className='field'>
            <label htmlFor='deploy-env-vault'>Env/Vault</label>
            <input
              id='deploy-env-vault'
              className='input'
              value={input.envVault}
              onChange={(event) => patch({ envVault: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-env-vault-be'>Env/Vault BE</label>
            <input
              id='deploy-env-vault-be'
              className='input'
              value={input.envVaultBe}
              onChange={(event) => patch({ envVaultBe: event.target.value })}
            />
          </div>
          <div className='field'>
            <label htmlFor='deploy-env-vault-fe'>Env/Vault FE</label>
            <input
              id='deploy-env-vault-fe'
              className='input'
              value={input.envVaultFe}
              onChange={(event) => patch({ envVaultFe: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section className='card'>
        <h2 className='card-title'>Link MR per Service</h2>
        {input.services.length === 0 ? (
          <p className='rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-slate-400'>
            Belum ada service. Tambahkan service yang berubah beserta link MR.
          </p>
        ) : (
          <ul className='space-y-2'>
            {input.services.map((service, index) => (
              <li
                key={service.id}
                className='grid grid-cols-1 sm:grid-cols-[220px_1fr_auto] gap-2'
              >
                <Select
                  aria-label={`Service ${index + 1}`}
                  value={service.service}
                  onChange={(event) =>
                    changeService(service.id, { service: event.target.value })
                  }
                >
                  <option value=''>Pilih service...</option>
                  {FORM_SERVICE_FIELDS.map((field) => (
                    <option key={field.id} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </Select>
                <input
                  className='input'
                  placeholder='https://gitlab.../merge_requests/124'
                  aria-label={`Link MR service ${index + 1}`}
                  value={service.url}
                  onChange={(event) =>
                    changeService(service.id, { url: event.target.value })
                  }
                />
                <button
                  type='button'
                  className='btn btn-ghost btn-icon !h-9 !w-9 text-slate-400 hover:text-rose-600'
                  aria-label={`Hapus service ${index + 1}`}
                  onClick={() =>
                    patch({
                      services: input.services.filter(
                        (item) => item.id !== service.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type='button'
          className='btn btn-ghost btn-sm mt-3 text-brand'
          onClick={() =>
            patch({ services: [...input.services, makeServiceLink()] })
          }
        >
          <Plus size={14} />
          Tambah service
        </button>
      </section>

      <section className='card'>
        <h2 className='card-title'>Ringkasan Field</h2>
        <div className='overflow-hidden rounded-xl border border-border'>
          {summaryRows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[minmax(150px,230px)_1fr] text-[13px] ${
                index > 0 ? 'border-t border-border' : ''
              }`}
            >
              <div className='bg-surface-subtle px-3 py-1.5 font-semibold text-slate-600'>
                {row.label}
              </div>
              <div className='px-3 py-1.5 text-slate-800 break-words'>
                {row.value || '—'}
              </div>
            </div>
          ))}
        </div>

        <p className='mt-3 text-xs text-slate-500'>
          {answers.length} field akan diisi otomatis. Tanggal dan waktu bisa
          berbeda format di form; cek lagi sebelum submit.
        </p>

        {missing.length > 0 && (
          <p className='mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800'>
            Field wajib belum lengkap: {missing.join(', ')}.
          </p>
        )}

        {error && (
          <p className='mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700'>
            {error}
          </p>
        )}

        {result && (
          <div className='mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 text-xs'>
            <p className='font-bold text-emerald-700'>
              {result.filled}/{result.total} field terisi
            </p>
            {result.results.some((item) => !item.ok) && (
              <ul className='mt-1.5 list-disc space-y-0.5 pl-4 text-amber-800'>
                {result.results
                  .filter((item) => !item.ok)
                  .map((item) => (
                    <li key={item.id}>
                      {item.title}
                      {item.reason ? ` — ${item.reason}` : ''}
                    </li>
                  ))}
              </ul>
            )}
            <p className='mt-1.5 text-slate-600'>
              Periksa form di Chrome lalu tekan Submit sendiri.
            </p>
          </div>
        )}

        <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
          <button type='button' className='btn btn-ghost' onClick={onBack}>
            <ChevronLeft size={16} />
            Kembali
          </button>
          <div className='flex flex-wrap items-center gap-2'>
            <Link
              href={DEPLOYMENT_FORM_URL}
              target='_blank'
              rel='noreferrer'
              className='btn btn-ghost btn-sm'
            >
              Buka form
              <ExternalLink size={13} />
            </Link>
            <button
              type='button'
              className='btn btn-primary'
              onClick={() => void autofill()}
              disabled={filling || missing.length > 0}
            >
              {filling ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <Wand2 size={16} />
              )}
              {filling ? 'Mengisi form...' : 'Buka & Isi Form di Browser'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
