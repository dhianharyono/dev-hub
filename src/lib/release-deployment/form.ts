import type { DeploymentFormInput, ServiceGroup } from './model';

export const DEPLOYMENT_FORM_URL =
  'https://forms.office.com/pages/responsepage.aspx?id=AUuJHtOwQk6t9xkohyiixwSkjYOhAcFKuJZ6k2T9OEpUQjNLUU5SQzYxRFFXQThTOEg4TjdPWjM5MSQlQCN0PWcu';

export type FormSection =
  | 'Umum'
  | 'Technical Backend'
  | 'Technical Frontend'
  | 'Technical Mobile'
  | 'Technical Fullstack New';

/** Urutan section persis seperti form Deployment. */
export const FORM_SECTION_ORDER: FormSection[] = [
  'Umum',
  'Technical Backend',
  'Technical Frontend',
  'Technical Mobile',
  'Technical Fullstack New',
];

/** Id pertanyaan form Deployment; judul tidak unik, jadi selalu pakai id. */
export const FORM_FIELDS = {
  deployDate: { id: 'r95430825cb46499ba534c74a62d80939', title: 'Tanggal Deploy' },
  squad: { id: 'r643b490e8c3f4be2a0d508b362c7014b', title: 'Skuad' },
  environment: { id: 'r88a05ef5957447c2bb592f3209c3dad8', title: 'Environment' },
  releaseTitle: {
    id: 'r6b992f1f4bff405cba47ec8955af2bd9',
    title: 'Judul Release Dev',
  },
  ticket: {
    id: 'r95339807a6714dad84d9c7571ccaaeab',
    title: 'Tiket Taiga Deployment Checklist Dev',
  },
  picHoe: { id: 're2a534aeeae043c4a264a1ed6a2061e9', title: 'PIC HoE' },
  picDeveloper: {
    id: 'r146b66c57e2c44c29ea11bbafe1003f6',
    title: 'PIC Developer',
  },
  picQa: {
    id: 'r1c3c633db15e46a891d266ca5c307a1e',
    title: 'PIC Software Quality Assurance',
  },
  deployTimeBe: {
    id: 'rceaba83828ad4d56a908b94aad9249d3',
    title: 'Waktu Deploy BE',
  },
  deployTimeFe: {
    id: 'r6059797939ef4c8bb53b9fa9dfb9dfb8',
    title: 'Waktu Deploy FE',
  },
  deployTimeMobile: {
    id: 'r307cde936781443ab3b4131f1c154f3f',
    title: 'Waktu Deploy Mobile',
  },
  deployTime: { id: 'r3e4ba486085842d7991da12796ecc2d3', title: 'Waktu Deploy' },
  kafkaTopic: {
    id: 'r8375bd09dfef404e86f5006af2b6bd1d',
    title: 'Kafka Topic Yang Terdampak',
  },
  kafkaMessage: {
    id: 'rdc2253ecadf44414825d3e0de6c18b5a',
    title: 'Kafka Message',
  },
  kafkaProducer: {
    id: 'r2e39819b75d54cb7a7a14a42101e0f80',
    title: 'Kafka Producer',
  },
  kafkaConsumer: {
    id: 'r88a4923bd6b946bd99650f31ecd0e021',
    title: 'Kafka Consumer',
  },
  envVaultBe: { id: 'r5417bac3621244329ebc39e7d8622d75', title: 'Env/Vault BE' },
  firestore: { id: 'r855c6f8da26f498ca468aa0fbd2a78aa', title: 'Firestore' },
  envVaultFe: { id: 'r8c88f7583fa04db88f581a907c2a2153', title: 'Env/Vault FE' },
  linkApk: { id: 'r0ead8945da794db1bc309b3aa6f14454', title: 'Link APK' },
  envVault: { id: 'r3534533d4bff4ee2aad703c2f3d87e03', title: 'Env/Vault' },
} as const;

/**
 * Pertanyaan database muncul di section Technical Backend dan
 * Technical Fullstack New dengan judul sama tetapi id berbeda.
 */
interface DatabaseFieldSet {
  type: { id: string; title: string };
  name: { id: string; title: string };
  table: { id: string; title: string };
  column: { id: string; title: string };
  description: { id: string; title: string };
}

