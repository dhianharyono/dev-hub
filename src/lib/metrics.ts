/** Pure metric computation - no DB / server deps so it can be unit-tested. */

export interface CommitRow {
  authored_at: string;
  adj_additions: number;
  adj_deletions: number;
  additions: number;
  deletions: number;
  is_merge: number;
  is_fix: number;
  project_id: number;
}
export interface MrRow {
  role: "author" | "reviewer";
  created_at: string;
  merged_at: string | null;
  state: string;
  project_id: number;
}
export interface EventRow {
  created_at: string;
  action: string;
  noteable_type: string | null;
}
export interface PipelineRow {
  status: string;
  created_at: string;
}

export interface MetricsInput {
  start: Date;
  end: Date;
  commits: CommitRow[];
  mrs: MrRow[];
  events: EventRow[];
  pipelines: PipelineRow[];
  projectNames: Record<number, string>;
}

export interface Scores {
  productivity: number;
  quality: number;
  collaboration: number;
  consistency: number;
  overall: number;
  grade: "A" | "B" | "C" | "D" | "E";
  gradeLabel: string;
}

const TZ = "Asia/Jakarta";
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" });
export const localDay = (d: string | Date) => dayFmt.format(new Date(d));
const localHour = (d: string) => Number(hourFmt.format(new Date(d)));

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);

export function weekStart(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function workdaysBetween(start: Date, end: Date) {
  let n = 0;
  const d = new Date(`${localDay(start)}T00:00:00Z`);
  const last = new Date(`${localDay(end)}T00:00:00Z`);
  while (d <= last) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) n++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return Math.max(1, n);
}

export function gradeOf(score: number): Pick<Scores, "grade" | "gradeLabel"> {
  if (score >= 85) return { grade: "A", gradeLabel: "Sangat Baik" };
  if (score >= 70) return { grade: "B", gradeLabel: "Baik" };
  if (score >= 55) return { grade: "C", gradeLabel: "Cukup" };
  if (score >= 40) return { grade: "D", gradeLabel: "Kurang" };
  return { grade: "E", gradeLabel: "Perlu Perhatian" };
}

