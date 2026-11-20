import 'server-only';
import { db } from './db';
import { getSettings } from './settings';
import { loadMetrics, loadScorecard } from './stats';
import { runAiCompletion, extractJsonFromAiResponse } from './ai/client';
import { resolveAiModel } from './ai/models';
import {
  computeAreas,
  computeReleaseFlow,
  monthKey,
  monthLabel,
  monthsBetween,
  stageOfTarget,
  STAGE_POINTS,
  type FlowCommit,
  type FlowEvent,
  type FlowMr,
  type ReachRow,
} from './talent-report';
import { analyzeRework, isFixLikeCommit, type ScoreFile } from './scoring';
import {
  referenceReportData,
  type FullReportData,
  type MonthlyContribution,
  type ReworkExample,
  type WorkAreaRow,
  type FileExtRow,
  type HotspotRow,
  type CommitCheckRow,
  type QualityIndicator,
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
const HEATMAP_SLOTS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

function buildHeatmap(authoredAt: string[]) {
  const matrix = Array.from({ length: 7 }, () => new Array(HEATMAP_SLOTS.length).fill(0) as number[]);
  for (const iso of authoredAt) {
    const day = DAY_INDEX[WEEKDAY_FMT.format(new Date(iso))] ?? 0;
    const hour = parseInt(HOUR_FMT.format(new Date(iso)), 10);
    const slot = Math.min(HEATMAP_SLOTS.length - 1, hour);
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
  const score = loadScorecard(0);
  const start = new Date(score.period.start);
  const end = new Date(score.period.end);
  const sIso = start.toISOString();
  const eIso = end.toISOString();
  const months = Math.max(1, score.period.months);
  const monthsExact = Math.max(1, score.period.days / 30.4375);

  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const glUser = (() => {
    try {
      if (userRow?.value) return JSON.parse(userRow.value) as { id: number; username: string; name: string };
    } catch {
      // abaikan, pakai fallback di bawah
    }
    return {
      id: 0,
      username: s.gitlabUsername || 'talent',
      name: s.gitlabUsername || 'talent',
    };
  })();

  const splitValues = (value: string | null | undefined) =>
    (value || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  const emails = [...new Set(splitValues(s.identityEmails))];
  const names = [...new Set([...splitValues(s.identityNames), glUser.username.toLowerCase(), glUser.name.toLowerCase()])];

  const commitClauses: string[] = [];
  const commitParams: string[] = [];
  if (emails.length) {
    commitClauses.push(`lower(c.author_email) IN (${emails.map(() => '?').join(',')})`);
    commitParams.push(...emails);
  }
  if (names.length) {
    commitClauses.push(`lower(c.author_name) IN (${names.map(() => '?').join(',')})`);
    commitParams.push(...names);
  }
  const commitIdentity = commitClauses.length ? `(${commitClauses.join(' OR ')})` : '0';
  const mrIdentity = names.length ? `lower(m.author) IN (${names.map(() => '?').join(',')})` : '0';

  const flowCommits = d
    .prepare(
      `SELECT c.sha, c.project_id, c.authored_at, c.title, c.is_fix, c.adj_additions, c.adj_deletions
       FROM gl_commits c
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${commitIdentity}
       ORDER BY c.authored_at`,
    )
    .all(sIso, eIso, ...commitParams) as unknown as (FlowCommit & { title: string })[];

  const flowMrs = d
    .prepare(
      `SELECT m.project_id, m.role, m.created_at, m.merged_at, m.source_branch, m.target_branch
       FROM gl_mrs m
       WHERE m.role = 'author' AND ${mrIdentity}
         AND (m.created_at BETWEEN ? AND ? OR m.merged_at BETWEEN ? AND ?)`,
    )
    .all(...names, sIso, eIso, sIso, eIso) as unknown as FlowMr[];

  const flowEvents = d
    .prepare('SELECT created_at, action, project_id, ref FROM gl_events WHERE created_at BETWEEN ? AND ?')
    .all(sIso, eIso) as unknown as FlowEvent[];
  const reaches = d
    .prepare(
      `SELECT r.sha, r.stage FROM gl_commit_reach r JOIN gl_commits c ON c.sha = r.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${commitIdentity}`,
    )
    .all(sIso, eIso, ...commitParams) as unknown as ReachRow[];
  const files = d
    .prepare(
      `SELECT f.sha, f.project_id, f.path, f.added, f.deleted, f.added_hashes, f.deleted_hashes, f.issues_json
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${commitIdentity}`,
    )
    .all(sIso, eIso, ...commitParams) as unknown as ScoreFile[];

  const releaseFlow = computeReleaseFlow({ commits: flowCommits, mrs: flowMrs, events: flowEvents, reaches, start, end });
  const pointsPerMonth = Math.round(score.evidence.releasePointsPerMonth * 10) / 10;
  const analysis = analyzeRework(files, flowCommits);
  const areasView = computeAreas(files);
  const commitBySha = new Map(flowCommits.map((c) => [c.sha, c]));

  const linesAdded = flowCommits.reduce((sum, c) => sum + c.adj_additions, 0);
  const linesDeleted = flowCommits.reduce((sum, c) => sum + c.adj_deletions, 0);
  const totalActiveDays = new Set(flowCommits.map((c) => DAY_FMT.format(new Date(c.authored_at)))).size;
  const avgCommitSize = flowCommits.length ? Math.round((linesAdded + linesDeleted) / flowCommits.length) : 0;

  const fmtNum = (n: number) => n.toLocaleString('id-ID');
  const fmt1 = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  const startFmt = `${String(start.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[start.getMonth()]} ${start.getFullYear()}`;
  const endFmt = `${String(end.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[end.getMonth()]} ${end.getFullYear()}`;
  const monthsLabel = fmt1(months);

  // ---- Pergerakan bulanan ----
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
  const monthlyRows = monthKeys.map((ym) => {
    const agg = monthAgg.get(ym) ?? { commits: 0, days: new Set<string>(), added: 0, deleted: 0 };
    const flow = flowByMonth.get(ym);
    return {
      month: monthLabel(ym),
      commits: agg.commits,
      activeDays: agg.days.size,
      linesChanged: `+${fmtNum(agg.added)} / -${fmtNum(agg.deleted)}`,
      branches: flow?.branches ?? 0,
      mrDevelop: flow?.develop ?? 0,
      mrRelease: flow?.release ?? 0,
      mrMaster: flow?.master ?? 0,
      points: Math.round((flow?.points ?? 0) * 10) / 10,
    };
  });
  const monthlyContributions: MonthlyContribution[] = monthlyRows.filter(
    (m, i) => i > 0 || m.commits > 0 || Number(m.points) > 0,
  );
  monthlyContributions.push({
    month: 'Rata-rata / bulan',
    commits: Math.round((flowCommits.length / monthsExact) * 10) / 10,
    activeDays: `${fmt1(score.evidence.activeWorkdayRatio)}% hari kerja`,
    linesChanged: `+${fmtNum(Math.round(linesAdded / monthsExact))} / -${fmtNum(Math.round(linesDeleted / monthsExact))}`,
    branches: Math.round((releaseFlow.branches / monthsExact) * 10) / 10,
    mrDevelop: Math.round(((releaseFlow.stages.find((x) => x.key === 'develop')?.merged ?? 0) / monthsExact) * 10) / 10,
    mrRelease: Math.round(((releaseFlow.stages.find((x) => x.key === 'release')?.merged ?? 0) / monthsExact) * 10) / 10,
    mrMaster: Math.round(((releaseFlow.stages.find((x) => x.key === 'master')?.merged ?? 0) / monthsExact) * 10) / 10,
    points: pointsPerMonth,
  });

  // ---- Isu berulang ----
  const repeatedFiles = analysis.repeatedFixFiles;
  const backAndForthCommits = new Set(analysis.backAndForthFiles.flatMap((f) => f.shas)).size;

  const fixLikeByPath = new Map<string, { sha: string; at: number; lines: number }[]>();
  for (const f of files) {
    const commit = commitBySha.get(f.sha);
    if (!commit || !isFixLikeCommit(commit)) continue;
    const list = fixLikeByPath.get(f.path) ?? [];
    list.push({ sha: f.sha, at: new Date(commit.authored_at).getTime(), lines: f.added + f.deleted });
    fixLikeByPath.set(f.path, list);
  }
  const fixOnFixExamples: ReworkExample[] = [];
  for (const [path, list] of fixLikeByPath) {
    list.sort((a, b) => a.at - b.at);
    for (let i = 1; i < list.length; i++) {
      const gapDays = Math.round(((list[i].at - list[i - 1].at) / 864e5) * 10) / 10;
      if (gapDays > 45) continue;
      fixOnFixExamples.push({
        file: path,
        initialCommit: list[i - 1].sha.slice(0, 8),
        modifyingCommit: list[i].sha.slice(0, 8),
        lines: list[i].lines,
        gap: `${gapDays.toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari`,
      });
    }
  }
  fixOnFixExamples.sort((a, b) => b.lines - a.lines);
  const reworkExamples: ReworkExample[] = fixOnFixExamples.slice(0, 6);

  const hotspots: HotspotRow[] = analysis.hotspots.slice(0, 10).map((h) => ({
    file: h.path,
    commits: h.commits,
    lines: h.lines,
    selfReworkLines: h.selfReworkLines,
    selfReworkPct: h.selfReworkPct,
    fixCommits: h.fixCommits,
  }));

  // ---- Area kerja per repository ----
  const projectRows = d
    .prepare(
      `SELECT p.id, p.path, COALESCE(c.commits, 0) AS commits, COALESCE(c.added, 0) AS added,
              COALESCE(c.deleted, 0) AS deleted, COALESCE(m.mrs, 0) AS mrs
       FROM gl_projects p
       LEFT JOIN (
         SELECT c.project_id, count(*) AS commits, sum(c.adj_additions) AS added, sum(c.adj_deletions) AS deleted
         FROM gl_commits c
         WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${commitIdentity}
         GROUP BY c.project_id
       ) c ON c.project_id = p.id
       LEFT JOIN (
         SELECT m.project_id, count(*) AS mrs
         FROM gl_mrs m
         WHERE m.role = 'author' AND ${mrIdentity} AND m.merged_at BETWEEN ? AND ?
         GROUP BY m.project_id
       ) m ON m.project_id = p.id
       WHERE COALESCE(c.commits, 0) > 0 OR COALESCE(m.mrs, 0) > 0`,
    )
    .all(sIso, eIso, ...commitParams, ...names, sIso, eIso) as unknown as {
    id: number;
    path: string;
    commits: number;
    added: number;
    deleted: number;
    mrs: number;
  }[];

  const pointsByProject = new Map<number, number>();
  for (const e of flowEvents) {
    if (e.action !== 'pushed new' || !e.project_id) continue;
    if (!inWindow(e.created_at, start, end)) continue;
    pointsByProject.set(e.project_id, (pointsByProject.get(e.project_id) ?? 0) + 1);
  }
  for (const m of flowMrs) {
    if (m.role !== 'author' || !m.merged_at || !inWindow(m.merged_at, start, end)) continue;
    const stage = stageOfTarget(m.target_branch);
    if (stage === 'other' || !m.project_id) continue;
    pointsByProject.set(m.project_id, (pointsByProject.get(m.project_id) ?? 0) + STAGE_POINTS[stage]);
  }
  const workAreas: WorkAreaRow[] = projectRows
    .map((p) => ({
      name: p.path,
      commits: p.commits,
      added: p.added,
      deleted: p.deleted,
      mrs: p.mrs,
      points: Math.round((pointsByProject.get(p.id) ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.points - a.points || b.commits - a.commits)
    .slice(0, 10);

  // ---- Rekap ekstensi file ----
  const extMap = new Map<string, number>();
  for (const f of files) {
    const idx = f.path.lastIndexOf('.');
    const ext = idx > 0 ? f.path.slice(idx) : '(tanpa ekstensi)';
    extMap.set(ext, (extMap.get(ext) ?? 0) + f.added);
  }
  const fileExtensions: FileExtRow[] = [...extMap.entries()]
    .map(([ext, lines]) => ({ ext, lines }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 8);

  // ---- Commit yang perlu dicek ulang (lokasi temuan tersimpan) ----
  const titles = new Map(flowCommits.map((c) => [c.sha, c.title]));
  const checks: CommitCheckRow[] = [];
  for (const f of files) {
    if (!f.issues_json) continue;
    let bundle: { loc?: Record<string, { line: number; snippet: string }[]> };
    try {
      bundle = JSON.parse(f.issues_json) as { loc?: Record<string, { line: number; snippet: string }[]> };
    } catch {
      continue;
    }
    const loc = bundle.loc;
    if (!loc) continue;
    for (const key of ['secret', 'debugPrint'] as const) {
      const list = loc[key];
      if (!list?.length) continue;
      checks.push({
        sha: f.sha,
        title: titles.get(f.sha) ?? f.sha.slice(0, 8),
        file: f.path,
        finding: key === 'secret' ? 'Secret tertulis' : 'Debug print tertinggal',
        count: list.length,
      });
    }
  }
  checks.sort((a, b) => {
    const weight = (v: CommitCheckRow) => (v.finding === 'Secret tertulis' ? 0 : 1);
    return weight(a) - weight(b) || b.count - a.count;
  });
  const commitsToCheck = checks.slice(0, 6);

  // ---- Komponen, indikator, skill, review ----
  const componentScores = score.components.map((c) => ({
    name: c.label,
    score: c.score,
    weight: c.weight,
    grade: c.grade ?? '-',
  }));

  const qualityOf = (key: string) => score.quality.breakdown.find((b) => b.key === key);
  const recurringOf = (key: string) => score.recurringIssues.find((r) => r.key === key);
  const goodWarn = (value: number, good: number, warn: number): 'good' | 'warn' | 'critical' =>
    value <= good ? 'good' : value <= warn ? 'warn' : 'critical';
  const qualityIndicators: QualityIndicator[] = [
    {
      label: 'Self-rework (kode sendiri diubah lagi ≤ 21 hari)',
      value: `${fmt1(score.evidence.selfReworkPct)}%`,
      status: goodWarn(score.evidence.selfReworkPct, 10, 15),
      statusText: score.evidence.selfReworkPct <= 10 ? 'Baik' : score.evidence.selfReworkPct <= 15 ? 'Perhatian' : 'Kritis',
    },
    {
      label: 'Fix atas fix (≤ 45 hari)',
      value: `${fmtNum(score.evidence.fixOnFix)} commit`,
      status: recurringOf('fixOnFix')?.status ?? 'good',
      statusText: recurringOf('fixOnFix')?.statusLabel ?? 'Baik',
    },
    {
      label: 'File fix berulang (≥ 3×)',
      value: `${fmtNum(qualityOf('repeatedFix')?.count ?? repeatedFiles.length)} file`,
      status: recurringOf('repeatedFix')?.status ?? 'good',
      statusText: recurringOf('repeatedFix')?.statusLabel ?? 'Baik',
    },
    {
      label: 'Kode bolak-balik (≤ 21 hari)',
      value: `${fmtNum(score.evidence.backAndForthLines)} baris`,
      status: recurringOf('backAndForth')?.status ?? 'good',
      statusText: recurringOf('backAndForth')?.statusLabel ?? 'Baik',
    },
    {
      label: 'Proporsi commit fix',
      value: `${fmt1(score.evidence.fixRatio)}%`,
      status: goodWarn(score.evidence.fixRatio, 20, 30),
      statusText: score.evidence.fixRatio <= 20 ? 'Baik' : score.evidence.fixRatio <= 30 ? 'Perhatian' : 'Kritis',
    },
    {
      label: 'Revert asli',
      value: `${fmtNum(score.evidence.revertCount)} commit`,
      status: recurringOf('revert')?.status ?? 'good',
      statusText: recurringOf('revert')?.statusLabel ?? 'Baik',
    },
    {
      label: 'Pesan commit deskriptif',
      value: `${fmt1(score.evidence.messageQuality)}%`,
      status: score.evidence.messageQuality >= 90 ? 'good' : score.evidence.messageQuality >= 70 ? 'warn' : 'critical',
      statusText: score.evidence.messageQuality >= 90 ? 'Baik' : score.evidence.messageQuality >= 70 ? 'Perhatian' : 'Kritis',
    },
    {
      label: 'Kode bertahan (> 21 hari)',
      value: `${fmt1(100 - score.evidence.selfReworkPct)}%`,
      status: 100 - score.evidence.selfReworkPct >= 85 ? 'good' : 100 - score.evidence.selfReworkPct >= 75 ? 'warn' : 'critical',
      statusText: 100 - score.evidence.selfReworkPct >= 85 ? 'Baik' : 100 - score.evidence.selfReworkPct >= 75 ? 'Perhatian' : 'Kritis',
    },
  ];

  const skillLanguages = score.skill.languages.map((l) => ({
    language: l.language,
    lines: l.lines,
    commits: l.commits,
    intensity: l.intensity,
    score: l.score,
    findings: l.findings,
  }));

  const reviewHighlights = score.review.highlights.map((h) => ({
    sha: h.sha,
    shortSha: h.shortSha,
    title: h.title,
    score: h.score,
    summary: h.summary,
    notes: h.notes,
  }));

  // ---- Narasi dari komponen terkuat/terlemah ----
  const scored = componentScores.filter((c): c is typeof c & { score: number } => c.score !== null);
  const strongest = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
  const weakest = [...scored].sort((a, b) => a.score - b.score).slice(0, 3);
  const reasonOf: Record<string, string> = {
    Produktivitas: 'volume commit dan MR stabil',
    'Kualitas Kode': 'rework dan perbaikan berulang terkendali',
    'Skill Kode': 'temuan statis pada kode baru sedikit',
    Kolaborasi: 'review dan MR berjalan aktif',
    Konsistensi: 'ritme kerja terjaga',
    'Alur Rilis': 'pekerjaan sampai production',
  };
  const actionOf = (label: string) => {
    const component = score.components.find((c) => c.label === label);
    return component ? score.actions.find((a) => a.component === component.key) : undefined;
  };
  const strengths = strongest.map((c) => `${c.name} (${c.score}) — ${reasonOf[c.name] ?? 'indikator utama'}.`);
  const focus = weakest.map((c) => {
    const action = actionOf(c.name);
    return `${c.name} (${c.score}) — ${action?.steps[0] ?? action?.title ?? 'tingkatkan indikator ini'}`;
  });

  const topArea = areasView.areas.find((a) => a.lines > 0);
  const secondArea = areasView.areas.filter((a) => a.lines > 0)[1];
  const half = Math.max(1, Math.ceil(releaseFlow.monthly.length / 2));
  const firstAvg = releaseFlow.monthly.slice(0, half).reduce((sum, m) => sum + m.points, 0) / half;
  const lastSlice = releaseFlow.monthly.slice(-half);
  const lastAvg = lastSlice.reduce((sum, m) => sum + m.points, 0) / Math.max(1, lastSlice.length);
  const busiest = [...monthlyContributions.slice(0, -2)].sort((a, b) => b.commits - a.commits)[0];

  const movement: string[] = [
    `Selama ${monthsLabel} bulan masa penugasan (sejak ${startFmt}), ${glUser.name} mencatat rata-rata ${fmt1(score.evidence.commitsPerMonth)} commit per bulan dan aktif pada ${fmt1(score.evidence.activeWorkdayRatio)}% hari kerja. Nilai keseluruhan ${score.overall} (${score.gradeLabel}) dengan kontribusi terbesar di ${areasView.primaryRole}${topArea ? ` (${fmt1(topArea.pct)}% dari kode)` : ''}${secondArea ? `, diikuti ${secondArea.label} (${fmt1(secondArea.pct)}%)` : ''}.`,
    `Poin alur kerja rata-rata ${fmt1(pointsPerMonth)} per bulan. Ritme ${lastAvg >= firstAvg ? 'meningkat' : 'melandai'} dari ${fmtNum(Math.round(firstAvg))} menjadi ${fmtNum(Math.round(lastAvg))} poin/bulan pada paruh akhir penugasan.`,
    `Dalam alur rilis, tercatat ${fmtNum(releaseFlow.branches)} branch, ${fmtNum(releaseFlow.stages.find((x) => x.key === 'develop')?.merged ?? 0)} MR merged ke develop, ${fmtNum(releaseFlow.stages.find((x) => x.key === 'release')?.merged ?? 0)} ke release, dan ${fmtNum(releaseFlow.stages.find((x) => x.key === 'master')?.merged ?? 0)} ke master dengan total ${fmtNum(Math.round(releaseFlow.totalPoints))} poin. Sebanyak ${fmt1(releaseFlow.funnel.masterPct)}% commit sudah sampai master/production.`,
    `Dari sisi kualitas: ${fmt1(score.evidence.fixRatio)}% commit berupa perbaikan; ${fmtNum(qualityOf('repeatedFix')?.count ?? repeatedFiles.length)} file diperbaiki berulang; ${fmtNum(score.evidence.fixOnFix)} perbaikan dilakukan atas perbaikan sebelumnya dalam ≤45 hari; ${fmtNum(score.evidence.backAndForthLines)} baris dihapus lalu dikembalikan.`,
    `Skor Skill Kode ${score.skill.score ?? '-'} dari 100, dihitung atas ${fmtNum(score.skill.scannedLines)} baris; ${fmt1(score.evidence.testPct)}% di antaranya kode tes.${busiest ? ` Bulan paling produktif: ${busiest.month} (${fmtNum(busiest.commits)} commit, ${fmt1(Number(busiest.points))} poin).` : ''}`,
  ];

  // ---- Mingguan + heatmap ----
  const weeklyMap = new Map<string, number>();
  for (const c of flowCommits) {
    const key = weekStartKey(c.authored_at);
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
  }
  const weeklyCommits: { week: string; count: number }[] = [];
  const cursor = new Date(`${weekStartKey(start.toISOString())}T00:00:00Z`);
  const lastWeek = weekStartKey(end.toISOString());
  while (cursor.toISOString().slice(0, 10) <= lastWeek) {
    const key = cursor.toISOString().slice(0, 10);
    weeklyCommits.push({ week: key, count: weeklyMap.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  const cachedAi = getCachedReportAiAnalysis();
  const activeModel = resolveAiModel(s, 'report');

  return {
    meta: {
      title: `Rapor Talent: ${glUser.name}`,
      talentName: glUser.name,
      username: glUser.username,
      email: s.identityEmails || `${glUser.username}@gmail.com`,
      mergedIdentitiesNote: `Identitas tergabung: ${s.identityNames || glUser.name}`,
      periodText: `Periode ${startFmt} – ${endFmt} · masa penugasan ${monthsLabel} bulan`,
      createdText: `Dibuat pada ${endFmt}`,
      totalProjectsCount: projectRows.length,
      footerTitle: 'Rapor Talent : Rahasia, untuk keperluan internal',
      totalPages: 8,
    },
    overallScore: {
      name: glUser.name,
      score: score.overall,
      grade: score.grade,
      gradeLabel: score.gradeLabel,
    },
    methodology: { ...referenceReportData.methodology },
    talentProfile: {
      metrics: {
        tenure: {
          title: 'MASA PENUGASAN',
          value: `${monthsLabel} bln`,
          detail: `mulai ${startFmt}`,
          sub: `${totalActiveDays} hari ada commit`,
        },
        commits: {
          title: 'COMMIT',
          value: fmtNum(score.evidence.commits),
          detail: `${fmt1(score.evidence.commitsPerMonth)}/bulan`,
          sub: `${fmtNum(score.evidence.activeWorkdays)} hari kerja aktif`,
        },
        lines: {
          title: 'BARIS KODE',
          value: `+${fmtNum(linesAdded)} / -${fmtNum(linesDeleted)}`,
          detail: `rata-rata ${fmtNum(avgCommitSize)} baris/commit`,
        },
        mergeRequests: {
          title: 'MERGE REQUEST',
          value: `${fmtNum(score.evidence.mergedMrs)} / ${fmtNum(score.evidence.mrsCreated)}`,
          detail: 'merged / dibuat',
        },
        releasePoints: {
          title: 'POIN ALUR KERJA',
          value: fmtNum(Math.round(releaseFlow.totalPoints)),
          detail: `${fmt1(pointsPerMonth)}/bulan`,
        },
        masterReach: {
          title: 'JANGKAUAN MASTER',
          value: `${fmtNum(releaseFlow.funnel.master)} commit`,
          detail: `${fmt1(releaseFlow.funnel.masterPct)}% sampai production`,
        },
        codeSurvival: {
          title: 'KODE BERTAHAN',
          value: `${fmt1(100 - score.evidence.selfReworkPct)}%`,
          detail: 'tidak diubah dalam 21 hari',
        },
      },
      componentScores,
      qualityIndicators,
      weeklyCommits,
      monthlyContributions,
      monthlySummary: `Minggu dengan commit: ${fmt1((score.evidence.weeksWithCommit / Math.max(1, score.evidence.totalWeeks)) * 100)}% · Kestabilan bulanan: ${fmt1(score.evidence.monthlyStability)}%`,
      releaseFlow: {
        branches: releaseFlow.branches,
        totalPoints: Math.round(releaseFlow.totalPoints * 10) / 10,
        pointsPerMonth,
        hasOtherBranch: releaseFlow.hasOtherBranch,
        stages: releaseFlow.stages.map((x) => ({ ...x, points: Math.round(x.points * 10) / 10 })),
        funnel: releaseFlow.funnel,
        monthly: releaseFlow.monthly
          .filter((m, i) => i > 0 || m.branches > 0 || m.points > 0)
          .map((m) => ({ ...m, points: Math.round(m.points * 10) / 10 })),
        firstMasterMonth: releaseFlow.firstMasterMonth ? formatYmId(releaseFlow.firstMasterMonth) : null,
      },
      repeatedIssues: {
        fixCommitCount: flowCommits.filter((c) => c.is_fix).length,
        repeatedFileCount: repeatedFiles.length,
        repeatedFiles: repeatedFiles.slice(0, 8).map((f) => ({
          file: f.path,
          fixCount: f.fixCount,
          avgLines: f.avgLines,
          kind: f.kind,
        })),
        fixOnFix: {
          count: analysis.fixOnFixCommits,
          lines: analysis.fixOnFixLines,
          examples: reworkExamples.map((e) => ({
            file: e.file,
            first: e.initialCommit,
            second: e.modifyingCommit,
            lines: e.lines,
            gapDays: Number(e.gap.replace(' hari', '')),
          })),
        },
        backAndForth: {
          lines: analysis.backAndForthLines,
          commits: backAndForthCommits,
          files: analysis.backAndForthFiles.slice(0, 5).map((f) => ({
            file: f.path,
            lines: f.count,
            commits: f.shas.length,
            lastCommit: f.shas[f.shas.length - 1] ?? '',
          })),
        },
      },
      areas: {
        primaryRole: areasView.primaryRole,
        roleLabel: areasView.roleLabel,
        areas: areasView.areas,
        languages: areasView.languages.slice(0, 10),
      },
      narrative: {
        movement,
        strengths,
        focus,
      },
      skill: {
        score: score.skill.score,
        testPct: Math.round(score.evidence.testPct * 10) / 10,
        scannedLines: score.skill.scannedLines,
        scannedFiles: score.skill.scannedFiles,
        issues: score.skill.issues.map((i) => ({
          key: i.key,
          label: i.label,
          count: i.count,
          per100: i.per100.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
          status: i.status,
          statusText: i.statusLabel,
        })),
        languages: skillLanguages,
      },
      review: {
        score: score.review.score,
        count: score.review.count,
        highlights: reviewHighlights,
      },
      workAreas,
      fileExtensions,
      hotspots,
      commitsToCheck,
      reworkExamples,
      commitHeatmap: buildHeatmap(flowCommits.map((c) => c.authored_at)),
    },
    aiAnalysis: {
      model: cachedAi?.model ?? activeModel,
      summary: cachedAi?.summary ?? '-',
    },
  };
}

function inWindow(iso: string | null, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function weekStartKey(iso: string): string {
  const dt = new Date(iso);
  const day = dt.getUTCDay();
  dt.setUTCDate(dt.getUTCDate() - ((day + 6) % 7));
  return dt.toISOString().slice(0, 10);
}
