import 'server-only';
import { db } from './db';
import { getSettings } from './settings';
import { loadMetrics } from './stats';
import { gradeOf } from './metrics';
import { runAiCompletion, extractJsonFromAiResponse } from './ai/client';
import { resolveAiModel } from './ai/models';
import {
  computeAreas,
  computeOverallScore,
  computeReleaseFlow,
  computeRepeatedIssues,
  monthKey,
  monthLabel,
  monthsBetween,
  type CommitFileRow,
  type FlowCommit,
  type FlowEvent,
  type FlowMr,
  type LineHashRow,
  type ReachRow,
} from './talent-report';
import {
  referenceReportData,
  type FullReportData,
  type ProjectScopeItem,
  type MonthlyContribution,
  type ProjectContribution,
  type FileTypeContribution,
  type ReworkExample,
} from '@/app/report/reportData';

export interface ReportAiAnalysisCache {
  model: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function formatYmId(ym: string): string {
  const [year, month] = ym.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  const name = MONTH_NAMES_ID[monthIdx] || month;
  return `${name} ${year}`;
}

const DAY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const WEEKDAY_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', weekday: 'short' });
const HOUR_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hourCycle: 'h23' });
const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const HEATMAP_SLOTS = ['00', '03', '06', '09', '12', '15', '18', '21'];

function buildHeatmap(authoredAt: string[]) {
  const matrix = Array.from({ length: 7 }, () => new Array(HEATMAP_SLOTS.length).fill(0) as number[]);
  for (const iso of authoredAt) {
    const day = DAY_INDEX[WEEKDAY_FMT.format(new Date(iso))] ?? 0;
    const hour = parseInt(HOUR_FMT.format(new Date(iso)), 10);
    const slot = Math.min(HEATMAP_SLOTS.length - 1, Math.floor(hour / 3));
    matrix[day][slot]++;
  }
  const max = Math.max(1, ...matrix.flat());
  return {
    days: WEEKDAYS,
    slots: HEATMAP_SLOTS,
    matrix: matrix.map((row) => row.map((n) => (n === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((n / max) * 4)))))),
  };
}

export function getCachedReportAiAnalysis(): ReportAiAnalysisCache | null {
  try {
    const row = db()
      .prepare("SELECT value FROM settings WHERE key = 'report_ai_analysis'")
      .get() as { value: string } | undefined;
    if (row?.value) {
      return JSON.parse(row.value) as ReportAiAnalysisCache;
    }
  } catch (err) {
    console.error('Failed to read cached AI report analysis:', err);
  }
  return null;
}

