// Bentuk data laporan cetak. Sumber utama: `getLiveReportData` (lib/report-live.ts).
// `referenceReportData` hanya fallback tampilan saat data hidup tidak tersedia;
// isinya sengaja netral ("-") agar tidak menampilkan angka contoh sebagai fakta.

export interface ComponentScore {
  name: string;
  score: number | null;
  weight: number;
  grade: string;
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
  branches: number | string;
  mrDevelop: number | string;
  mrRelease: number | string;
  mrMaster: number | string;
  points: number | string;
}

export interface ReleaseFlowView {
  branches: number;
  totalPoints: number;
  pointsPerMonth: number;
  hasOtherBranch: boolean;
  stages: {
    key: string;
    label: string;
    created: number;
    merged: number;
    carried: number;
    pointsPerMr: number;
    points: number;
  }[];
  funnel: {
    master: number;
    release: number;
    develop: number;
    none: number;
    total: number;
    masterPct: number;
    releasePct: number;
    developPct: number;
  };
  monthly: {
    ym: string;
    label: string;
    branches: number;
    develop: number;
    release: number;
    master: number;
    other: number;
    points: number;
  }[];
  firstMasterMonth: string | null;
}

export interface RepeatedIssuesView {
  fixCommitCount: number;
  repeatedFileCount: number;
  repeatedFiles: {
    file: string;
    fixCount: number;
    avgLines: number;
    kind: string;
  }[];
  fixOnFix: {
    count: number;
    lines: number;
    examples: { file: string; first: string; second: string; lines: number; gapDays: number }[];
  };
  backAndForth: {
    lines: number;
    commits: number;
    files: { file: string; lines: number; commits: number; lastCommit: string }[];
  };
}

export interface AreasView {
  primaryRole: string;
  roleLabel: string;
  areas: { key: string; label: string; lines: number; pct: number }[];
  languages: { language: string; lines: number; commits: number; intensity: string }[];
}

export interface TalentNarrative {
  movement: string[];
  strengths: string[];
  focus: string[];
}

export interface HotspotRow {
  file: string;
  commits: number;
  lines: number;
  selfReworkLines: number;
  selfReworkPct: number;
  fixCommits: number;
}

export interface ReworkExample {
  file: string;
  initialCommit: string;
  modifyingCommit: string;
  lines: number;
  gap: string;
  project?: string;
}

export interface SkillFindingRow {
  key: string;
  label: string;
  count: number;
  per100: string;
  status: 'critical' | 'warn' | 'good';
  statusText: string;
}

export interface SkillLanguageRow {
  language: string;
  lines: number;
  commits: number;
  intensity: string;
  score: number | null;
  findings: number;
}

export interface SkillView {
  score: number | null;
  testPct: number;
  scannedLines: number;
  scannedFiles: number;
  issues: SkillFindingRow[];
  languages: SkillLanguageRow[];
}

export interface CommitCheckRow {
  sha: string;
  title: string;
  file: string;
  finding: string;
  count: number;
}

export interface CodeReviewHighlight {
  sha: string;
  shortSha: string;
  title: string;
  score: number;
  summary: string;
  notes: string[];
}

export interface CodeReviewView {
  score: number | null;
  count: number;
  highlights: CodeReviewHighlight[];
}

export interface WorkAreaRow {
  name: string;
  commits: number;
  added: number;
  deleted: number;
  mrs: number;
  points: number;
}

export interface FileExtRow {
  ext: string;
  lines: number;
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
  overallScore: {
    name: string;
    score: number;
    grade: string;
    gradeLabel: string;
  };
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
    limitations: string[];
  };
  talentProfile: {
    metrics: {
      tenure: { title: string; value: string; detail: string; sub: string };
      commits: { title: string; value: string; detail: string; sub: string };
      lines: { title: string; value: string; detail: string };
      mergeRequests: { title: string; value: string; detail: string };
      releasePoints: { title: string; value: string; detail: string };
      masterReach: { title: string; value: string; detail: string };
      codeSurvival: { title: string; value: string; detail: string };
    };
    componentScores: ComponentScore[];
    qualityIndicators: QualityIndicator[];
    weeklyCommits: { week: string; count: number }[];
    monthlyContributions: MonthlyContribution[];
    monthlySummary: string;
    releaseFlow?: ReleaseFlowView;
    repeatedIssues?: RepeatedIssuesView;
    areas?: AreasView;
    narrative?: TalentNarrative;
    skill?: SkillView;
    review?: CodeReviewView;
    workAreas?: WorkAreaRow[];
    fileExtensions?: FileExtRow[];
    hotspots?: HotspotRow[];
    commitsToCheck?: CommitCheckRow[];
    reworkExamples?: ReworkExample[];
    commitHeatmap: {
      days: string[];
      slots: string[];
      matrix: number[][]; // 7 hari x 24 slot jam (0-4 intensitas)
    };
  };
  aiAnalysis: {
    model: string;
    summary: string;
  };
}

const emptyReleaseFlow: ReleaseFlowView = {
  branches: 0,
  totalPoints: 0,
  pointsPerMonth: 0,
  hasOtherBranch: false,
  stages: [],
  funnel: { master: 0, release: 0, develop: 0, none: 0, total: 0, masterPct: 0, releasePct: 0, developPct: 0 },
  monthly: [],
  firstMasterMonth: null,
};

