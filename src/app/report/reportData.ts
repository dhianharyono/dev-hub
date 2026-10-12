// Structured dataset extracted 1:1 from public/Laporan-dhian haryono-2026-10-01.pdf

export interface ProjectScopeItem {
  name: string;
  commits: number;
  mrs: number;
  note: string;
  page: number;
}

export interface ComponentScore {
  name: string;
  score: number;
}

export interface QualityIndicator {
  label: string;
  value: string;
  status: 'critical' | 'warn' | 'good';
  statusText: string;
}

export interface MonthlyContribution {
  month: string;
  commits: number;
  activeDays: number | string;
  linesChanged: string;
  mrsMerged: number | string;
  reviews: number | string;
}

export interface ProjectContribution {
  project: string;
  commits: number;
  lines: string;
}

export interface FileTypeContribution {
  ext: string;
  linesAdded: string;
}

export interface HotspotFile {
  file: string;
  project: string;
  commits: number;
  reworkLines: string;
}

export interface ReworkExample {
  file: string;
  initialCommit: string;
  modifyingCommit: string;
  lines: number;
  gap: string;
}

export interface FullReportData {
  meta: {
    title: string;
    talentName: string;
    username: string;
    email: string;
    mergedIdentitiesNote: string;
    periodText: string;
    createdText: string;
    totalProjectsCount: number;
    footerTitle: string;
    totalPages: number;
  };
  summaryKpis: {
    contributors: { value: number; detail: string };
    commits: { value: string; detail: string };
    lines: { added: string; deleted: string };
    mergeRequests: { value: string };
  };
  overallScore: {
    name: string;
    score: number;
    grade: string;
    gradeLabel: string;
  };
  rankingTable: {
    rank: number;
    name: string;
    grade: string;
    gradeLabel: string;
    overall: number;
    productivity: number;
    quality: number;
    collaboration: number;
    consistency: number;
    months: number;
    commitsPerMonth: string;
    selfRework: string;
    footnote: string;
  };
  projects: ProjectScopeItem[];
  methodology: {
    intro: string;
    components: {
      name: string;
      weight: string;
      calculation: string;
    }[];
    assignmentTenure: string;
    reworkDetection: string;
    gradeScale: { grade: string; range: string; label: string; color: string }[];
    identityMerge: {
      merged: string;
      notMerged: string;
    };
    limitations: string[];
  };
  talentProfile: {
    metrics: {
      tenure: { title: string; value: string; detail: string; sub: string };
      commits: { title: string; value: string; detail: string; sub: string };
      lines: { title: string; value: string };
      projects: { title: string; value: string; detail: string };
      mergeRequests: { title: string; value: string; detail: string };
      reviews: { title: string; value: string; detail: string };
      codeSurvival: { title: string; value: string; detail: string };
    };
    componentScores: ComponentScore[];
    qualityIndicators: QualityIndicator[];
    weeklyCommits: { week: string; count: number }[];
    monthlyContributions: MonthlyContribution[];
    monthlySummary: string;
    commitHeatmap: {
      days: string[];
      slots: string[];
      matrix: number[][]; // 7 days x 8 time slots (0-4 intensity)
    };
  };
  aiAnalysis: {
    model: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    projectContributions: ProjectContribution[];
    fileTypes: FileTypeContribution[];
    hotspots: HotspotFile[];
  };
  reworkExamples: ReworkExample[];
}