export function saveCachedReportAiAnalysis(data: ReportAiAnalysisCache) {
  try {
    db()
      .prepare(
        "INSERT INTO settings (key, value) VALUES ('report_ai_analysis', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .run(JSON.stringify(data));
  } catch (err) {
    console.error('Failed to cache AI report analysis:', err);
  }
}

export async function generateLiveReportAi(metricsData?: ReturnType<typeof loadMetrics>): Promise<ReportAiAnalysisCache> {
  const s = getSettings();
  const activeModel = resolveAiModel(s, 'report');

  const m = metricsData || loadMetrics(90);
  const user = m.user || { name: 'dhian haryono', username: 'telkomdev-dhianharyono' };

  const systemInstruction = `Kamu adalah Asisten AI Evaluator Performa Software Engineer senior yang objektif, analitis, dan profesional.
Tugasmu menyusun analisis performa teknis berdasarkan data metrik GitLab aktual.
Output HARUS murni JSON valid tanpa markdown formatting tambahan di luar JSON:
{
  "summary": "Paragraf ringkasan evaluasi performa menyeluruh (lugas, profesional, berbasis data)",
  "strengths": ["Poin kekuatan 1", "Poin kekuatan 2", "Poin kekuatan 3", "Poin kekuatan 4"],
  "improvements": ["Poin rekomendasi 1", "Poin rekomendasi 2", "Poin rekomendasi 3", "Poin rekomendasi 4"]
}`;

  const topProjectsSummary = m.topProjects
    .slice(0, 5)
    .map((p) => `- ${p.name}: ${p.commits} commit, ${p.mrs} MR`)
    .join('\n');

  const prompt = `DATA METRIK PERFORMA GITLAB:
- Nama Developer: ${user.name} (@${user.username})
- Periode Evaluasi: ${m.period.days} hari (${Math.max(1, Math.round(m.period.days / 30))} bulan)
- Total Commit (non-merge): ${m.kpis.commits}
- Merge Commit: ${m.kpis.mergeCommits}
- Baris Kode: +${m.kpis.linesAdded.toLocaleString('id-ID')} / -${m.kpis.linesDeleted.toLocaleString('id-ID')}
- Merge Request: ${m.kpis.mrsCreated} diajukan, ${m.kpis.mrsMerged} di-merge
- Review & Kolaborasi: ${m.kpis.reviews} review MR, ${m.kpis.comments} komentar
- Hari Aktif: ${m.kpis.activeDays} hari (${m.kpis.weekendDays} hari di akhir pekan)
- Rasio Fix/Rework: ${Math.round(m.kpis.fixRatio * 100)}%
- Rata-rata Ukuran Commit: ${Math.round(m.kpis.avgCommitSize)} baris/commit
- Skor Evaluasi (0-100):
  * Produktivitas: ${m.scores.productivity}
  * Kualitas: ${m.scores.quality}
  * Kolaborasi: ${m.scores.collaboration}
  * Konsistensi: ${m.scores.consistency}
  * Skor Keseluruhan: ${m.scores.overall} (Grade: ${m.scores.grade} - ${m.scores.gradeLabel})
- Proyek Utama yang Dikerjakan:
${topProjectsSummary}

Instruksi:
Tuliskan analisis performa teknis dengan gaya objektif, solutif, dan bebas bias. Berikan 4 poin kekuatan dan 4 poin area perbaikan yang relevan dengan metrik di atas.`;

  try {
    const rawAi = await runAiCompletion({
      feature: 'report',
      systemInstruction,
      prompt,
      temperature: 0.3,
      responseFormat: 'json',
    });

    const cleaned = extractJsonFromAiResponse(rawAi);
    const parsed = JSON.parse(cleaned) as {
      summary?: string;
      strengths?: string[];
      improvements?: string[];
    };

    if (parsed && parsed.summary && Array.isArray(parsed.strengths) && Array.isArray(parsed.improvements)) {
      const result: ReportAiAnalysisCache = {
        model: activeModel,
        generatedAt: new Date().toISOString(),
        summary: parsed.summary,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
      };
      saveCachedReportAiAnalysis(result);
      return result;
    }
  } catch (err) {
    console.error('Failed generating AI analysis with active LLM:', err);
  }

  // Fallback if AI call failed
  const fallbackResult: ReportAiAnalysisCache = {
    model: activeModel,
    generatedAt: new Date().toISOString(),
    summary: `${user.name} menunjukkan volume kontribusi kode yang sangat aktif dengan total ${m.kpis.commits.toLocaleString('id-ID')} commit non-merge dan ${m.kpis.mrsMerged} Merge Request berhasil di-merge. Fokus kontribusi terdistribusi kuat pada proyek arsitektur utama. Kecepatan delivery tergolong tinggi, namun memerlukan penguatan pada pilar kolaborasi tim serta efisiensi pengujian sebelum push untuk menekan rasio commit perbaikan (fix/revert).`,
    strengths: [
      `Volume produksi kode sangat masif dengan +${m.kpis.linesAdded.toLocaleString('id-ID')} baris kode bersih yang terefleksi dalam ${m.kpis.commits} commit.`,
      `Eksekusi fitur dan penyelesaian MR konsisten dengan ${m.kpis.mrsMerged} dari ${m.kpis.mrsCreated} MR berhasil di-merge ke branch utama.`,
      `Fokus kerja terarah dengan kontribusi dominan pada repository sentral dashboard developer dan control tower.`,
      `Tingkat inisiatif implementasi mandiri tinggi dalam menyelesaikan kebutuhan antarmuka dan integrasi data portal.`,
    ],
    improvements: [
      `Tingkatkan partisipasi aktif dalam melakukan code review terhadap MR rekan tim untuk mengangkat skor kolaborasi (saat ini ${m.scores.collaboration}).`,
      `Kurangi rasio rework/fix commit (${Math.round(m.kpis.fixRatio * 100)}%) melalui uji coba lokal komprehensif sebelum commit ke repository.`,
      `Pecah commit besar ke unit commit yang lebih modular untuk memudahkan tracking dan audit kode.`,
      `Pertahankan batas ritme kerja yang seimbang pada hari kerja dan batasi commit di akhir pekan (${m.kpis.weekendDays} hari tercatat).`,
    ],
  };
  saveCachedReportAiAnalysis(fallbackResult);
  return fallbackResult;
}

export function getLiveReportData(): FullReportData {
  const d = db();
  const s = getSettings();

  // Masa penugasan: from the first synced contribution until today.
  const firstRow = d.prepare('SELECT min(authored_at) AS first FROM gl_commits WHERE is_merge = 0').get() as {
    first: string | null;
  };
  const now = new Date();
  const firstAt = firstRow?.first ? new Date(firstRow.first) : new Date(now.getTime() - 90 * 864e5);
  const days = Math.max(30, Math.ceil((now.getTime() - firstAt.getTime()) / 864e5));
  const metrics = loadMetrics(days);
  const start = new Date(metrics.period.start);
  const end = new Date(metrics.period.end);
  const sIso = start.toISOString();

  const activeModel = resolveAiModel(s, 'report');
  const glUser = metrics.user || {
    id: 835,
    username: s.gitlabUsername || 'telkomdev-dhianharyono',
    name: 'dhian haryono',
  };

  const flowCommits = d
    .prepare(
      'SELECT sha, project_id, authored_at, is_fix, adj_additions, adj_deletions FROM gl_commits WHERE is_merge = 0 AND authored_at >= ?',
    )
    .all(sIso) as unknown as FlowCommit[];
  const flowMrs = d
    .prepare(
      'SELECT project_id, role, created_at, merged_at, source_branch, target_branch FROM gl_mrs WHERE created_at >= ? OR merged_at >= ?',
    )
    .all(sIso, sIso) as unknown as FlowMr[];
  const flowEvents = d
    .prepare('SELECT created_at, action, project_id, ref FROM gl_events WHERE created_at >= ?')
    .all(sIso) as unknown as FlowEvent[];
  const reaches = d
    .prepare(
      'SELECT r.sha, r.stage FROM gl_commit_reach r JOIN gl_commits c ON c.sha = r.sha WHERE c.is_merge = 0 AND c.authored_at >= ?',
    )
    .all(sIso) as unknown as ReachRow[];
  const files = d
    .prepare(
      'SELECT f.sha, f.project_id, f.path, f.added, f.deleted FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha WHERE c.is_merge = 0 AND c.authored_at >= ?',
    )
    .all(sIso) as unknown as CommitFileRow[];
  const lineRows = d
    .prepare(
      'SELECT f.sha, f.path, f.added_hashes, f.deleted_hashes FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha WHERE c.is_merge = 0 AND c.authored_at >= ?',
    )
    .all(sIso) as unknown as LineHashRow[];

  const releaseFlow = computeReleaseFlow({
    commits: flowCommits,
    mrs: flowMrs,
    events: flowEvents,
    reaches,
    start,
    end,
  });
  const repeated = computeRepeatedIssues({ commits: flowCommits, files, lines: lineRows });
  const areasView = computeAreas(files);

  const overall = computeOverallScore({
    productivity: metrics.scores.productivity,
    quality: metrics.scores.quality,
    collaboration: metrics.scores.collaboration,
    consistency: metrics.scores.consistency,
    releaseFlow: releaseFlow.score,
  });
  const grade = gradeOf(overall);
  const monthsCount = Math.max(1, monthsBetween(start, end).length);

  const startDate = new Date(metrics.period.start);
  const startFmt = `${String(startDate.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[startDate.getMonth()]} ${startDate.getFullYear()}`;
  const today = new Date();
  const todayFmt = `${String(today.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[today.getMonth()]} ${today.getFullYear()}`;
  const periodText = `${startFmt} - ${todayFmt} (masa penugasan ${monthsCount} bulan)`;

  // 1. Only projects where commits > 0 OR mrs > 0 within the assignment window
  const activeProjectRows = d
    .prepare(
      `SELECT p.id, p.path,
        COALESCE(c.commits, 0) as commits, COALESCE(m.mrs, 0) as mrs,
        COALESCE(c.added, 0) as added, COALESCE(c.deleted, 0) as deleted
      FROM gl_projects p
      LEFT JOIN (
        SELECT project_id, count(*) as commits, sum(adj_additions) as added, sum(adj_deletions) as deleted
        FROM gl_commits WHERE is_merge = 0 AND authored_at >= ? GROUP BY project_id
      ) c ON c.project_id = p.id
      LEFT JOIN (
        SELECT project_id, count(*) as mrs FROM gl_mrs
        WHERE role = 'author' AND (created_at >= ? OR merged_at >= ?) GROUP BY project_id
      ) m ON m.project_id = p.id
      WHERE COALESCE(c.commits, 0) > 0 OR COALESCE(m.mrs, 0) > 0
      ORDER BY commits DESC, mrs DESC`,
    )
    .all(sIso, sIso, sIso) as { id: number; path: string; commits: number; mrs: number; added: number; deleted: number }[];

  const projects: ProjectScopeItem[] = activeProjectRows.map((row, idx) => {
    let page = 1;
    if (idx >= 12) page = 2 + Math.floor((idx - 12) / 26);
    return { name: row.path, commits: row.commits, mrs: row.mrs, note: '', page };
  });
  const projectPagesCount = projects.length > 0 ? Math.max(...projects.map((p) => p.page)) : 1;
  const totalPages = projectPagesCount + 5;

  // Monthly commit aggregates from the same commits used for the flow.
  const monthAgg = new Map<string, { commits: number; days: Set<string>; added: number; deleted: number }>();
  for (const c of flowCommits) {
    const ym = monthKey(c.authored_at);
    const cur = monthAgg.get(ym) ?? { commits: 0, days: new Set<string>(), added: 0, deleted: 0 };
    cur.commits++;
    cur.days.add(DAY_FMT.format(new Date(c.authored_at)));
    cur.added += c.adj_additions;
    cur.deleted += c.adj_deletions;
    monthAgg.set(ym, cur);
  }

  const monthKeys = monthsBetween(start, end);
  const flowByMonth = new Map(releaseFlow.monthly.map((m) => [m.ym, m]));
  const firstYm = monthKeys[0];
  const lastYm = monthKeys[monthKeys.length - 1];
  const firstDay = DAY_FMT.format(firstAt);
  const lastDay = DAY_FMT.format(today);
  const monthlyContributions: MonthlyContribution[] = monthKeys.map((ym) => {
    const agg = monthAgg.get(ym) ?? { commits: 0, days: new Set<string>(), added: 0, deleted: 0 };
    const flow = flowByMonth.get(ym);
    const rep = repeated.monthly[ym] ?? { fix: 0, repeat: 0 };
    const isPartial = (ym === firstYm && !firstDay.endsWith('-01')) || (ym === lastYm && lastDay.slice(-2) !== '01');
    return {
      month: `${monthLabel(ym)}${isPartial ? ' (sebagian)' : ''}`,
      commits: agg.commits,
      activeDays: agg.days.size,
      linesChanged: `+${agg.added.toLocaleString('id-ID')} / -${agg.deleted.toLocaleString('id-ID')}`,
      branches: flow?.branches ?? 0,
      mrDevelop: flow?.develop ?? 0,
      mrRelease: flow?.release ?? 0,
      mrMaster: flow?.master ?? 0,
      fix: rep.fix,
      repeatFix: rep.repeat,
      points: Math.round((flow?.points ?? 0) * 10) / 10,
    };
  });

  const avg = (n: number) => Math.round((n / monthsCount) * 10) / 10;
  const totalBranches = releaseFlow.branches;
  const totalDev = releaseFlow.stages.find((x) => x.key === 'develop')?.merged ?? 0;
  const totalRel = releaseFlow.stages.find((x) => x.key === 'release')?.merged ?? 0;
  const totalMaster = releaseFlow.stages.find((x) => x.key === 'master')?.merged ?? 0;
  const totalFix = repeated.fixCommitCount;
  const totalRepeat = repeated.fixOnFix.count;
  const totalActiveDays = new Set(flowCommits.map((c) => DAY_FMT.format(new Date(c.authored_at)))).size;
  const activePct = Math.round((metrics.kpis.activeWorkdays / Math.max(1, metrics.period.workdays)) * 1000) / 10;
  monthlyContributions.push({
    month: 'Rata-rata / bulan',
    commits: avg(flowCommits.length),
    activeDays: `${activePct}% hari kerja`,
    linesChanged: `+${Math.round(metrics.kpis.linesAdded / monthsCount).toLocaleString('id-ID')} / -${Math.round(metrics.kpis.linesDeleted / monthsCount).toLocaleString('id-ID')}`,
    branches: avg(totalBranches),
    mrDevelop: avg(totalDev),
    mrRelease: avg(totalRel),
    mrMaster: avg(totalMaster),
    fix: avg(totalFix),
    repeatFix: avg(totalRepeat),
    points: avg(releaseFlow.totalPoints),
  });

  // Project contributions for the AI page
  const projectContributions: ProjectContribution[] = activeProjectRows.slice(0, 8).map((p) => ({
    project: p.path,
    commits: p.commits,
    lines: `+${p.added.toLocaleString('id-ID')} / -${p.deleted.toLocaleString('id-ID')}`,
  }));

  const fileTypes: FileTypeContribution[] = areasView.languages.slice(0, 8).map((l) => ({
    ext: l.language,
    linesAdded: `+${l.lines.toLocaleString('id-ID')}`,
  }));

  const hotspotMap = new Map<string, { project: string; commits: number; reworkLines: number }>();
  const projectNameById = new Map(activeProjectRows.map((p) => [p.id, p.path]));
  for (const f of files) {
    const cur = hotspotMap.get(f.path) ?? {
      project: projectNameById.get(f.project_id) ?? `#${f.project_id}`,
      commits: 0,
      reworkLines: 0,
    };
    cur.commits++;
    cur.reworkLines += f.added + f.deleted;
    hotspotMap.set(f.path, cur);
  }
  const hotspots = [...hotspotMap.entries()]
    .map(([file, v]) => ({ file, ...v }))
    .sort((a, b) => b.reworkLines - a.reworkLines)
    .slice(0, 8)
    .map((h) => ({ file: h.file, project: h.project, commits: h.commits, reworkLines: `${h.reworkLines.toLocaleString('id-ID')} baris` }));

  const reworkExamples: ReworkExample[] = repeated.fixOnFix.examples.map((e) => ({
    file: e.file,
    project: projectNameById.get(flowCommits.find((c) => c.sha === e.second)?.project_id ?? 0) ?? '',
    initialCommit: e.first.slice(0, 8),
    modifyingCommit: `${e.second.slice(0, 8)} · ${e.gapDays} hari`,
    lines: e.lines,
    gap: `${e.gapDays} hari`,
  }));

  const commitsPerMonth = Math.round((metrics.kpis.commits / monthsCount) * 10) / 10;
  const pointsPerMonth = Math.round(releaseFlow.pointsPerMonth * 10) / 10;
  const fixPct = Math.round(metrics.kpis.fixRatio * 1000) / 10;
  const areaText = areasView.areas
    .filter((a) => a.lines > 0)
    .map((a) => `${a.label} ${a.pct}%`)
    .join(', ');
  const topRepeated = repeated.repeatedFiles[0];
  const half = Math.max(1, Math.ceil(releaseFlow.monthly.length / 2));
  const firstAvg = releaseFlow.monthly.slice(0, half).reduce((sum, m) => sum + m.points, 0) / half;
  const lastAvg =
    releaseFlow.monthly.slice(-half).reduce((sum, m) => sum + m.points, 0) / Math.max(1, releaseFlow.monthly.slice(-half).length);
  const trend = lastAvg >= firstAvg ? 'meningkat' : 'melandai';

  const movement: string[] = [
    `Selama ${monthsCount} bulan masa penugasan (sejak ${startFmt}), ${glUser.name} mencatat rata-rata ${commitsPerMonth.toLocaleString('id-ID')} commit per bulan dan aktif pada ${activePct}% hari kerja.`,
    `Nilai keseluruhan ${overall} (${grade.gradeLabel}) dengan role utama ${areasView.primaryRole}. Kontribusi kode tersebar di ${areaText || 'beberapa area'}.`,
    `Poin alur kerja rata-rata ${pointsPerMonth.toLocaleString('id-ID')} per bulan; ritme ${trend} dari ${Math.round(firstAvg).toLocaleString('id-ID')} menjadi ${Math.round(lastAvg).toLocaleString('id-ID')} poin/bulan pada paruh akhir penugasan.`,
    releaseFlow.firstMasterMonth
      ? `Dalam alur rilis, tercatat ${releaseFlow.branches.toLocaleString('id-ID')} branch, ${totalDev} MR merged ke develop, ${totalRel} ke release, dan ${totalMaster} ke master dengan total ${Math.round(releaseFlow.totalPoints).toLocaleString('id-ID')} poin. Sebanyak ${releaseFlow.funnel.masterPct}% commit sudah sampai master/production; kontribusi pertama yang sampai ke master tercatat pada ${monthLabel(releaseFlow.firstMasterMonth)}.`
      : `Dalam alur rilis, tercatat ${releaseFlow.branches.toLocaleString('id-ID')} branch, ${totalDev} MR merged ke develop, ${totalRel} ke release, dan ${totalMaster} ke master dengan total ${Math.round(releaseFlow.totalPoints).toLocaleString('id-ID')} poin. Belum ada commit yang tercatat sampai master/production.`,
    `Dari sisi kualitas: ${fixPct}% commit berupa perbaikan; ${repeated.repeatedFiles.length} file diperbaiki berulang; ${repeated.fixOnFix.count} perbaikan dilakukan atas perbaikan sebelumnya dalam ≤45 hari; ${repeated.backAndForth.lines} baris dihapus lalu dikembalikan.`,
  ];

  const narrativeStrengths: string[] = [];
  if (releaseFlow.funnel.master > 0)
    narrativeStrengths.push(`Jangkauan produksi: ${releaseFlow.funnel.master} commit sampai master/production (${releaseFlow.funnel.masterPct}% dari total).`);
  if (totalRel > 0 || totalMaster > 0)
    narrativeStrengths.push(`Alur rilis berjalan: ${totalRel} MR merged ke release dan ${totalMaster} ke master, dengan ${totalBranches} branch baru.`);
  const topArea = areasView.areas.find((a) => a.lines > 0);
  if (topArea) narrativeStrengths.push(`Kontribusi terkonsentrasi di ${topArea.label} (${topArea.pct}%, ${topArea.lines.toLocaleString('id-ID')} baris).`);
  narrativeStrengths.push(`Konsistensi ${metrics.scores.consistency}/100 dengan ${totalActiveDays} hari aktif dari ${metrics.period.workdays} hari kerja.`);
  if (metrics.kpis.pipelineSuccessRate !== null)
    narrativeStrengths.push(`Pipeline sukses ${Math.round(metrics.kpis.pipelineSuccessRate * 100)}% dari ${metrics.kpis.pipelines} run yang terdeteksi.`);

  const focus: string[] = [];
  if (releaseFlow.funnel.masterPct < 25)
    focus.push(`Naikkan jangkauan commit ke master/production: baru ${releaseFlow.funnel.masterPct}% commit yang sampai, target 25%.`);
  if (topRepeated)
    focus.push(`Berkas ${topRepeated.file} diperbaiki ${topRepeated.fixCount} kali (rata-rata ${topRepeated.avgLines} baris per perbaikan). Perkuat pengujian sebelum push.`);
  if (repeated.fixOnFix.count > 0)
    focus.push(`Kurangi perbaikan atas perbaikan: ${repeated.fixOnFix.count} kejadian dalam ≤45 hari (${repeated.fixOnFix.lines} baris).`);
  if (metrics.kpis.avgCommitSize > 500)
    focus.push(`Pecah commit besar: rata-rata ${Math.round(metrics.kpis.avgCommitSize)} baris per commit.`);
  if (metrics.scores.collaboration < 55)
    focus.push(`Tingkatkan review MR rekan: skor kolaborasi ${metrics.scores.collaboration}/100 dari ${metrics.kpis.reviews} review.`);
  if (focus.length < 3)
    focus.push(`Pertahankan ritme dan perluas kontribusi ke area dengan porsi terkecil (${areasView.areas.filter((a) => a.lines > 0).slice(-1)[0]?.label ?? 'lainnya'}).`);

  const cachedAi = getCachedReportAiAnalysis();
  const aiNarrative = cachedAi || {
    model: activeModel,
    summary: `${glUser.name} menunjukkan performa kerja aktif dengan volume ${metrics.kpis.commits.toLocaleString('id-ID')} commit non-merge dan ${metrics.kpis.mrsMerged} MR berhasil di-merge. Role utama terdeteksi ${areasView.primaryRole} dengan ${releaseFlow.funnel.masterPct}% commit sampai master/production.`,
    strengths: narrativeStrengths.slice(0, 4),
    improvements: focus.slice(0, 4),
  };

  return {
    meta: {
      title: `Rapor Talent: ${glUser.name}`,
      talentName: glUser.name,
      username: glUser.username,
      email: s.identityEmails || `${glUser.username}@gmail.com`,
      mergedIdentitiesNote: `Identitas tergabung: ${s.identityNames || glUser.name}`,
      periodText,
      createdText: `Dibuat pada ${todayFmt}`,
      totalProjectsCount: projects.length,
      footerTitle: 'Rapor Talent : Rahasia, untuk keperluan internal',
      totalPages,
    },
    summaryKpis: {
      contributors: { value: 1, detail: '1 akun aktif' },
      commits: { value: metrics.kpis.commits.toLocaleString('id-ID'), detail: `${metrics.kpis.commits} non-merge` },
      lines: {
        added: `+${metrics.kpis.linesAdded.toLocaleString('id-ID')}`,
        deleted: `-${metrics.kpis.linesDeleted.toLocaleString('id-ID')}`,
      },
      mergeRequests: { value: totalDev + totalRel + totalMaster > 0 ? (totalDev + totalRel + totalMaster).toLocaleString('id-ID') : metrics.kpis.mrsCreated.toLocaleString('id-ID') },
    },
    overallScore: {
      name: glUser.name,
      score: overall,
      grade: grade.grade,
      gradeLabel: grade.gradeLabel,
    },
    rankingTable: {
      rank: 1,
      name: glUser.name,
      grade: grade.grade,
      gradeLabel: grade.gradeLabel,
      overall,
      productivity: metrics.scores.productivity,
      quality: metrics.scores.quality,
      collaboration: metrics.scores.collaboration,
      consistency: metrics.scores.consistency,
      releaseFlow: releaseFlow.score,
      months: monthsCount,
      commitsPerMonth: commitsPerMonth.toFixed(1),
      selfRework: `${fixPct}%`,
      footnote:
        'Peringkat dihitung dari talent yang tersinkron di DevHub. Saat ini baru 1 talent, sehingga peringkat tim belum bermakna. Skor Alur Rilis memakai 60% volume poin per bulan dan 40% jangkauan commit ke master.',
    },
    projects,
    methodology: { ...referenceReportData.methodology },
    talentProfile: {
      metrics: {
        tenure: {
          title: 'MASA PENUGASAN',
          value: `${monthsCount} bln`,
          detail: `mulai ${startFmt}`,
          sub: `${metrics.period.days} hari total`,
        },
        commits: {
          title: 'TOTAL COMMIT',
          value: metrics.kpis.commits.toLocaleString('id-ID'),
          detail: `${commitsPerMonth.toLocaleString('id-ID')}/bln`,
          sub: `${totalActiveDays} hari aktif`,
        },
        lines: {
          title: 'BARIS KODE',
          value: `+${metrics.kpis.linesAdded.toLocaleString('id-ID')} / -${metrics.kpis.linesDeleted.toLocaleString('id-ID')}`,
        },
        projects: {
          title: 'PROYEK KONTRIBUSI',
          value: `${projects.length}`,
          detail: `dari ${projects.length} proyek aktif`,
        },
        mergeRequests: {
          title: 'MERGE REQUEST',
          value: metrics.kpis.mrsCreated.toLocaleString('id-ID'),
          detail: `${metrics.kpis.mrsMerged} di-merge`,
        },
        releasePoints: {
          title: 'POIN ALUR KERJA',
          value: `${Math.round(releaseFlow.totalPoints).toLocaleString('id-ID')}`,
          detail: `${pointsPerMonth.toLocaleString('id-ID')} poin/bulan`,
        },
        masterReach: {
          title: 'MR KE MASTER',
          value: `${releaseFlow.funnel.masterPct}%`,
          detail: `${releaseFlow.funnel.master} dari ${releaseFlow.funnel.total} commit sampai production`,
        },
        codeSurvival: {
          title: 'CODE SURVIVAL',
          value: `${100 - Math.round(metrics.kpis.fixRatio * 100)}%`,
          detail: `${fixPct}% rework/fix`,
        },
      },
      componentScores: [
        { name: 'Produktivitas', score: metrics.scores.productivity },
        { name: 'Kualitas Kode', score: metrics.scores.quality },
        { name: 'Kolaborasi', score: metrics.scores.collaboration },
        { name: 'Konsistensi', score: metrics.scores.consistency },
        { name: 'Alur Rilis', score: releaseFlow.score },
      ],
      qualityIndicators: [
        {
          label: 'Pipeline Success Rate',
          value:
            metrics.kpis.pipelines >= 5
              ? `${Math.round((metrics.kpis.pipelineSuccessRate ?? 0) * 100)}%`
              : metrics.kpis.pipelines > 0
                ? `${Math.round((metrics.kpis.pipelineSuccessRate ?? 0) * 100)}% (${metrics.kpis.pipelines} run)`
                : 'N/A (Tanpa CI)',
          status:
            metrics.kpis.pipelines < 5
              ? 'warn'
              : (metrics.kpis.pipelineSuccessRate ?? 0) >= 0.8
                ? 'good'
                : 'warn',
          statusText:
            metrics.kpis.pipelines < 5
              ? 'CI Terbatas'
              : (metrics.kpis.pipelineSuccessRate ?? 0) >= 0.8
                ? 'Baik'
                : 'Perlu Pantau',
        },
        {
          label: 'Self-Rework Ratio',
          value: `${fixPct}%`,
          status: metrics.kpis.fixRatio < 0.2 ? 'good' : metrics.kpis.fixRatio < 0.35 ? 'warn' : 'critical',
          statusText: metrics.kpis.fixRatio < 0.2 ? 'Optimal' : 'Cukup Tinggi',
        },
        {
          label: 'Rata-rata Ukuran Commit',
          value: `${Math.round(metrics.kpis.avgCommitSize)} baris`,
          status: metrics.kpis.avgCommitSize <= 500 ? 'good' : 'warn',
          statusText: metrics.kpis.avgCommitSize <= 500 ? 'Modular' : 'Ukuran Besar',
        },
        {
          label: 'Aktivitas Akhir Pekan',
          value: `${metrics.kpis.weekendDays} hari`,
          status: metrics.kpis.weekendDays <= 5 ? 'good' : 'warn',
          statusText: metrics.kpis.weekendDays <= 5 ? 'Terjaga' : 'Perlu Seimbang',
        },
      ],
      weeklyCommits: metrics.weekly.map((w) => ({ week: w.week, count: w.commits })),
      monthlyContributions,
      monthlySummary: `Hari kerja aktif: ${activePct}% · Kestabilan: ${metrics.scores.consistency}%`,
      commitHeatmap: buildHeatmap(flowCommits.map((c) => c.authored_at)),
      releaseFlow: {
        branches: releaseFlow.branches,
        totalPoints: Math.round(releaseFlow.totalPoints * 10) / 10,
        pointsPerMonth,
        hasOtherBranch: releaseFlow.hasOtherBranch,
        stages: releaseFlow.stages.map((x) => ({ ...x, points: Math.round(x.points * 10) / 10 })),
        funnel: releaseFlow.funnel,
        monthly: releaseFlow.monthly.map((m) => ({ ...m, points: Math.round(m.points * 10) / 10 })),
        firstMasterMonth: releaseFlow.firstMasterMonth ? formatYmId(releaseFlow.firstMasterMonth) : null,
      },
      repeatedIssues: {
        fixCommitCount: repeated.fixCommitCount,
        repeatedFiles: repeated.repeatedFiles.slice(0, 10),
        fixOnFix: repeated.fixOnFix,
        backAndForth: repeated.backAndForth,
      },
      areas: {
        primaryRole: areasView.primaryRole,
        roleLabel: areasView.roleLabel,
        areas: areasView.areas,
        languages: areasView.languages.slice(0, 10),
      },
      identity: {
        role: areasView.primaryRole,
        roleLabel: areasView.roleLabel,
        rank: 1,
        rankTotal: 1,
        roleRank: 1,
        roleTotal: 1,
      },
      narrative: {
        movement,
        strengths: narrativeStrengths.slice(0, 4),
        focus: focus.slice(0, 4),
      },
    },
    aiAnalysis: {
      model: aiNarrative.model,
      summary: aiNarrative.summary,
      strengths: aiNarrative.strengths,
      improvements: aiNarrative.improvements,
      projectContributions,
      fileTypes,
      hotspots,
    },
    reworkExamples,
  };
}