export const referenceReportData: FullReportData = {
  meta: {
    title: 'Rapor Talent',
    talentName: '-',
    username: '-',
    email: '-',
    mergedIdentitiesNote: 'Data belum tersedia',
    periodText: '-',
    createdText: '-',
    totalProjectsCount: 0,
    footerTitle: 'Rapor Talent : Rahasia, untuk keperluan internal',
    totalPages: 8,
  },
  overallScore: {
    name: '-',
    score: 0,
    grade: '-',
    gradeLabel: 'Belum ada data',
  },
  methodology: {
    intro:
      'Seluruh angka dihitung otomatis dari data GitLab pada periode laporan: commit non-merge, diff, merge request, event review, dan hasil pemindaian statis file. Nilai bersifat heuristik untuk bahan diskusi, bukan satu-satunya dasar penilaian.',
    components: [
      {
        name: 'Produktivitas',
        weight: '20%',
        calculation:
          'Rata-rata per bulan masa penugasan: commit non-merge, volume baris berubah, MR yang di-merge, dan rasio hari kerja aktif.',
      },
      {
        name: 'Kualitas Kode',
        weight: '25%',
        calculation:
          '100 dikurangi penalti self-rework (≤21 hari), fix atas fix (≤45 hari), file fix berulang, kode bolak-balik, dan revert asli.',
      },
      {
        name: 'Skill Kode',
        weight: '15%',
        calculation:
          'Analisis statis baris yang ditambahkan: secret tertulis, SQL dari string, catch kosong, debug print, kode komentar, duplikasi, tipe any, TODO, nesting dalam, dan baris panjang. Porsi kode tes memberi bonus kecil.',
      },
      {
        name: 'Kolaborasi',
        weight: '15%',
        calculation:
          'Aksi review (komentar MR dan approval dari gl_events) serta jumlah MR yang dibuat per bulan. Angka review masih perkiraan karena event belum mencatat aktor.',
      },
      {
        name: 'Konsistensi',
        weight: '10%',
        calculation:
          'Hari kerja aktif (35%), minggu yang memiliki commit (35%), kualitas pesan commit (15%), dan kestabilan jumlah commit antar bulan (15%).',
      },
      {
        name: 'Alur Rilis',
        weight: '15%',
        calculation:
          '60% volume poin alur kerja per bulan (target 200) dan 40% jangkauan commit sampai master/production (target 25%). Poin dari MR merged: develop 2, release 3, master 5, branch baru 1.',
      },
    ],
    assignmentTenure:
      'Masa penugasan dihitung dari kontribusi tersinkron pertama sampai hari ini. Semua komponen memakai periode yang sama (YTD berjalan), sehingga talent yang baru bergabung tidak dibandingkan dengan total setahun penuh.',
    reworkDetection:
      'Riwayat tiap file diputar ulang commit demi commit. Baris yang dihapus/diganti kurang dari 21 hari setelah ditulis dihitung self-rework. File yang diperbaiki minimal 3 kali dihitung fix berulang. Fix atas fix dihitung bila file yang sama diperbaiki lagi dalam 45 hari. File lock dan hasil build dikecualikan.',
    gradeScale: [
      { grade: 'A', range: '≥ 85', label: 'Sangat Baik', color: 'badge-green' },
      { grade: 'B', range: '70-84', label: 'Baik', color: 'badge-cyan' },
      { grade: 'C', range: '55-69', label: 'Cukup', color: 'badge-amber' },
      { grade: 'D', range: '40-54', label: 'Perlu Perhatian', color: 'badge-orange' },
      { grade: 'E', range: '< 40', label: 'Kurang', color: 'badge-rose' },
    ],
    limitations: [
      'Belum ada skor relatif tim atau peringkat: laporan hanya menilai kontribusi satu akun pada periode ini.',
      'Skill Kode memakai analisis statis baris yang ditambahkan, belum membaca seluruh isi repository.',
      'Aksi review berasal dari gl_events yang belum mencatat aktor, jadi bisa memuat aktivitas orang lain.',
      'Jumlah baris dan commit tidak mencerminkan kompleksitas atau nilai bisnis pekerjaan.',
    ],
  },
  talentProfile: {
    metrics: {
      tenure: { title: 'MASA PENUGASAN', value: '-', detail: '-', sub: '-' },
      commits: { title: 'COMMIT', value: '-', detail: '-', sub: '-' },
      lines: { title: 'BARIS KODE', value: '-', detail: '-' },
      mergeRequests: { title: 'MERGE REQUEST', value: '-', detail: '-' },
      releasePoints: { title: 'POIN ALUR KERJA', value: '-', detail: '-' },
      masterReach: { title: 'MR KE MASTER', value: '-', detail: '-' },
      codeSurvival: { title: 'KODE BERTAHAN', value: '-', detail: '-' },
    },
    componentScores: [],
    qualityIndicators: [],
    weeklyCommits: [],
    monthlyContributions: [],
    monthlySummary: 'Belum ada data.',
    releaseFlow: emptyReleaseFlow,
    repeatedIssues: {
      fixCommitCount: 0,
      repeatedFileCount: 0,
      repeatedFiles: [],
      fixOnFix: { count: 0, lines: 0, examples: [] },
      backAndForth: { lines: 0, commits: 0, files: [] },
    },
    areas: {
      primaryRole: '-',
      roleLabel: '-',
      areas: [],
      languages: [],
    },
    narrative: {
      movement: ['Belum ada data kontribusi pada periode ini.'],
      strengths: [],
      focus: [],
    },
    skill: {
      score: null,
      testPct: 0,
      scannedLines: 0,
      scannedFiles: 0,
      issues: [],
      languages: [],
    },
    review: { score: null, count: 0, highlights: [] },
    workAreas: [],
    fileExtensions: [],
    hotspots: [],
    commitsToCheck: [],
    reworkExamples: [],
    commitHeatmap: { days: [], slots: [], matrix: [] },
  },
  aiAnalysis: {
    model: '-',
    summary: '-',
  },
};