export const DATABASE_FIELDS: Record<'be' | 'fullstack', DatabaseFieldSet> = {
  be: {
    type: { id: 'r50fd3d69ff5d468cb9b2286f59d161b7', title: 'Database Yang Terdampak' },
    name: { id: 'r9a2c4d4a2d6b419f885f7f37de251495', title: 'Nama Database' },
    table: { id: 'r5c8ccb197b8f403b997d51749879d516', title: 'Nama Tabel Database' },
    column: { id: 'r5d90946e1c7b4c0e9962f2169c21be02', title: 'Nama Field/Kolom Database' },
    description: { id: 'r5595c8a7c69e4f0ea01d9b998cf2e283', title: 'Deskripsi Perubahan Database' },
  },
  fullstack: {
    type: { id: 'rbb7c438b60684d43acac19129d1bbf8a', title: 'Database Yang Terdampak' },
    name: { id: 'r8b22b2429d5d4cf6a09806e1cd87fbca', title: 'Nama Database' },
    table: { id: 'r818f9d7a471d4d349d492e71de417b9b', title: 'Nama Tabel Database' },
    column: { id: 'rca97995d77784b0d9962ed20feb76060', title: 'Nama Field/Kolom Database' },
    description: { id: 'ra363f35b9c364d77bfb781bd899be603', title: 'Deskripsi Perubahan Database' },
  },
} as const;

export interface FormServiceField {
  id: string;
  name: string;
  group: ServiceGroup;
}

/** Pertanyaan "Service <nama>", urut sesuai section dan urutan form. */
const SERVICE_FIELD_NAMES: { id: string; name: string }[] = [
  { id: 'r724d4d222b174799b5912f08bfe984a0', name: 'ms-user' },
  { id: 'r19e2b9a51f9a492f8deff686e28f953f', name: 'ms-rfq' },
  { id: 'r81a96154081a4922b3beef86e15b2701', name: 'ms-product' },
  { id: 'rd3ae9eccc1da4a85b6bde9654990851c', name: 'ms-control-tower' },
  { id: 'rd9c63c2b402e4905ad33a99540ccd7b4', name: 'ms-purchase' },
  { id: 'r1dfd3f6e11e54c84816f69b5e4e73cd3', name: 'ms-order' },
  { id: 'r996318b042cd49d1b11e5104b915128f', name: 'ms-transaction' },
  { id: 'r8aefb1889204436493b573ac9a61854b', name: 'ms-fulfillment' },
  { id: 'r39002d385a254518bdba4fcd73ce803e', name: 'ms-core' },
  { id: 'rcf44b7721d084fa2848708da447c8194', name: 'ms-core-chat' },
  { id: 'rc737febd5a9f4534a82a4eab2726f9ea', name: 'api-gateway' },
  { id: 'r1cbec51485cd467184840df52ee46a47', name: 'info-padi' },
  { id: 'r4adbea8461214899b6e582ceab4cf8df', name: 'ms-openapi-bumn' },
  { id: 'r828c557566a34bb697289820b84ba6aa', name: 'ms-openapi-gateway' },
  { id: 'rd36d4ad9fa4240e9bc3bcd3f46d0240f', name: 'ms-financing' },
  { id: 'rc53f9fbd9d144a539e0ad0ab665021ff', name: 'ms-document' },
  { id: 'rf5e5c9444a7e431f9ec98ff3f869b74d', name: 'ms-notification' },
  { id: 'r667e2065d066480e8741091997be510c', name: 'ms-disbursement' },
  { id: 'r1a9a64d62bc14703a1ee6b144afc29ae', name: 'ms-payment' },
  { id: 'rbfed1a6cabba44248d8f3e9cacd4f363', name: 'ms-masterdata' },
  { id: 'rab22eb40ea28448c8da64312b948f1b3', name: 'ms-chat-ai' },
  { id: 'rf09ebbb0d7d1465c827abd288410050f', name: 'ms-bumn-solution-center' },
  { id: 'rc1c064442c494ceaa1b0c1c0ea70dd23', name: 'fe-buyer' },
  { id: 'rf9d1fc15da2444f1b2b3df641ef23255', name: 'fe-seller' },
  { id: 'r8eda07877098414ca5561cf57c34707e', name: 'fe-control tower' },
  { id: 'refce5efd39ee473eb9b8c654fca64be4', name: 'fe-cms-mimin' },
  { id: 'r358f4d0e0b6f4ebdac69e3672f6a52ff', name: 'fe-portal-financing' },
  { id: 'r69153871b58c4bbb9f37d8cad6c442e0', name: 'fe-openapi-docs' },
  { id: 'rdc871a00170e428ab6cb896f977579c7', name: 'fe-solution-center' },
  { id: 'rcd8a7a0253ae4a948f328cf2a30d61ec', name: 'fe-frontend-shared' },
  { id: 'r371824a9cd9d486b97770e636658727c', name: 'fe-padisera-landingpage' },
  { id: 'rd0073b76a2d44a1daa2768749266243d', name: 'fe-core-chat' },
  { id: 'r135b2f0998414726ad1f7d5b58781b1d', name: 'mobile-buyer' },
  { id: 'r42ed36d4751f43d783491031b81a2a48', name: 'mobile-seller' },
  { id: 're1c967207f3d4518b7ab41d47a1ad5c1', name: 'dashboard-developer' },
];

