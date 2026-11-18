import type { DeploymentFormInput } from './model';

export const DEPLOYMENT_FORM_URL =
  'https://forms.office.com/pages/responsepage.aspx?id=AUuJHtOwQk6t9xkohyiixwSkjYOhAcFKuJZ6k2T9OEpUQjNLUU5SQzYxRFFXQThTOEg4TjdPWjM5MSQlQCN0PWcu';

/** Id pertanyaan form Deployment; judul tidak unik, jadi selalu pakai id. */
export const FORM_FIELDS = {
  environment: { id: 'r88a05ef5957447c2bb592f3209c3dad8', title: 'Environment' },
  squad: { id: 'r643b490e8c3f4be2a0d508b362c7014b', title: 'Skuad' },
  ticket: {
    id: 'r95339807a6714dad84d9c7571ccaaeab',
    title: 'Tiket Taiga Deployment Checklist Dev',
  },
  releaseTitle: {
    id: 'r6b992f1f4bff405cba47ec8955af2bd9',
    title: 'Judul Release Dev',
  },
  picDeveloper: {
    id: 'r146b66c57e2c44c29ea11bbafe1003f6',
    title: 'PIC Developer',
  },
  picQa: {
    id: 'r1c3c633db15e46a891d266ca5c307a1e',
    title: 'PIC Software Quality Assurance',
  },
  picHoe: { id: 're2a534aeeae043c4a264a1ed6a2061e9', title: 'PIC HoE' },
  deployDate: { id: 'r95430825cb46499ba534c74a62d80939', title: 'Tanggal Deploy' },
  deployTime: { id: 'r3e4ba486085842d7991da12796ecc2d3', title: 'Waktu Deploy' },
  deployTimeBe: {
    id: 'rceaba83828ad4d56a908b94aad9249d3',
    title: 'Waktu Deploy BE',
  },
  deployTimeFe: {
    id: 'r6059797939ef4c8bb53b9fa9dfb9dfb8',
    title: 'Waktu Deploy FE',
  },
  envVault: { id: 'r3534533d4bff4ee2aad703c2f3d87e03', title: 'Env/Vault' },
  envVaultBe: { id: 'r5417bac3621244329ebc39e7d8622d75', title: 'Env/Vault BE' },
  envVaultFe: { id: 'r8c88f7583fa04db88f581a907c2a2153', title: 'Env/Vault FE' },
  kafkaMessage: {
    id: 'rdc2253ecadf44414825d3e0de6c18b5a',
    title: 'Kafka Message',
  },
  kafkaConsumer: {
    id: 'r88a4923bd6b946bd99650f31ecd0e021',
    title: 'Kafka Consumer',
  },
  kafkaProducer: {
    id: 'r2e39819b75d54cb7a7a14a42101e0f80',
    title: 'Kafka Producer',
  },
  kafkaTopic: {
    id: 'r8375bd09dfef404e86f5006af2b6bd1d',
    title: 'Kafka Topic Yang Terdampak',
  },
} as const;

/**
 * Pertanyaan database muncul dua kali dengan judul sama. Keduanya diisi
 * dengan nilai yang sama karena tidak ada pembeda yang jelas di form.
 */
const DATABASE_FIELDS = {
  type: [
    { id: 'r50fd3d69ff5d468cb9b2286f59d161b7', title: 'Database Yang Terdampak' },
    { id: 'rbb7c438b60684d43acac19129d1bbf8a', title: 'Database Yang Terdampak' },
  ],
  name: [
    { id: 'r9a2c4d4a2d6b419f885f7f37de251495', title: 'Nama Database' },
    { id: 'r8b22b2429d5d4cf6a09806e1cd87fbca', title: 'Nama Database' },
  ],
  table: [
    { id: 'r5c8ccb197b8f403b997d51749879d516', title: 'Nama Tabel Database' },
    { id: 'r818f9d7a471d4d349d492e71de417b9b', title: 'Nama Tabel Database' },
  ],
  column: [
    { id: 'r5d90946e1c7b4c0e9962f2169c21be02', title: 'Nama Field/Kolom Database' },
    { id: 'rca97995d77784b0d9962ed20feb76060', title: 'Nama Field/Kolom Database' },
  ],
  description: [
    { id: 'r5595c8a7c69e4f0ea01d9b998cf2e283', title: 'Deskripsi Perubahan Database' },
    { id: 'ra363f35b9c364d77bfb781bd899be603', title: 'Deskripsi Perubahan Database' },
  ],
} as const;

