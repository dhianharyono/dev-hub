'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ExternalLink, Loader2, Wand2 } from 'lucide-react';
import { Select } from '@/components/Select';
import {
  RELEASE_TARGETS,
  SQUAD_OPTIONS,
  type DeploymentFormInput,
  type ReleaseCreation,
  type ReleaseStoryForm,
  type ServiceGroup,
} from '@/lib/release-deployment/model';
import {
  DATABASE_FIELDS,
  DATABASE_TYPE_OPTIONS,
  FORM_FIELDS,
  FORM_SECTION_ORDER,
  FORM_SERVICE_FIELDS,
  PIC_DEVELOPER_OPTIONS,
  PIC_HOE_OPTIONS,
  PIC_QA_OPTIONS,
  buildFormAnswers,
  missingRequiredFields,
  type FormAnswer,
  type FormSection,
} from '@/lib/release-deployment/form';

interface DeploymentFormStepProps {
  form: ReleaseStoryForm;
  created: ReleaseCreation;
  memberName: string;
  formUrl: string;
  onBack: () => void;
}

interface AutofillResponse {
  total: number;
  filled: number;
  results: { id: string; title: string; ok: boolean; reason?: string }[];
}

interface DatabaseValues {
  types: string[];
  name: string;
  table: string;
  column: string;
  description: string;
}

const ENVIRONMENT_OPTIONS = ['Staging', 'Production'];

type TechTab = 'BE' | 'FE' | 'MOBILE' | 'FULLSTACK';

const TECH_TABS: { key: TechTab; label: string; section: FormSection }[] = [
  { key: 'BE', label: 'BE', section: 'Technical Backend' },
  { key: 'FE', label: 'FE', section: 'Technical Frontend' },
  { key: 'MOBILE', label: 'Mobile', section: 'Technical Mobile' },
  { key: 'FULLSTACK', label: 'Fullstack', section: 'Technical Fullstack New' },
];