export function serviceGroup(name: string): ServiceGroup {
  if (name.startsWith('fe-')) return 'FE';
  if (name.startsWith('mobile-')) return 'MOBILE';
  if (name === 'dashboard-developer') return 'FULLSTACK';
  return 'BE';
}

export const FORM_SERVICE_FIELDS: FormServiceField[] = SERVICE_FIELD_NAMES.map(
  (field) => ({ ...field, group: serviceGroup(field.name) }),
);

export const PIC_QA_OPTIONS = [
  'Halah Helmia Wahdah',
  'Linda Mella Listiara',
  'Reza Nur Cahyo Kumolo',
  'Agustinawati Febiana Sitorus',
  'Chelsya Agestia',
  'Dika Brenda Angkasa',
  'Pipit Darmawanti',
  'Anugerah Peristyowati Putri',
  'Evita Sarah Surbakti',
  'Rayhan Timur Subekti',
  'Fabiola Matara',
];

export const PIC_HOE_OPTIONS = [
  'Muhammad Thariq Abdul Aziz',
  'Budi Hari Sulaksono',
  'Rendra Pramulia',
];

export const PIC_DEVELOPER_OPTIONS = [
  'Muhammad Thariq Abdul Aziz',
  'Budi Hari Sulaksono',
  'Rendra Pramulia',
  'Damar Oen Isyai',
  'Dicky Nofal Sidik',
  'Dita Aprilani',
  'Putra Rama Setiawan',
  'Dwi Warsono',
  'Haris Rahman',
  'Muhammad Khasyogi',
  'Rudi Anton',
  'Afif Wanda Julio',
  'Gian Permana',
  'Ahmad Luthfi Mahar',
  'Andika Ardiansyah',
  'Ario Bima Abdullah',
  'Ferrat Muzaddid',
  'Riki Ramadhani',
  'Alif Farhan Arizkia',
  'Bagus Setiadi',
  'Dhian Haryono',
  'Maulana Akbar Ramadhan',
  'Yogi Prasetya',
  'Panji Pambajeng',
  'Rizky Ramadhan Subagio',
  'Adi Hanif Sedar',
  'Agung Wibowo Ibrahim',
  'Dany Adhi Prabowo',
  'Muhammad Iqbal Fauzi',
  'Hanif Kharismadini',
  'Ardhika Ryzha Nurmawan',
  'Cindy Atrihana',
  'Sutrisno',
  'Muhammad Thaufiq Umardi',
  'Alifanda Pinkan Ludica',
];

export const DATABASE_TYPE_OPTIONS = ['MongoDB', 'PostgreSQL', 'Elastic'];

export type FormAnswerKind = 'text' | 'date' | 'choice';

export interface FormAnswer {
  id: string;
  title: string;
  section: FormSection;
  kind: FormAnswerKind;
  value: string | string[];
}

function pushText(
  answers: FormAnswer[],
  section: FormSection,
  field: { id: string; title: string },
  value: string,
) {
  if (!value.trim()) return;
  answers.push({ ...field, section, kind: 'text', value: value.trim() });
}

function pushChoice(
  answers: FormAnswer[],
  section: FormSection,
  field: { id: string; title: string },
  values: string[],
) {
  const selected = values.filter((value) => value.trim());
  if (selected.length === 0) return;
  answers.push({ ...field, section, kind: 'choice', value: selected });
}

function pushDatabase(
  answers: FormAnswer[],
  section: FormSection,
  fields: DatabaseFieldSet,
  values: {
    types: string[];
    name: string;
    table: string;
    column: string;
    description: string;
  },
) {
  pushChoice(answers, section, fields.type, values.types);
  pushText(answers, section, fields.name, values.name);
  pushText(answers, section, fields.table, values.table);
  pushText(answers, section, fields.column, values.column);
  pushText(answers, section, fields.description, values.description);
}

function pushServices(
  answers: FormAnswer[],
  section: FormSection,
  group: ServiceGroup,
  links: Record<string, string>,
) {
  for (const field of FORM_SERVICE_FIELDS) {
    if (field.group !== group) continue;
    const url = links[field.name] ?? '';
    if (!url.trim()) continue;
    answers.push({
      id: field.id,
      title: `Service ${field.name}`,
      section,
      kind: 'text',
      value: url.trim(),
    });
  }
}