export interface FormServiceField {
  id: string;
  name: string;
}

/** Pertanyaan "Service <nama>" pada form Deployment. */
export const FORM_SERVICE_FIELDS: FormServiceField[] = [
  { id: 'r1a9a64d62bc14703a1ee6b144afc29ae', name: 'ms-payment' },
  { id: 'rd3ae9eccc1da4a85b6bde9654990851c', name: 'ms-control-tower' },
  { id: 'r667e2065d066480e8741091997be510c', name: 'ms-disbursement' },
  { id: 'rd36d4ad9fa4240e9bc3bcd3f46d0240f', name: 'ms-financing' },
  { id: 'rab22eb40ea28448c8da64312b948f1b3', name: 'ms-chat-ai' },
  { id: 'r8eda07877098414ca5561cf57c34707e', name: 'fe-control tower' },
  { id: 'r1cbec51485cd467184840df52ee46a47', name: 'info-padi' },
  { id: 'r8aefb1889204436493b573ac9a61854b', name: 'ms-fulfillment' },
  { id: 'r135b2f0998414726ad1f7d5b58781b1d', name: 'mobile-buyer' },
  { id: 'rdc871a00170e428ab6cb896f977579c7', name: 'fe-solution-center' },
  { id: 'rc53f9fbd9d144a539e0ad0ab665021ff', name: 'ms-document' },
  { id: 'rc737febd5a9f4534a82a4eab2726f9ea', name: 'api-gateway' },
  { id: 'r724d4d222b174799b5912f08bfe984a0', name: 'ms-user' },
  { id: 'rf9d1fc15da2444f1b2b3df641ef23255', name: 'fe-seller' },
  { id: 'rbfed1a6cabba44248d8f3e9cacd4f363', name: 'ms-masterdata' },
  { id: 'r358f4d0e0b6f4ebdac69e3672f6a52ff', name: 'fe-portal-financing' },
  { id: 'r4adbea8461214899b6e582ceab4cf8df', name: 'ms-openapi-bumn' },
  { id: 'r19e2b9a51f9a492f8deff686e28f953f', name: 'ms-rfq' },
  { id: 'r371824a9cd9d486b97770e636658727c', name: 'fe-padisera-landingpage' },
  { id: 'refce5efd39ee473eb9b8c654fca64be4', name: 'fe-cms-mimin' },
  { id: 'rf09ebbb0d7d1465c827abd288410050f', name: 'ms-bumn-solution-center' },
  { id: 'r1dfd3f6e11e54c84816f69b5e4e73cd3', name: 'ms-order' },
  { id: 'rf5e5c9444a7e431f9ec98ff3f869b74d', name: 'ms-notification' },
  { id: 'r39002d385a254518bdba4fcd73ce803e', name: 'ms-core' },
  { id: 'r828c557566a34bb697289820b84ba6aa', name: 'ms-openapi-gateway' },
  { id: 'rc1c064442c494ceaa1b0c1c0ea70dd23', name: 'fe-buyer' },
  { id: 'rd9c63c2b402e4905ad33a99540ccd7b4', name: 'ms-purchase' },
  { id: 'rcf44b7721d084fa2848708da447c8194', name: 'ms-core-chat' },
  { id: 'r42ed36d4751f43d783491031b81a2a48', name: 'mobile-seller' },
  { id: 'r69153871b58c4bbb9f37d8cad6c442e0', name: 'fe-openapi-docs' },
  { id: 'rd0073b76a2d44a1daa2768749266243d', name: 'fe-core-chat' },
  { id: 'r81a96154081a4922b3beef86e15b2701', name: 'ms-product' },
  { id: 'r996318b042cd49d1b11e5104b915128f', name: 'ms-transaction' },
  { id: 'rcd8a7a0253ae4a948f328cf2a30d61ec', name: 'fe-frontend-shared' },
  { id: 're1c967207f3d4518b7ab41d47a1ad5c1', name: 'dashboard-developer' },
];

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
  kind: FormAnswerKind;
  value: string | string[];
}