function TechTabBar({
  value,
  onChange,
}: {
  value: TechTab;
  onChange: (tab: TechTab) => void;
}) {
  return (
    <div className='flex flex-wrap gap-2'>
      {TECH_TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type='button'
            onClick={() => onChange(tab.key)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              active
                ? 'border-brand bg-brand-light text-brand'
                : 'border-border-strong bg-white text-slate-500 hover:border-brand'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Penanda wajib per role seperti pada form asli. */
const ROLE_BADGES: Record<string, string> = {
  [FORM_FIELDS.deployTimeBe.id]: 'BE wajib isi',
  [DATABASE_FIELDS.be.type.id]: 'BE wajib isi',
  [DATABASE_FIELDS.be.name.id]: 'BE wajib isi',
  [DATABASE_FIELDS.be.table.id]: 'BE wajib isi',
  [DATABASE_FIELDS.be.column.id]: 'BE wajib isi',
  [DATABASE_FIELDS.be.description.id]: 'BE wajib isi',
  [FORM_FIELDS.kafkaTopic.id]: 'BE wajib isi',
  [FORM_FIELDS.kafkaMessage.id]: 'BE wajib isi',
  [FORM_FIELDS.kafkaProducer.id]: 'BE wajib isi',
  [FORM_FIELDS.kafkaConsumer.id]: 'BE wajib isi',
  [FORM_FIELDS.envVaultBe.id]: 'BE wajib isi',
  [FORM_FIELDS.firestore.id]: 'BE wajib isi',
  [FORM_FIELDS.deployTimeFe.id]: 'FE wajib isi',
  [FORM_FIELDS.envVaultFe.id]: 'FE wajib isi',
  [FORM_FIELDS.deployTimeMobile.id]: 'Mobile wajib isi',
  [FORM_FIELDS.deployTime.id]: 'wajib isi',
};

function FieldLabel({
  htmlFor,
  label,
  required,
  badge,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  badge?: string;
}) {
  return (
    <label htmlFor={htmlFor}>
      {label}
      {required && <span className='ml-0.5 text-rose-600'>*</span>}
      {badge && (
        <>
          {' '}
          <span className='ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700'>
            {badge}
          </span>
        </>
      )}
    </label>
  );
}

function ServiceInputs({
  group,
  services,
  onChange,
}: {
  group: ServiceGroup;
  services: Record<string, string>;
  onChange: (service: string, url: string) => void;
}) {
  return (
    <div className='mt-3.5'>
      <p className='mb-2 text-xs font-bold text-slate-600'>Link MR service</p>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        {FORM_SERVICE_FIELDS.filter((field) => field.group === group).map(
          (field) => (
            <div key={field.id} className='field !gap-1'>
              <FieldLabel
                htmlFor={`svc-${field.id}`}
                label={`Service ${field.name}`}
              />
              <input
                id={`svc-${field.id}`}
                className='input !h-9 text-[12px]'
                placeholder='Link MR'
                value={services[field.name] ?? ''}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function DatabaseInputs({
  idPrefix,
  values,
  onChange,
  onToggleType,
}: {
  idPrefix: string;
  values: DatabaseValues;
  onChange: (changes: Partial<DatabaseValues>) => void;
  onToggleType: (type: string) => void;
}) {
  return (
    <div className='mt-3.5'>
      <div className='field'>
        <FieldLabel
          label='Database Yang Terdampak'
          badge={idPrefix === 'be' ? ROLE_BADGES[DATABASE_FIELDS.be.type.id] : undefined}
        />
        <div className='flex flex-wrap gap-2'>
          {DATABASE_TYPE_OPTIONS.map((type) => {
            const active = values.types.includes(type);
            return (
              <button
                key={type}
                type='button'
                onClick={() => onToggleType(type)}
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

      <div className='mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
        <div className='field sm:col-span-2'>
          <FieldLabel
            htmlFor={`${idPrefix}-db-name`}
            label='Nama Database'
            badge={idPrefix === 'be' ? ROLE_BADGES[DATABASE_FIELDS.be.name.id] : undefined}
          />
          <input
            id={`${idPrefix}-db-name`}
            className='input'
            value={values.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className='field'>
          <FieldLabel
            htmlFor={`${idPrefix}-db-table`}
            label='Nama Tabel Database'
            badge={idPrefix === 'be' ? ROLE_BADGES[DATABASE_FIELDS.be.table.id] : undefined}
          />
          <textarea
            id={`${idPrefix}-db-table`}
            className='textarea !min-h-[72px]'
            value={values.table}
            onChange={(event) => onChange({ table: event.target.value })}
          />
        </div>
        <div className='field'>
          <FieldLabel
            htmlFor={`${idPrefix}-db-column`}
            label='Nama Field/Kolom Database'
            badge={idPrefix === 'be' ? ROLE_BADGES[DATABASE_FIELDS.be.column.id] : undefined}
          />
          <textarea
            id={`${idPrefix}-db-column`}
            className='textarea !min-h-[72px]'
            value={values.column}
            onChange={(event) => onChange({ column: event.target.value })}
          />
        </div>
        <div className='field sm:col-span-2'>
          <FieldLabel
            htmlFor={`${idPrefix}-db-desc`}
            label='Deskripsi Perubahan Database'
            badge={idPrefix === 'be' ? ROLE_BADGES[DATABASE_FIELDS.be.description.id] : undefined}
          />
          <textarea
            id={`${idPrefix}-db-desc`}
            className='textarea !min-h-[96px]'
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function initialInput(
  form: ReleaseStoryForm,
  created: ReleaseCreation,
  memberName: string,
): DeploymentFormInput {
  return {
    judul: form.featureName.trim(),
    tiket: created.story.url,
    squad: form.squad,
    environment: RELEASE_TARGETS[form.target].environment,
    picDeveloper: PIC_DEVELOPER_OPTIONS.includes(memberName) ? memberName : '',
    picQa: [],
    picHoe: '',
    deployDate: form.releaseDate,
    deployTime: '',
    deployTimeBe: '',
    deployTimeFe: '',
    deployTimeMobile: '',
    envVault: '',
    envVaultBe: '',
    envVaultFe: '',
    firestore: '',
    linkApk: '',
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
    kafkaMessage: '',
    kafkaConsumer: '',
    kafkaProducer: '',
    kafkaTopic: '',
    services: {},
  };
}

function answerValue(answer: FormAnswer): string {
  return Array.isArray(answer.value)
    ? answer.value.join(', ')
    : String(answer.value);
}

function answerLabel(answer: FormAnswer): string {
  return answer.title;
}

export function DeploymentFormStep({
  form,
  created,
  memberName,
  formUrl,
  onBack,
}: DeploymentFormStepProps) {
  const [input, setInput] = useState<DeploymentFormInput>(() =>
    initialInput(form, created, memberName),
  );
  const [tab, setTab] = useState<TechTab>('BE');
  const [filling, setFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutofillResponse | null>(null);

  const patch = (changes: Partial<DeploymentFormInput>) => {
    setResult(null);
    setInput((previous) => ({ ...previous, ...changes }));
  };

  const missing = useMemo(() => missingRequiredFields(input), [input]);
  const answers = useMemo(() => buildFormAnswers(input), [input]);
  const activeSection =
    TECH_TABS.find((item) => item.key === tab)?.section ?? 'Technical Backend';
  const groups = useMemo(
    () =>
      FORM_SECTION_ORDER.filter(
        (section) => section === 'Umum' || section === activeSection,
      )
        .map((section) => ({
          section,
          rows: answers.filter((answer) => answer.section === section),
        }))
        .filter((group) => group.rows.length > 0),
    [answers, activeSection],
  );

  const toggleList = (key: 'picQa' | 'databaseTypes', value: string) => {
    const current = input[key];
    patch({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  const toggleFullstackDatabase = (value: string) => {
    const current = input.fullstackDatabaseTypes;
    patch({
      fullstackDatabaseTypes: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
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

  return (
    <div className='space-y-4'>
      <section className='card'>
        <h2 className='card-title'>Autofill Form Deployment</h2>
        <p className='hint'>
          dev-hub mengisi form MS Forms lewat Google Chrome yang sudah login
          Microsoft. Form tidak disubmit otomatis: periksa lalu tekan Submit
          sendiri.
        </p>

        <div className='mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
          <div className='field'>
            <FieldLabel htmlFor='deploy-date' label='Tanggal Deploy' required />
            <input
              id='deploy-date'
              type='date'
              className='input'
              value={input.deployDate}
              onChange={(event) => patch({ deployDate: event.target.value })}
            />
          </div>

          <div className='field'>
            <FieldLabel htmlFor='deploy-squad' label='Skuad' required />
            <Select
              id='deploy-squad'
              aria-label='Skuad'
              value={input.squad}
              onChange={(event) => patch({ squad: event.target.value })}
            >
              <option value=''>Pilih skuad...</option>
              {SQUAD_OPTIONS.map((squad) => (
                <option key={squad} value={squad}>
                  {squad}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <FieldLabel
              htmlFor='deploy-environment'
              label='Environment'
              required
            />
            <Select
              id='deploy-environment'
              aria-label='Environment'
              value={input.environment}
              onChange={(event) => patch({ environment: event.target.value })}
            >
              {ENVIRONMENT_OPTIONS.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <FieldLabel
              htmlFor='deploy-judul'
              label='Judul Release Dev'
              required
            />
            <input
              id='deploy-judul'
              className='input'
              value={input.judul}
              onChange={(event) => patch({ judul: event.target.value })}
            />
          </div>

          <div className='field sm:col-span-2'>
            <FieldLabel
              htmlFor='deploy-tiket'
              label='Tiket Taiga Deployment Checklist Dev'
              required
            />
            <input
              id='deploy-tiket'
              className='input'
              value={input.tiket}
              onChange={(event) => patch({ tiket: event.target.value })}
            />
          </div>

          <div className='field'>
            <FieldLabel htmlFor='deploy-pic-hoe' label='PIC HoE' required />
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

          <div className='field'>
            <FieldLabel
              htmlFor='deploy-pic-dev'
              label='PIC Developer'
              required
            />
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

          <div className='field sm:col-span-2'>
            <FieldLabel
              label='PIC Software Quality Assurance'
              required
            />
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
        </div>
      </section>

      <div className='flex flex-wrap items-center gap-2'>
        <TechTabBar value={tab} onChange={setTab} />
      </div>

      {missing.length > 0 && (
        <p className='rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800'>
          Field wajib belum lengkap: {missing.join(', ')}.
        </p>
      )}

      {tab === 'BE' && (
        <section className='card'>
          <h2 className='card-title'>Technical Backend</h2>

          <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-time-be'
                label='Waktu Deploy BE'
                badge={ROLE_BADGES[FORM_FIELDS.deployTimeBe.id]}
              />
              <input
                id='deploy-time-be'
                type='time'
                className='input'
                value={input.deployTimeBe}
                onChange={(event) => patch({ deployTimeBe: event.target.value })}
              />
            </div>
          </div>

          <ServiceInputs
            group='BE'
            services={input.services}
            onChange={(service, url) =>
              patch({ services: { ...input.services, [service]: url } })
            }
          />

          <DatabaseInputs
            idPrefix='be'
            values={{
              types: input.databaseTypes,
              name: input.databaseName,
              table: input.tableName,
              column: input.columnName,
              description: input.databaseDescription,
            }}
            onChange={(changes) =>
              patch({
                ...(changes.types ? { databaseTypes: changes.types } : {}),
                ...(changes.name !== undefined
                  ? { databaseName: changes.name }
                  : {}),
                ...(changes.table !== undefined
                  ? { tableName: changes.table }
                  : {}),
                ...(changes.column !== undefined
                  ? { columnName: changes.column }
                  : {}),
                ...(changes.description !== undefined
                  ? { databaseDescription: changes.description }
                  : {}),
              })
            }
            onToggleType={(type) => toggleList('databaseTypes', type)}
          />

          <div className='mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-kafka-topic'
                label='Kafka Topic Yang Terdampak'
                badge={ROLE_BADGES[FORM_FIELDS.kafkaTopic.id]}
              />
              <input
                id='deploy-kafka-topic'
                className='input'
                value={input.kafkaTopic}
                onChange={(event) => patch({ kafkaTopic: event.target.value })}
              />
            </div>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-kafka-message'
                label='Kafka Message'
                badge={ROLE_BADGES[FORM_FIELDS.kafkaMessage.id]}
              />
              <input
                id='deploy-kafka-message'
                className='input'
                placeholder='Link wiki kafka message'
                value={input.kafkaMessage}
                onChange={(event) => patch({ kafkaMessage: event.target.value })}
              />
            </div>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-kafka-producer'
                label='Kafka Producer'
                badge={ROLE_BADGES[FORM_FIELDS.kafkaProducer.id]}
              />
              <input
                id='deploy-kafka-producer'
                className='input'
                value={input.kafkaProducer}
                onChange={(event) => patch({ kafkaProducer: event.target.value })}
              />
            </div>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-kafka-consumer'
                label='Kafka Consumer'
                badge={ROLE_BADGES[FORM_FIELDS.kafkaConsumer.id]}
              />
              <input
                id='deploy-kafka-consumer'
                className='input'
                value={input.kafkaConsumer}
                onChange={(event) => patch({ kafkaConsumer: event.target.value })}
              />
            </div>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-env-vault-be'
                label='Env/Vault BE'
                badge={ROLE_BADGES[FORM_FIELDS.envVaultBe.id]}
              />
              <textarea
                id='deploy-env-vault-be'
                className='textarea !min-h-[72px]'
                value={input.envVaultBe}
                onChange={(event) => patch({ envVaultBe: event.target.value })}
              />
            </div>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-firestore'
                label='Firestore'
                badge={ROLE_BADGES[FORM_FIELDS.firestore.id]}
              />
              <input
                id='deploy-firestore'
                className='input'
                value={input.firestore}
                onChange={(event) => patch({ firestore: event.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {tab === 'FE' && (
        <section className='card'>
          <h2 className='card-title'>Technical Frontend</h2>

          <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-time-fe'
                label='Waktu Deploy FE'
                badge={ROLE_BADGES[FORM_FIELDS.deployTimeFe.id]}
              />
              <input
                id='deploy-time-fe'
                type='time'
                className='input'
                value={input.deployTimeFe}
                onChange={(event) => patch({ deployTimeFe: event.target.value })}
              />
            </div>
          </div>

          <ServiceInputs
            group='FE'
            services={input.services}
            onChange={(service, url) =>
              patch({ services: { ...input.services, [service]: url } })
            }
          />

          <div className='mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-env-vault-fe'
                label='Env/Vault FE'
                badge={ROLE_BADGES[FORM_FIELDS.envVaultFe.id]}
              />
              <textarea
                id='deploy-env-vault-fe'
                className='textarea !min-h-[72px]'
                value={input.envVaultFe}
                onChange={(event) => patch({ envVaultFe: event.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {tab === 'MOBILE' && (
        <section className='card'>
          <h2 className='card-title'>Technical Mobile</h2>

          <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-time-mobile'
                label='Waktu Deploy Mobile'
                badge={ROLE_BADGES[FORM_FIELDS.deployTimeMobile.id]}
              />
              <input
                id='deploy-time-mobile'
                type='time'
                className='input'
                value={input.deployTimeMobile}
                onChange={(event) =>
                  patch({ deployTimeMobile: event.target.value })
                }
              />
            </div>
          </div>

          <ServiceInputs
            group='MOBILE'
            services={input.services}
            onChange={(service, url) =>
              patch({ services: { ...input.services, [service]: url } })
            }
          />

          <div className='mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel htmlFor='deploy-link-apk' label='Link APK' />
              <input
                id='deploy-link-apk'
                className='input'
                value={input.linkApk}
                onChange={(event) => patch({ linkApk: event.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {tab === 'FULLSTACK' && (
        <section className='card'>
          <h2 className='card-title'>Technical Fullstack New</h2>

          <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel
                htmlFor='deploy-time'
                label='Waktu Deploy'
                badge={ROLE_BADGES[FORM_FIELDS.deployTime.id]}
              />
              <input
                id='deploy-time'
                type='time'
                className='input'
                value={input.deployTime}
                onChange={(event) => patch({ deployTime: event.target.value })}
              />
            </div>
          </div>

          <ServiceInputs
            group='FULLSTACK'
            services={input.services}
            onChange={(service, url) =>
              patch({ services: { ...input.services, [service]: url } })
            }
          />

          <DatabaseInputs
            idPrefix='fullstack'
            values={{
              types: input.fullstackDatabaseTypes,
              name: input.fullstackDatabaseName,
              table: input.fullstackTableName,
              column: input.fullstackColumnName,
              description: input.fullstackDatabaseDescription,
            }}
            onChange={(changes) =>
              patch({
                ...(changes.types
                  ? { fullstackDatabaseTypes: changes.types }
                  : {}),
                ...(changes.name !== undefined
                  ? { fullstackDatabaseName: changes.name }
                  : {}),
                ...(changes.table !== undefined
                  ? { fullstackTableName: changes.table }
                  : {}),
                ...(changes.column !== undefined
                  ? { fullstackColumnName: changes.column }
                  : {}),
                ...(changes.description !== undefined
                  ? { fullstackDatabaseDescription: changes.description }
                  : {}),
              })
            }
            onToggleType={toggleFullstackDatabase}
          />

          <div className='mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            <div className='field'>
              <FieldLabel htmlFor='deploy-env-vault' label='Env/Vault' />
              <textarea
                id='deploy-env-vault'
                className='textarea !min-h-[72px]'
                value={input.envVault}
                onChange={(event) => patch({ envVault: event.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      <section className='card'>
        <h2 className='card-title'>Ringkasan Field</h2>

        <TechTabBar value={tab} onChange={setTab} />

        <div className='mt-4 space-y-4'>
          {groups.map((group) => (
            <div key={group.section}>
              <p className='mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500'>
                {group.section}
              </p>
              <div className='overflow-hidden rounded-xl border border-border'>
                {group.rows.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`grid grid-cols-[minmax(150px,230px)_1fr] text-[13px] ${
                      index > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    <div className='bg-surface-subtle px-3 py-1.5 font-semibold text-slate-600'>
                      {answerLabel(answer)}
                    </div>
                    <div className='px-3 py-1.5 text-slate-800 break-words'>
                      {answer.id === FORM_FIELDS.ticket.id ? (
                        <a
                          href={created.story.url}
                          target='_blank'
                          rel='noreferrer'
                          className='text-brand underline'
                        >
                          Buka user story Taiga
                        </a>
                      ) : (
                        answerValue(answer)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className='mt-3 text-xs text-slate-500'>
          {answers.length} field akan diisi otomatis. Tanggal dan waktu bisa
          berbeda format di form; cek lagi sebelum submit.
        </p>

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
            {formUrl ? (
              <Link
                href={formUrl}
                target='_blank'
                rel='noreferrer'
                className='btn btn-ghost btn-sm'
              >
                Buka form
                <ExternalLink size={13} />
              </Link>
            ) : (
              <button
                type='button'
                className='btn btn-ghost btn-sm'
                disabled
                title='Isi Link Form Deployment di Pengaturan'
              >
                Buka form
                <ExternalLink size={13} />
              </button>
            )}
            <button
              type='button'
              className='btn btn-primary'
              onClick={() => void autofill()}
              disabled={filling || missing.length > 0 || !formUrl}
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
        {!formUrl && (
          <p className='mt-2 text-xs text-amber-700'>
            Isi Link Form Deployment di Pengaturan.
          </p>
        )}
      </section>
    </div>
  );
}