/** Susun jawaban form dari isian halaman; field kosong tidak dikirim. */
export function buildFormAnswers(input: DeploymentFormInput): FormAnswer[] {
  const answers: FormAnswer[] = [];

  // Umum
  if (input.deployDate.trim()) {
    answers.push({
      ...FORM_FIELDS.deployDate,
      section: 'Umum',
      kind: 'date',
      value: input.deployDate.trim(),
    });
  }
  pushChoice(answers, 'Umum', FORM_FIELDS.squad, [input.squad]);
  pushChoice(answers, 'Umum', FORM_FIELDS.environment, [input.environment]);
  pushText(answers, 'Umum', FORM_FIELDS.releaseTitle, input.judul);
  pushText(answers, 'Umum', FORM_FIELDS.ticket, input.tiket);
  pushChoice(answers, 'Umum', FORM_FIELDS.picHoe, [input.picHoe]);
  pushChoice(answers, 'Umum', FORM_FIELDS.picDeveloper, [input.picDeveloper]);
  pushChoice(answers, 'Umum', FORM_FIELDS.picQa, input.picQa);

  // Technical Backend
  pushText(answers, 'Technical Backend', FORM_FIELDS.deployTimeBe, input.deployTimeBe);
  pushServices(answers, 'Technical Backend', 'BE', input.services);
  pushDatabase(answers, 'Technical Backend', DATABASE_FIELDS.be, {
    types: input.databaseTypes,
    name: input.databaseName,
    table: input.tableName,
    column: input.columnName,
    description: input.databaseDescription,
  });
  pushText(answers, 'Technical Backend', FORM_FIELDS.kafkaTopic, input.kafkaTopic);
  pushText(answers, 'Technical Backend', FORM_FIELDS.kafkaMessage, input.kafkaMessage);
  pushText(answers, 'Technical Backend', FORM_FIELDS.kafkaProducer, input.kafkaProducer);
  pushText(answers, 'Technical Backend', FORM_FIELDS.kafkaConsumer, input.kafkaConsumer);
  pushText(answers, 'Technical Backend', FORM_FIELDS.envVaultBe, input.envVaultBe);
  pushText(answers, 'Technical Backend', FORM_FIELDS.firestore, input.firestore);

  // Technical Frontend
  pushText(answers, 'Technical Frontend', FORM_FIELDS.deployTimeFe, input.deployTimeFe);
  pushServices(answers, 'Technical Frontend', 'FE', input.services);
  pushText(answers, 'Technical Frontend', FORM_FIELDS.envVaultFe, input.envVaultFe);

  // Technical Mobile
  pushText(
    answers,
    'Technical Mobile',
    FORM_FIELDS.deployTimeMobile,
    input.deployTimeMobile,
  );
  pushServices(answers, 'Technical Mobile', 'MOBILE', input.services);
  pushText(answers, 'Technical Mobile', FORM_FIELDS.linkApk, input.linkApk);

  // Technical Fullstack New
  pushText(
    answers,
    'Technical Fullstack New',
    FORM_FIELDS.deployTime,
    input.deployTime,
  );
  pushServices(answers, 'Technical Fullstack New', 'FULLSTACK', input.services);
  pushDatabase(answers, 'Technical Fullstack New', DATABASE_FIELDS.fullstack, {
    types: input.fullstackDatabaseTypes,
    name: input.fullstackDatabaseName,
    table: input.fullstackTableName,
    column: input.fullstackColumnName,
    description: input.fullstackDatabaseDescription,
  });
  pushText(answers, 'Technical Fullstack New', FORM_FIELDS.envVault, input.envVault);

  return answers;
}

/** Field wajib pada form yang harus terisi sebelum autofill dijalankan. */
export function missingRequiredFields(input: DeploymentFormInput): string[] {
  const missing: string[] = [];
  if (!input.environment) missing.push('Environment');
  if (!input.squad) missing.push('Skuad');
  if (!input.judul.trim()) missing.push('Judul Release Dev');
  if (!input.tiket.trim()) missing.push('Tiket Taiga Deployment Checklist Dev');
  if (!input.picDeveloper.trim()) missing.push('PIC Developer');
  if (input.picQa.length === 0) missing.push('PIC Software Quality Assurance');
  if (!input.picHoe.trim()) missing.push('PIC HoE');
  if (!input.deployDate.trim()) missing.push('Tanggal Deploy');
  return missing;
}