function pushText(
  answers: FormAnswer[],
  field: { id: string; title: string },
  value: string,
) {
  if (!value.trim()) return;
  answers.push({ ...field, kind: 'text', value: value.trim() });
}

function pushChoice(
  answers: FormAnswer[],
  field: { id: string; title: string },
  values: string[],
) {
  const selected = values.filter((value) => value.trim());
  if (selected.length === 0) return;
  answers.push({ ...field, kind: 'choice', value: selected });
}

/** Susun jawaban form dari isian halaman; field kosong tidak dikirim. */
export function buildFormAnswers(input: DeploymentFormInput): FormAnswer[] {
  const answers: FormAnswer[] = [];

  pushChoice(answers, FORM_FIELDS.environment, [input.environment]);
  pushChoice(answers, FORM_FIELDS.squad, [input.squad]);
  pushText(answers, FORM_FIELDS.releaseTitle, input.judul);
  pushText(answers, FORM_FIELDS.ticket, input.tiket);
  pushChoice(answers, FORM_FIELDS.picDeveloper, [input.picDeveloper]);
  pushChoice(answers, FORM_FIELDS.picQa, input.picQa);
  pushChoice(answers, FORM_FIELDS.picHoe, [input.picHoe]);

  if (input.deployDate.trim()) {
    answers.push({
      ...FORM_FIELDS.deployDate,
      kind: 'date',
      value: input.deployDate.trim(),
    });
  }
  pushText(answers, FORM_FIELDS.deployTime, input.deployTime);
  pushText(answers, FORM_FIELDS.deployTimeBe, input.deployTimeBe);
  pushText(answers, FORM_FIELDS.deployTimeFe, input.deployTimeFe);

  pushText(answers, FORM_FIELDS.envVault, input.envVault);
  pushText(answers, FORM_FIELDS.envVaultBe, input.envVaultBe);
  pushText(answers, FORM_FIELDS.envVaultFe, input.envVaultFe);

  for (const field of DATABASE_FIELDS.type) {
    pushChoice(answers, field, input.databaseTypes);
  }
  for (const field of DATABASE_FIELDS.name) {
    pushText(answers, field, input.databaseName);
  }
  for (const field of DATABASE_FIELDS.table) {
    pushText(answers, field, input.tableName);
  }
  for (const field of DATABASE_FIELDS.column) {
    pushText(answers, field, input.columnName);
  }
  for (const field of DATABASE_FIELDS.description) {
    pushText(answers, field, input.databaseDescription);
  }

  pushText(answers, FORM_FIELDS.kafkaMessage, input.kafkaMessage);
  pushText(answers, FORM_FIELDS.kafkaConsumer, input.kafkaConsumer);
  pushText(answers, FORM_FIELDS.kafkaProducer, input.kafkaProducer);
  pushText(answers, FORM_FIELDS.kafkaTopic, input.kafkaTopic);

  for (const link of input.services) {
    if (!link.service || !link.url.trim()) continue;
    const field = FORM_SERVICE_FIELDS.find((item) => item.name === link.service);
    if (!field) continue;
    answers.push({
      id: field.id,
      title: `Service ${field.name}`,
      kind: 'text',
      value: link.url.trim(),
    });
  }

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