export const referenceReportData: FullReportData = {
  meta: {
    title: 'Laporan Performa: dhian haryono',
    talentName: 'dhian haryono',
    username: 'telkomdev-dhianharyono',
    email: 'dhianharyono.dh@gmail.com',
    mergedIdentitiesNote: 'Identitas tergabung: telkomdev-dhianharyono',
    periodText: 'Periode 03 Jul 2026 - 01 Okt 2026',
    createdText: 'dibuat 01 Okt 2026',
    totalProjectsCount: 176,
    footerTitle: 'GitLab Talent Tracer : Rahasia, untuk keperluan internal',
    totalPages: 10,
  },
  summaryKpis: {
    contributors: { value: 1, detail: 'dari 78 terdeteksi' },
    commits: { value: '10.700', detail: '10.683 dianalisis diff' },
    lines: { added: '+2.427.984', deleted: '-761.256 dihapus' },
    mergeRequests: { value: '4.421' },
  },
  overallScore: {
    name: 'dhian haryono',
    score: 63,
    grade: 'C',
    gradeLabel: 'Cukup',
  },
  rankingTable: {
    rank: 1,
    name: 'dhian haryono',
    grade: 'C',
    gradeLabel: 'Cukup',
    overall: 63,
    productivity: 83,
    quality: 45,
    collaboration: 44,
    consistency: 92,
    months: 3,
    commitsPerMonth: '146,2',
    selfRework: '21,1%',
    footnote:
      '* data terbatas (< 5 commit, < 50 baris, atau masa penugasan < 1 bulan). † mulai bertugas setelah awal periode : dinilai dari rata-rata per bulan masa penugasannya.',
  },
  methodology: {
    intro:
      'Seluruh angka dihitung otomatis dari data GitLab (commit, diff, merge request, komentar review) pada periode laporan. Skor bersifat heuristik dan relatif terhadap tim yang dianalisis : gunakan sebagai bahan diskusi, bukan satu-satunya dasar penilaian.',
    components: [
      {
        name: 'Produktivitas',
        weight: '30%',
        calculation:
          'Peringkat relatif dalam tim untuk rata-rata per bulan masa penugasan: commit (non-merge), volume perubahan baris (skala log), MR yang di-merge, serta rasio hari aktif terhadap hari kerja masa penugasan. Talent yang baru bergabung tidak dirugikan oleh total yang lebih kecil.',
      },
      {
        name: 'Kualitas Kode',
        weight: '35%',
        calculation:
          '100 dikurangi penalti: self-rework (baris kode sendiri yang diubah lagi dalam 21 hari), kode yang diubah orang lain dalam window yang sama, rasio commit bug-fix atas kode sendiri, dan revert.',
      },
      {
        name: 'Kolaborasi',
        weight: '20%',
        calculation:
          'Peringkat relatif untuk MR yang dibuat, komentar review yang diberikan, MR orang lain yang direview/di-merge.',
      },
      {
        name: 'Konsistensi',
        weight: '15%',
        calculation:
          'Dihitung dalam masa penugasan masing-masing: 35% hari aktif dibanding hari kerja (target ≥60%), 35% minggu yang memiliki commit, 15% kestabilan jumlah commit antar bulan (bila ≥ 2 bulan penuh), 15% kualitas pesan commit.',
      },
    ],
    assignmentTenure:
      'Tidak semua talent bertugas sepanjang periode laporan. Untuk setiap orang ditentukan tanggal mulai penugasan dengan urutan prioritas: (1) tanggal yang diatur manual, (2) tanggal ditambahkan sebagai member proyek atau aktivitas pertama (commit/MR/review), mana yang lebih awal. Bila tanggal itu berada dalam 30 hari pertama periode, talent dianggap sudah bertugas sejak awal periode. Tanggal selesai default-nya akhir periode, kecuali diatur manual (mis. talent yang sudah pindah). Produktivitas, kolaborasi, dan konsistensi lalu dihitung sebagai rata-rata per bulan di dalam rentang itu (minimal dihitung 1 bulan).',
    reworkDetection:
      'Riwayat setiap file diputar ulang commit demi commit untuk mengetahui siapa yang menulis tiap baris (mirip git blame). Jika sebuah commit menghapus/mengganti baris yang ditulis kurang dari 21 hari sebelumnya, baris itu dihitung sebagai rework. Bila penulis yang sama mengubah kodenya sendiri melalui commit bertanda perbaikan (fix, bug, hotfix, perbaikan, dll.), itu dicatat sebagai bug-fix atas kode sendiri : indikator kode yang belum matang saat pertama kali di-commit. Baris trivial (kosong, kurung tunggal) dan file yang dikecualikan (lockfile, hasil build, aset) tidak dihitung.',
    gradeScale: [
      { grade: 'A', range: '≥ 85', label: 'Sangat Baik', color: 'badge-green' },
      { grade: 'B', range: '70-84', label: 'Baik', color: 'badge-cyan' },
      { grade: 'C', range: '55-69', label: 'Cukup', color: 'badge-amber' },
      { grade: 'D', range: '40-54', label: 'Perlu Perhatian', color: 'badge-orange' },
      { grade: 'E', range: '< 40', label: 'Kurang', color: 'badge-rose' },
    ],
    identityMerge: {
      merged:
        'Digabung sebagai orang yang sama: isnanrizqi ↔ isnanrizqi, hanifkharismadini ↔ hanifkharismadini, ditaaprilani ↔ ditaaprilani, eno ↔ eno, raka ↔ raka, ariobima ↔ ariobima, chelsya ↔ chelsya, dhanakbar ↔ dhanakbar, tommykurniawan ↔ tommykurniawan, andri ↔ andripratama, ardhi ↔ ardhikarn, dika ↔ dikaangkasa, fadhil ↔ fadhilaisnaini, group4522bot ↔ group4522bot177b9c7ac3c2d8d27038225a2b287e6e, hanafi ↔ hanafifirdaus, hasyimamr ↔ hasyimamr08, iman ↔ imanirvansyah, irfan ↔ irfanpermadi, muhammadriza ↔ muhammadrizaldi, ninggar ↔ ninggar17, observatoriumcicd ↔ observatoriumcicdgroup, prayoga ↔ prayogaadisetyawan, project27591bot ↔ project27591bot1, rach ↔ rachmansyahril, raditya ↔ radityacandra.',
      notMerged:
        'Tidak digabung karena ambigu: aditya → adityaeka26 / adityan / adityaudi; group26646bot → group26646bot1 / group26646bot2 / group26646bot3 / group26646bot4 / group26646bot5 / group26646bot7 / group26646bot8; naufal → naufalherwandi / naufalmuhammadherwandi / naufalrzld; project20718bot → project20718bot1 / project20718bot2; project23628bot → project23628bot1 / project23628bot2; project24323bot → project24323bot1 / project24323bot2; project24393bot → project24393bot1 / project24393bot2; telkom → telkomdds / telkomdoa.',
    },
    limitations: [
      'Rework juga bisa berasal dari refactor yang disengaja atau perubahan kebutuhan; lihat contoh di halaman tiap kontributor.',
      'Jumlah baris dan commit tidak mencerminkan kompleksitas atau nilai bisnis pekerjaan.',
      'Identitas commit (nama/email) dipetakan ke akun GitLab secara otomatis. Identitas yang mirip : beda huruf besar/kecil, titik/underscore, atau awalan nama (mis. ario ↔ ario.bima) : digabung sebagai satu orang; alias dapat diatur di menu Pengaturan.',
      'Kontributor bertanda data terbatas memiliki < 5 commit atau < 50 baris ditambah : skornya kurang representatif.',
      'Cabang: semua cabang. Commit dengan diff dianalisis: 10.683 dari 10.700.',
    ],
  },
  talentProfile: {
    metrics: {
      tenure: {
        title: 'MASA PENUGASAN',
        value: '3 bln',
        detail: 'mulai 03 Jul 2026 · 146,2/bulan · 60 hari aktif',
        sub: 'aktif sejak awal periode',
      },
      commits: {
        title: 'COMMIT',
        value: '437',
        detail: 'rata-rata 591 baris/commit',
        sub: '1.107 file disentuh',
      },
      lines: {
        title: 'BARIS KODE',
        value: '+182.854 / −75.479',
      },
      projects: {
        title: 'PROYEK',
        value: '8',
        detail: '1.107 file disentuh',
      },
      mergeRequests: {
        title: 'MERGE REQUEST',
        value: '105 / 112',
        detail: 'merged / dibuat · median 0 jam',
      },
      reviews: {
        title: 'REVIEW',
        value: '1',
        detail: 'komentar di 1 MR orang lain',
      },
      codeSurvival: {
        title: 'KODE BERTAHAN',
        value: '79%',
        detail: 'tidak diubah dalam 21 hari',
      },
    },
    componentScores: [
      { name: 'Produktivitas', score: 83 },
      { name: 'Kualitas Kode', score: 45 },
      { name: 'Kolaborasi', score: 44 },
      { name: 'Konsistensi', score: 92 },
    ],
    qualityIndicators: [
      {
        label: 'Self-rework (kode sendiri diubah lagi)',
        value: '21,1%',
        status: 'critical',
        statusText: '✕ Kritis',
      },
      {
        label: 'Commit bug-fix atas kode sendiri',
        value: '103 (23,6%)',
        status: 'critical',
        statusText: '✕ Kritis',
      },
      {
        label: 'Kode diubah orang lain ≤ 21 hari',
        value: '0,1%',
        status: 'good',
        statusText: '✓ Baik',
      },
      {
        label: 'Proporsi commit "fix"',
        value: '30,4%',
        status: 'warn',
        statusText: '! Waspada',
      },
      {
        label: 'Revert',
        value: '0',
        status: 'good',
        statusText: '✓ Baik',
      },
      {
        label: 'Pesan commit deskriptif',
        value: '100%',
        status: 'good',
        statusText: '✓ Baik',
      },
    ],
    weeklyCommits: [
      { week: '29 Jun', count: 7 },
      { week: '06 Jul', count: 8 },
      { week: '13 Jul', count: 14 },
      { week: '20 Jul', count: 15 },
      { week: '27 Jul', count: 32 },
      { week: '03 Agu', count: 14 },
      { week: '10 Agu', count: 62 },
      { week: '17 Agu', count: 84 },
      { week: '24 Agu', count: 61 },
      { week: '31 Agu', count: 56 },
      { week: '07 Sep', count: 49 },
      { week: '14 Sep', count: 44 },
      { week: '21 Sep', count: 15 },
      { week: '28 Sep', count: 4 },
    ],
    monthlyContributions: [
      {
        month: 'Juli 2026 (sebagian)',
        commits: 28,
        activeDays: 11,
        linesChanged: '8.687',
        mrsMerged: 17,
        reviews: 0,
      },
      {
        month: 'Agustus 2026',
        commits: 208,
        activeDays: 22,
        linesChanged: '117.367',
        mrsMerged: 49,
        reviews: 1,
      },
      {
        month: 'September 2026',
        commits: 197,
        activeDays: 26,
        linesChanged: '130.297',
        mrsMerged: 37,
        reviews: 0,
      },
      {
        month: 'Oktober 2026 (sebagian)',
        commits: 4,
        activeDays: 1,
        linesChanged: '1.982',
        mrsMerged: 2,
        reviews: 0,
      },
      {
        month: 'Rata-rata / bulan',
        commits: 146.2,
        activeDays: '92,3% hari kerja',
        linesChanged: '86.407',
        mrsMerged: '35,1',
        reviews: '0,3',
      },
    ],
    monthlySummary: 'Minggu dengan commit: 92,9% · Kestabilan bulanan: 62,5%',
    commitHeatmap: {
      days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      slots: ['00', '03', '06', '09', '12', '15', '18', '21'],
      matrix: [
        [1, 0, 0, 3, 4, 3, 1, 2], // Sen
        [0, 0, 0, 2, 2, 3, 3, 2], // Sel
        [2, 1, 0, 1, 2, 4, 4, 2], // Rab
        [0, 0, 0, 2, 4, 3, 3, 1], // Kam
        [1, 1, 0, 3, 3, 2, 3, 0], // Jum
        [0, 3, 1, 0, 0, 1, 2, 2], // Sab
        [1, 1, 0, 0, 0, 3, 0, 1], // Min
      ],
    },
  },
  aiAnalysis: {
    model: 'LLM MIDAS',
    summary:
      'Dhian menunjukkan produktivitas tinggi (rata-rata 146 commit & 35 MR merged per bulan) dan konsistensi sangat baik (92% hari aktif, 93% minggu berkomitmen) selama masa penugasan 3 bulan. Namun, skor kualitas (45) dan kolaborasi (44) menurunkan overall ke 63 (C). Catatan: volume baris besar bukan ukuran nilai, dan sebagian rework berupa refactor yang wajar; data Oktober baru 4 hari (cut-off).',
    strengths: [
      'Konsistensi kerja sangat baik (skor 92): aktivitas merata di Juli-September, tanpa periode vakum.',
      'Kualitas pesan commit 100%, 0 revert, dan kode bertahan 79% : menunjukkan disiplin teknis dasar yang baik.',
      'Inisiatif engineering positif: refactor modularisasi komponen monolitik, migrasi Supabase → PostgreSQL, penambahan precommit lint, serta integrasi multi-LLM (Groq, Gemini).',
      'Kontribusi lintas repositori (6 proyek), terutama dominan di dashboard-developer.',
    ],
    improvements: [
      'Pola perubahan berulang pada file yang sama: hotspot seperti `AiContextCanvas.tsx` (12 commit, 2.728 baris rework), `knowledge/page.tsx` (16 commit), dan `generate-gmv-sql.ts` (28 commit) : indikasi fitur dipecah/dikoreksi bertahap, bukan sekali final.',
      'Bug fix atas kode sendiri cukup tinggi: 103 commit, 30,4% commit berlabel fix. Sebagian rework terjadi sangat cepat setelah commit awal (mis. 592 baris diubah dalam 0,3 hari), yang berpotensi dicegah lewat validasi awal.',
      'Ukuran commit besar (rata-rata 591 baris) memperbesar risiko regresi.',
    ],
    projectContributions: [
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 341,
        lines: '+162.577 / −67.962',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/padiumkm-shared/frontend-shared',
        commits: 40,
        lines: '+2.593 / −917',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/torasera/frontend-seller',
        commits: 25,
        lines: '+8.676 / −4.677',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-seller',
        commits: 19,
        lines: '+6.437 / −1.638',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-controltower',
        commits: 6,
        lines: '+657 / −72',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/torasera/frontend-buyer',
        commits: 2,
        lines: '+691 / −2',
      },
      {
        project: 'devops/gitops/gitops-smb',
        commits: 2,
        lines: '+6 / −4',
      },
      {
        project: 'telkom-digital/smb/padiumkm-marketplace/padiumkm-website-automation',
        commits: 2,
        lines: '+1.217 / −207',
      },
    ],
    fileTypes: [
      { ext: '.tsx', linesAdded: '98.242' },
      { ext: '.ts', linesAdded: '76.516' },
      { ext: '.md', linesAdded: '3.300' },
      { ext: '.txt', linesAdded: '2.282' },
      { ext: '.sql', linesAdded: '473' },
      { ext: '.jenkinsfile', linesAdded: '440' },
      { ext: '.css', linesAdded: '387' },
      { ext: '.php', linesAdded: '347' },
    ],
    hotspots: [
      {
        file: 'src/app/dashboard/ai-context/components/AiContextCanvas.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 12,
        reworkLines: '2.728',
      },
      {
        file: 'src/app/dashboard/wbs/page.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 13,
        reworkLines: '1.453',
      },
      {
        file: 'src/app/dashboard/knowledge/page.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 16,
        reworkLines: '1.417',
      },
      {
        file: 'src/lib/telegram/generate-gmv-sql.ts',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 28,
        reworkLines: '1.343',
      },
      {
        file: 'src/lib/insight/insight-service.ts',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 7,
        reworkLines: '1.187',
      },
      {
        file: 'src/components/DashboardShell.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 29,
        reworkLines: '1.113',
      },
      {
        file: 'src/app/dashboard/users/UsersTableClient.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 24,
        reworkLines: '1.034',
      },
      {
        file: 'src/app/dashboard/telegram-whitelist/TelegramWhitelistClient.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 23,
        reworkLines: '1.017',
      },
      {
        file: 'src/lib/ai/chat.ts',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 42,
        reworkLines: '903',
      },
      {
        file: 'src/app/dashboard/chat/page.tsx',
        project: 'telkom-digital/smb/padiumkm-marketplace/dashboard-developer',
        commits: 37,
        reworkLines: '880',
      },
    ],
  },
  reworkExamples: [
    {
      file: 'src/app/dashboard/wbs/page.tsx',
      initialCommit: '8ba8909f feat: implementasi Knowledge Base...',
      modifyingCommit: 'a0ad67d3 refactor(dashboard): modularize l...',
      lines: 950,
      gap: '3 hr',
    },
    {
      file: 'src/app/dashboard/ai-context/components/AiContextCanvas.tsx',
      initialCommit: 'dd2e5231 feat(ai-context): standardize cat...',
      modifyingCommit: 'e7c802b0 refactor(ui): decompose monolithi...',
      lines: 617,
      gap: '7,7 hr',
    },
    {
      file: 'src/app/dashboard/ai-context/components/AiContextCanvas.tsx',
      initialCommit: '12c08ed5 feat(ai-context): implement AI Co...',
      modifyingCommit: 'dd2e5231 feat(ai-context): standardize cat...',
      lines: 592,
      gap: '0,3 hr',
    },
    {
      file: 'src/lib/insight/queries.ts',
      initialCommit: '6829e3fe refactor(architecture): decompose...',
      modifyingCommit: '26a0e299 refactor(insight): modularize que...',
      lines: 520,
      gap: '0 hr',
    },
    {
      file: 'src/app/dashboard/knowledge/page.tsx',
      initialCommit: '16e5e7f6 feat(knowledge): implement MoM sa...',
      modifyingCommit: 'a0ad67d3 refactor(dashboard): modularize l...',
      lines: 491,
      gap: '3,2 hr',
    },
    {
      file: 'src/app/dashboard/ai-context/components/AiContextCanvas.tsx',
      initialCommit: '12c08ed5 feat(ai-context): implement AI Co...',
      modifyingCommit: 'e7c802b0 refactor(ui): decompose monolithi...',
      lines: 450,
      gap: '7,9 hr',
    },
    {
      file: 'src/app/dashboard/telegram-whitelist/TelegramWhitelistClient.tsx',
      initialCommit: 'b0c606ed feat(telegram): implement dynamic...',
      modifyingCommit: 'a0ad67d3 refactor(dashboard): modularize l...',
      lines: 440,
      gap: '4,6 hr',
    },
    {
      file: 'src/app/dashboard/wbs/components/WbsDetailModal.tsx',
      initialCommit: 'a0ad67d3 refactor(dashboard): modularize l...',
      modifyingCommit: 'd8cd9443 refactor(ui): decompose monolithi...',
      lines: 347,
      gap: '0,1 hr',
    },
  ],
  projects: [
  {
    "mrs": 50,
    "page": 1,
    "commits": 622,
    "name": "satu-data-digital/airflow",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-gse",
    "note": "2 error: commits: GitLab 403 pada /projects/14986/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-my-sooltan",
    "note": "2 error: commits: GitLab 403 pada /projects/15496/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-activate-internal",
    "note": "2 error: commits: GitLab 403 pada /projects/15489/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-customer",
    "note": "2 error: commits: GitLab 403 pada /projects/15483/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-evaluate-and-pay",
    "note": "2 error: commits: GitLab 403 pada /projects/15487/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-explore",
    "note": "2 error: commits: GitLab 403 pada /projects/15482/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-explore-internal",
    "note": "2 error: commits: GitLab 403 pada /projects/16158/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-get-support-customer",
    "note": "2 error: commits: GitLab 403 pada /projects/15492/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mycarrier-get-support-internal",
    "note": "2 error: commits: GitLab 403 pada /projects/15493/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-am-performance",
    "note": "2 error: commits: GitLab 403 pada /projects/15484/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-catalog",
    "note": "2 error: commits: GitLab 403 pada /projects/15488/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-customer-assurance",
    "note": "2 error: commits: GitLab 403 pada /projects/17356/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-dashboard-management",
    "note": "2 error: commits: GitLab 403 pada /projects/15486/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-delivery",
    "note": "2 error: commits: GitLab 403 pada /projects/15495/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-newia",
    "note": "2 error: commits: GitLab 403 pada /projects/15491/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-rpa",
    "note": "2 error: commits: GitLab 403 pada /projects/15490/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 1,
    "commits": 0,
    "name": "doceng-ewz/api-contract-mytens-solution-management",
    "note": "2 error: commits: GitLab 403 pada /projects/15485/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "doceng-ewz/api-contract-pipeline",
    "note": "2 error: commits: GitLab 403 pada /projects/14945/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 1,
    "page": 2,
    "commits": 14,
    "name": "telkom-digital/smb/padiumkm-marketplace/danantara/be-digital-hub",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkomdev-RizkiSyabanAryanto/be-documentation",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "ewd-mysooltan/bizy-ws",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/cerberus",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/template/codebase-nestjs",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "wiki/content",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "ewd-mysooltan/cyberduck-docs",
    "note": ""
  },
  {
    "mrs": 80,
    "page": 2,
    "commits": 682,
    "name": "telkom-digital/smb/padiumkm-marketplace/dashboard-developer",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/referral-dashboard/dashboard-referral-api",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/referral-dashboard/dashboard-referral-web",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/dataform",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/dbt-sdd",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/debezium",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "ewd-mysooltan/developer-documentation",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "atriadha99/example-project",
    "note": "2 error: commits: GitLab 403 pada /projects/27162/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 9,
    "page": 2,
    "commits": 15,
    "name": "telkom-digital/smb/padiumkm-marketplace/core/fe-core-solusi",
    "note": ""
  },
  {
    "mrs": 3,
    "page": 2,
    "commits": 16,
    "name": "telkom-digital/smb/padiumkm-marketplace/danantara/fe-digital-hub",
    "note": ""
  },
  {
    "mrs": 11,
    "page": 2,
    "commits": 53,
    "name": "telkom-digital/smb/padiumkm-marketplace/torasera/frontend-buyer",
    "note": ""
  },
  {
    "mrs": 10,
    "page": 2,
    "commits": 42,
    "name": "telkom-digital/smb/padiumkm-marketplace/torasera/frontend-seller",
    "note": ""
  },
  {
    "mrs": 90,
    "page": 2,
    "commits": 351,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-shared/frontend-shared",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/galois",
    "note": ""
  },
  {
    "mrs": 34,
    "page": 2,
    "commits": 130,
    "name": "devops/gitops/gitops-smb",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/governance-cookbook",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/info-padi/info-padi-api",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/info-padi/info-padi-cms",
    "note": ""
  },
  {
    "mrs": 18,
    "page": 2,
    "commits": 72,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/info-padi/info-padi-web",
    "note": ""
  },
  {
    "mrs": 1,
    "page": 2,
    "commits": 6,
    "name": "devops/gitops/gitops-template/k3s-cluster",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "satu-data-digital/k8s-helm-charts",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/kdmp/kdmp-backend-core",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 2
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/kdmp/kdmp-frontend-dashboard",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 2
  },
  {
    "mrs": 4,
    "page": 2,
    "commits": 14,
    "name": "satu-data-digital/laminar",
    "note": ""
  },
  {
    "mrs": 4,
    "page": 2,
    "commits": 18,
    "name": "satu-data-digital/umbrella/laminar",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkomdev/legion-pattern-dashboard",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 2,
    "commits": 0,
    "name": "telkomdev/legion-pattern-login-register",
    "note": ""
  },
  {
    "mrs": 25,
    "page": 2,
    "commits": 92,
    "name": "telkom-digital/smb/padiumkm-marketplace/mobile-application/mobile-buyer",
    "note": ""
  },
  {
    "mrs": 48,
    "page": 3,
    "commits": 368,
    "name": "telkom-digital/smb/padiumkm-marketplace/mobile-application/mobile-mono-repo",
    "note": ""
  },
  {
    "mrs": 15,
    "page": 3,
    "commits": 41,
    "name": "telkom-digital/smb/padiumkm-marketplace/mobile-application/mobile-seller",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/ms-otp",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/myindibiz-shared-component-registry",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-candi",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-candi-plugin",
    "note": ""
  },
  {
    "mrs": 10,
    "page": 3,
    "commits": 66,
    "name": "ewd-mysooltan/mysooltan-mobile-assistant",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-privacy-web",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-article",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-artificial",
    "note": ""
  },
  {
    "mrs": 4,
    "page": 3,
    "commits": 20,
    "name": "ewd-mysooltan/mysooltan-service-assistant",
    "note": ""
  },
  {
    "mrs": 1,
    "page": 3,
    "commits": 9,
    "name": "ewd-mysooltan/mysooltan-service-assurance",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-community",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-conference",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-event",
    "note": ""
  },
  {
    "mrs": 17,
    "page": 3,
    "commits": 54,
    "name": "ewd-mysooltan/mysooltan-service-lpc",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-notification",
    "note": ""
  },
  {
    "mrs": 6,
    "page": 3,
    "commits": 30,
    "name": "ewd-mysooltan/mysooltan-service-order",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-persona",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-product",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-user",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-service-wallet",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-twa",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-agent",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-bantuan",
    "note": ""
  },
  {
    "mrs": 7,
    "page": 3,
    "commits": 36,
    "name": "ewd-mysooltan/mysooltan-web-cms-page-builder",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-community-cms",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-community-page",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-conference",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-global-search",
    "note": ""
  },
  {
    "mrs": 3,
    "page": 3,
    "commits": 18,
    "name": "ewd-mysooltan/mysooltan-web-member",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-page-builder",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-persona",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-product",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "ewd-mysooltan/mysooltan-web-shared-component",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "doceng-ewz/mytens-customer-api-contract",
    "note": "2 error: commits: GitLab 403 pada /projects/15037/repository/commits: {\"message\":\"403 Forbidden\"}"
  },
  {
    "mrs": 0,
    "page": 3,
    "commits": 0,
    "name": "satu-data-digital/observatorium",
    "note": ""
  },
  {
    "mrs": 54,
    "page": 3,
    "commits": 310,
    "name": "telkom-digital/smb/padiumkm-marketplace/core/openapi-docs",
    "note": ""
  },
  {
    "mrs": 11,
    "page": 3,
    "commits": 35,
    "name": "telkom-digital/smb/padiumkm-marketplace/openapi-gateway",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padi-retail/padi-be-kasir-bazaar",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 3
  },
  {
    "mrs": 9,
    "page": 3,
    "commits": 173,
    "name": "telkom-digital/smb/padiumkm-marketplace/core/padi-core-fe-chat",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/core/padi-core-mobile-chat",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padi-retail/padi-fe-kasir-bazaar",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "mrs": 71,
    "page": 4,
    "commits": 389,
    "name": "telkom-digital/smb/padiumkm-marketplace/core/padi-ms-core-chat",
    "note": ""
  },
  {
    "mrs": 200,
    "page": 4,
    "commits": 429,
    "name": "telkom-digital/smb/padiumkm-marketplace/padi-rfq",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-android-automation",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-api-automation",
    "commits": 2,
    "mrs": 1,
    "note": "",
    "page": 4
  },
  {
    "mrs": 286,
    "page": 4,
    "commits": 1482,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-api-gateway",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-controltower-codeigniter",
    "commits": 6,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/streaming/padiumkm-fe-streaming",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-buyer",
    "commits": 2746,
    "mrs": 500,
    "note": "",
    "page": 4
  },
  {
    "mrs": 239,
    "page": 4,
    "commits": 1001,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-cms",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-controltower",
    "commits": 104,
    "mrs": 26,
    "note": "",
    "page": 4
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/core/padiumkm-frontend-core",
    "note": ""
  },
  {
    "mrs": 17,
    "page": 4,
    "commits": 48,
    "name": "telkom-digital/smb/padiumkm-marketplace/financing/padiumkm-frontend-portal-financing",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-frontend-seller",
    "commits": 1979,
    "mrs": 379,
    "note": "",
    "page": 4
  },
  {
    "mrs": 17,
    "page": 4,
    "commits": 85,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-load-test",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/mfe/padiumkm-mfe-finance",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 4
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-migration",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-mobile-buyer",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-mobile-seller",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-shared/padiumkm-mobile-shared",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-auth",
    "note": ""
  },
  {
    "mrs": 7,
    "page": 4,
    "commits": 14,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-bumn-solution-center",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-chat-ai-python",
    "commits": 55,
    "mrs": 18,
    "note": "",
    "page": 4
  },
  {
    "mrs": 50,
    "page": 4,
    "commits": 244,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-controltower",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-controltower-external",
    "note": ""
  },
  {
    "mrs": 1,
    "page": 4,
    "commits": 4,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-cron",
    "note": ""
  },
  {
    "mrs": 309,
    "page": 4,
    "commits": 1204,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-disbursement",
    "note": ""
  },
  {
    "mrs": 66,
    "page": 4,
    "commits": 326,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-document",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 4,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-export",
    "note": ""
  },
  {
    "mrs": 126,
    "page": 4,
    "commits": 708,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-financing",
    "note": ""
  },
  {
    "mrs": 233,
    "page": 4,
    "commits": 965,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-fulfillment",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-masterdata",
    "commits": 154,
    "mrs": 20,
    "note": "",
    "page": 5
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/post/padiumkm-ms-notification",
    "commits": 259,
    "mrs": 69,
    "note": "",
    "page": 5
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-openapi-bumn",
    "commits": 335,
    "mrs": 71,
    "note": "",
    "page": 5
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-openapi-exchange",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-openapi-template-service",
    "note": ""
  },
  {
    "mrs": 32,
    "page": 5,
    "commits": 104,
    "name": "telkom-digital/smb/padiumkm-marketplace/post/padiumkm-ms-order",
    "note": ""
  },
  {
    "mrs": 133,
    "page": 5,
    "commits": 571,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-payment",
    "note": ""
  },
  {
    "mrs": 242,
    "page": 5,
    "commits": 943,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-product",
    "note": "17 error: diff b97d7948: net::ERR_NETWORK_IO_SUSPENDED"
  },
  {
    "mrs": 204,
    "page": 5,
    "commits": 514,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-purchase",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-purchase-request",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "mrs": 2,
    "page": 5,
    "commits": 7,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-recommendation",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/streaming/padiumkm-ms-streaming",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-subscriptions",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-transaction",
    "commits": 4,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "mrs": 274,
    "page": 5,
    "commits": 1550,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-user",
    "note": ""
  },
  {
    "mrs": 36,
    "page": 5,
    "commits": 71,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-ms-voucher",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-performance-test",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/core/padiumkm-portal-telkom",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-qa-automation",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 5
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-qa-core",
    "note": ""
  },
  {
    "mrs": 37,
    "page": 5,
    "commits": 161,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-shared/padiumkm-shared",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-shared-lib",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 23,
    "name": "gian-permana/padiumkm-shared-module",
    "note": ""
  },
  {
    "mrs": 7,
    "page": 5,
    "commits": 39,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-test-case",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-under-maintenance",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-website-automation",
    "commits": 914,
    "mrs": 130,
    "note": "",
    "page": 5
  },
  {
    "mrs": 13,
    "page": 5,
    "commits": 55,
    "name": "satu-data-digital/peltast",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkomdev-luqmanhiksan/personal-documentation",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/portal-koperasi",
    "note": ""
  },
  {
    "mrs": 1,
    "page": 5,
    "commits": 7,
    "name": "telkom-digital/smb/padiumkm-marketplace/danantara/portal-torasera",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "satu-data-digital/pr-commenter",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 5,
    "commits": 0,
    "name": "satu-data-digital/prototypes",
    "note": ""
  },
  {
    "mrs": 43,
    "page": 5,
    "commits": 175,
    "name": "satu-data-digital/provisioner",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-qa-seller/qa-seller-web-automation-codecept",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/padiumkm-qa-seller/qa-seller-web-automation-cypress",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/request-access",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "dimasasmoro/request-access",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "dimasasmoro/request-access-datadog",
    "note": ""
  },
  {
    "mrs": 32,
    "page": 6,
    "commits": 259,
    "name": "satu-data-digital/schema-repository",
    "note": ""
  },
  {
    "name": "telkom-digital/smb/padiumkm-marketplace/core/sendbird-firebase-migration",
    "commits": 0,
    "mrs": 0,
    "note": "",
    "page": 6
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/shared-lib",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "ewd-mysooltan/sharedmodule",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "ewd-mysooltan/superset-ui-embedded-sdk",
    "note": ""
  },
  {
    "mrs": 4,
    "page": 6,
    "commits": 58,
    "name": "ewd-mysooltan/tds-mysooltan-cms",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "ewd-mysooltan/tds-mysooltan-customer-web",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "ewd-mysooltan/tds-mysooltan-customer-web-widget",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "ewd-mysooltan/tds-mysooltan-service-api",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "telkom-digital/smb/padiumkm-marketplace/surrounding-apps/template-email-disbursement",
    "note": ""
  },
  {
    "mrs": 0,
    "page": 6,
    "commits": 0,
    "name": "satu-data-digital/trino",
    "note": ""
  }
],
};