export function computeMetrics(input: MetricsInput) {
  const { start, end } = input;
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };
  const allCommits = input.commits.filter((c) => inRange(c.authored_at));
  const commits = allCommits.filter((c) => !c.is_merge);
  const mergeCommits = allCommits.length - commits.length;
  const authored = input.mrs.filter((m) => m.role === "author" && inRange(m.created_at));
  const merged = input.mrs.filter((m) => m.role === "author" && m.merged_at && inRange(m.merged_at));
  const reviewed = input.mrs.filter((m) => m.role === "reviewer" && inRange(m.created_at));
  const comments = input.events.filter((e) => inRange(e.created_at) && e.action.startsWith("commented") && e.noteable_type === "MergeRequest");
  const approvals = input.events.filter((e) => inRange(e.created_at) && e.action === "approved");
  const pipelines = input.pipelines.filter((p) => inRange(p.created_at) && ["success", "failed"].includes(p.status));
  const pipeSuccess = pipelines.filter((p) => p.status === "success").length;

  const days = Math.max(1, (end.getTime() - start.getTime()) / 864e5);
  const weeks = Math.max(1, days / 7);
  const workdays = workdaysBetween(start, end);

  const linesAdded = commits.reduce((s, c) => s + c.adj_additions, 0);
  const linesDeleted = commits.reduce((s, c) => s + c.adj_deletions, 0);
  const rawAdded = commits.reduce((s, c) => s + c.additions, 0);
  const fixCommits = commits.filter((c) => c.is_fix).length;

  // daily / weekly / hourly
  const daily: Record<string, number> = {};
  const hourly = new Array(24).fill(0) as number[];
  const weeklyMap = new Map<string, { commits: number; lines: number; mrs: number }>();
  for (const c of commits) {
    const day = localDay(c.authored_at);
    daily[day] = (daily[day] ?? 0) + 1;
    hourly[localHour(c.authored_at)]++;
    const w = weekStart(day);
    const cur = weeklyMap.get(w) ?? { commits: 0, lines: 0, mrs: 0 };
    cur.commits++;
    cur.lines += c.adj_additions + c.adj_deletions;
    weeklyMap.set(w, cur);
  }
  for (const m of merged) {
    const w = weekStart(localDay(m.merged_at!));
    const cur = weeklyMap.get(w) ?? { commits: 0, lines: 0, mrs: 0 };
    cur.mrs++;
    weeklyMap.set(w, cur);
  }
  // fill empty weeks
  const weekly: { week: string; commits: number; lines: number; mrs: number }[] = [];
  for (let w = weekStart(localDay(start)); w <= localDay(end); ) {
    weekly.push({ week: w, ...(weeklyMap.get(w) ?? { commits: 0, lines: 0, mrs: 0 }) });
    const d = new Date(`${w}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7);
    w = d.toISOString().slice(0, 10);
  }

  const activeDays = Object.keys(daily).length;
  const activeWorkdays = Object.keys(daily).filter((d) => {
    const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
    return dow !== 0 && dow !== 6;
  }).length;
  const weekendDays = activeDays - activeWorkdays;

  // ---- scores ----
  const commitsPerWeek = commits.length / weeks;
  const mergedPerWeek = merged.length / weeks;
  const productivity = clamp(Math.min(commitsPerWeek / 20, 1) * 60 + Math.min(mergedPerWeek / 3, 1) * 40);

  const pipelineRate = pipelines.length >= 5 ? pipeSuccess / pipelines.length : 0.7;
  const fixRatio = commits.length ? fixCommits / commits.length : 0;
  const avgCommitSize = commits.length ? (linesAdded + linesDeleted) / commits.length : 0;
  const sizeScore = avgCommitSize <= 150 ? 1 : avgCommitSize >= 800 ? 0 : 1 - (avgCommitSize - 150) / 650;
  const quality = clamp(pipelineRate * 50 + (1 - Math.min(fixRatio / 0.4, 1)) * 25 + sizeScore * 25);

  const interactionsPerWeek = (reviewed.length + approvals.length + comments.length * 0.5) / weeks;
  const collaboration = clamp(Math.min(interactionsPerWeek / 4, 1) * 70 + Math.min(authored.length / weeks / 2, 1) * 30);

  const wc = weekly.map((w) => w.commits);
  const mean = wc.reduce((a, b) => a + b, 0) / Math.max(1, wc.length);
  const sd = Math.sqrt(wc.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, wc.length));
  const cv = mean ? sd / mean : 1;
  const consistency = clamp(Math.min(activeWorkdays / workdays / 0.8, 1) * 70 + (1 - Math.min(cv, 1)) * 30);

  const overall = clamp(productivity * 0.3 + quality * 0.25 + collaboration * 0.2 + consistency * 0.25);
  const scores: Scores = {
    productivity: round(productivity),
    quality: round(quality),
    collaboration: round(collaboration),
    consistency: round(consistency),
    overall: round(overall),
    ...gradeOf(overall),
  };

  // ---- top projects ----
  const byProject = new Map<number, { commits: number; lines: number; mrs: number }>();
  for (const c of commits) {
    const cur = byProject.get(c.project_id) ?? { commits: 0, lines: 0, mrs: 0 };
    cur.commits++;
    cur.lines += c.adj_additions + c.adj_deletions;
    byProject.set(c.project_id, cur);
  }
  for (const m of authored) {
    const cur = byProject.get(m.project_id) ?? { commits: 0, lines: 0, mrs: 0 };
    cur.mrs++;
    byProject.set(m.project_id, cur);
  }
  const topProjects = [...byProject.entries()]
    .map(([id, v]) => ({ id, name: input.projectNames[id] ?? `#${id}`, ...v }))
    .sort((a, b) => b.commits - a.commits || b.mrs - a.mrs);

  // ---- insights ----
  const insights: { tone: "good" | "warn" | "info"; text: string }[] = [];
  if (scores.collaboration < 55)
    insights.push({ tone: "warn", text: `Kolaborasi rendah: ${reviewed.length} review, ${comments.length} komentar MR dalam periode ini. Targetkan ±4 review/komentar per minggu.` });
  if (fixRatio > 0.25) insights.push({ tone: "warn", text: `${Math.round(fixRatio * 100)}% commit adalah fix/revert. Pertimbangkan testing lokal & review sebelum push.` });
  if (avgCommitSize > 500) insights.push({ tone: "warn", text: `Rata-rata ${Math.round(avgCommitSize)} baris per commit. Commit lebih kecil memudahkan review.` });
  if (pipelines.length >= 5 && pipelineRate < 0.8) insights.push({ tone: "warn", text: `Pipeline sukses hanya ${Math.round(pipelineRate * 100)}% (${pipelines.length - pipeSuccess} gagal).` });
  if (rawAdded > linesAdded * 1.5 && rawAdded - linesAdded > 5000)
    insights.push({ tone: "info", text: `${(rawAdded - linesAdded).toLocaleString("id-ID")} baris dari file generate/lock/vendor tidak dihitung.` });
  if (mergeCommits > 0) insights.push({ tone: "info", text: `${mergeCommits} merge commit diabaikan dari perhitungan.` });
  if (weekendDays > 3) insights.push({ tone: "info", text: `Aktif di ${weekendDays} hari akhir pekan. Jaga keseimbangan kerja 🙂` });
  if (scores.consistency >= 80) insights.push({ tone: "good", text: `Konsisten: aktif ${activeWorkdays} dari ${workdays} hari kerja.` });
  if (scores.productivity >= 80) insights.push({ tone: "good", text: `Produktivitas tinggi: ${commitsPerWeek.toFixed(1)} commit & ${mergedPerWeek.toFixed(1)} MR merged per minggu.` });

  const peakHour = hourly.indexOf(Math.max(...hourly));

  return {
    period: { start: start.toISOString(), end: end.toISOString(), days: Math.round(days), workdays },
    kpis: {
      commits: commits.length,
      mergeCommits,
      linesAdded,
      linesDeleted,
      rawAdded,
      mrsCreated: authored.length,
      mrsMerged: merged.length,
      reviews: reviewed.length,
      comments: comments.length,
      approvals: approvals.length,
      activeDays,
      activeWorkdays,
      weekendDays,
      pipelines: pipelines.length,
      pipelineSuccessRate: pipelines.length ? pipeSuccess / pipelines.length : null,
      fixRatio,
      commitsPerWeek,
      avgCommitSize,
      peakHour: commits.length ? peakHour : null,
      projects: topProjects.length,
    },
    scores,
    weekly,
    daily,
    hourly,
    topProjects,
    insights,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
