/** Pure "Rapor Talent" analysis - no DB / server deps so it can be unit-tested. */

export type FlowStage = "develop" | "release" | "master" | "other";

export interface FlowCommit {
  sha: string;
  project_id: number;
  authored_at: string;
  is_fix: number;
  adj_additions: number;
  adj_deletions: number;
}

export interface FlowMr {
  project_id: number;
  role: string;
  created_at: string;
  merged_at: string | null;
  source_branch: string | null;
  target_branch: string | null;
}

export interface FlowEvent {
  created_at: string;
  action: string;
  project_id: number | null;
  ref: string | null;
}

export interface ReachRow {
  sha: string;
  stage: string;
}

export interface CommitFileRow {
  sha: string;
  project_id: number;
  path: string;
  added: number;
  deleted: number;
}

export interface LineHashRow {
  sha: string;
  path: string;
  added_hashes: string | null;
  deleted_hashes: string | null;
}

export const STAGE_POINTS: Record<Exclude<FlowStage, "other">, number> = {
  develop: 2,
  release: 3,
  master: 5,
};

export const STAGE_LABELS: Record<Exclude<FlowStage, "other">, string> = {
  develop: "MR ke develop",
  release: "MR ke release",
  master: "MR ke master (production)",
};

export const BRANCH_POINTS = 1;
export const CARRIED_FACTOR = 0.5;

/** Target for a full release-flow score, calibrated from team distribution. */
export const RELEASE_TARGET_POINTS_PER_MONTH = 300;
export const RELEASE_TARGET_REACH_RATE = 0.75;
export const FIX_ON_FIX_WINDOW_DAYS = 45;

/** Finding status thresholds, calibrated from the reference reports. */
export const FINDING_THRESHOLDS = {
  duplicateLinesPer100: { warn: 2, critical: 5 },
  deepNestingPer100: { warn: 7, critical: 12 },
  debugPrintsPer100: { warn: 1, critical: 3 },
  emptyCatchPer100: { warn: 1, critical: 3 },
  sqlStringPer100: { warn: 1, critical: 3 },
  anyTypePer100: { warn: 1.5, critical: 4 },
} as const;

export const OVERALL_WEIGHTS = {
  productivity: 25,
  quality: 20,
  collaboration: 15,
  consistency: 15,
  releaseFlow: 25,
} as const;

const MONTH_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
});

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_MS = 86_400_000;

export function monthKey(iso: string): string {
  return MONTH_FMT.format(new Date(iso));
}

export function monthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const name = MONTH_NAMES_ID[parseInt(month, 10) - 1] || month;
  return `${name} ${year}`;
}

export function monthsBetween(start: Date, end: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (d <= last) {
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export function stageOfTarget(target: string | null): FlowStage {
  const t = (target || "").toLowerCase();
  if (/master|main|production|prod/.test(t)) return "master";
  if (/release|staging|stage|uat|preprod/.test(t)) return "release";
  if (/develop|development|dev|integration/.test(t)) return "develop";
  return "other";
}

const BACKEND_TS_PATH_RE =
  /(^|\/)(api|services?|controllers?|repositories?|models?|db|database|migrations?|server|backend|prisma|sql|queries|webhook)(\/|\.|$)|\.(service|controller|repository|model|route)\.[cm]?[jt]s$/i;

export function classifyArea(path: string): "frontend" | "backend" | "qa" | null {
  const p = path.toLowerCase();
  if (
    /(^|\/)(__tests__|tests?|e2e|__mocks__|cypress|playwright)\//.test(p) ||
    /\.(test|spec)\.[a-z0-9]+$/.test(p) ||
    p.endsWith(".snap") ||
    p.endsWith(".feature")
  )
    return "qa";
  const ext = p.slice(p.lastIndexOf("."));
  if ([".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss", ".less", ".html", ".astro"].includes(ext)) return "frontend";
  if ([".go", ".py", ".php", ".java", ".kt", ".rb", ".cs", ".rs", ".sql", ".graphql"].includes(ext))
    return "backend";
  if ([".ts", ".js", ".mjs", ".cjs"].includes(ext)) {
    return BACKEND_TS_PATH_RE.test(p) ? "backend" : "frontend";
  }
  return null;
}

export function languageOf(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".tsx")) return "TypeScript (React)";
  if (p.endsWith(".jsx")) return "JavaScript (React)";
  if (p.endsWith(".ts")) return "TypeScript";
  if (p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".cjs")) return "JavaScript";
  const ext = p.slice(p.lastIndexOf("."));
  const map: Record<string, string> = {
    ".go": "Go",
    ".py": "Python",
    ".php": "PHP",
    ".java": "Java",
    ".kt": "Kotlin",
    ".rb": "Ruby",
    ".cs": "C#",
    ".rs": "Rust",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".json": "JSON",
    ".md": "Markdown",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".sql": "SQL",
    ".sh": "Shell",
    ".jenkinsfile": "Jenkinsfile",
  };
  if (map[ext]) return map[ext];
  if (p.endsWith("jenkinsfile")) return "Jenkinsfile";
  return ext.replace(".", "").toUpperCase() || "Lainnya";
}

function inRange(iso: string | null, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / DAY_MS;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface ReleaseFlowStageRow {
  key: FlowStage;
  label: string;
  created: number;
  merged: number;
  carried: number;
  pointsPerMr: number;
  points: number;
}

export interface MonthlyFlowRow {
  ym: string;
  label: string;
  branches: number;
  develop: number;
  release: number;
  master: number;
  other: number;
  points: number;
}

export interface ReleaseFlowResult {
  branches: number;
  stages: ReleaseFlowStageRow[];
  totalPoints: number;
  pointsPerMonth: number;
  monthly: MonthlyFlowRow[];
  hasOtherBranch: boolean;
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
  reachRate: number;
  firstMasterMonth: string | null;
  score: number;
}

export interface ReleaseFlowInput {
  commits: FlowCommit[];
  mrs: FlowMr[];
  events: FlowEvent[];
  reaches: ReachRow[];
  start: Date;
  end: Date;
}

export function scoreReleaseFlow(pointsPerMonth: number, reachRate: number): number {
  const volume = Math.min(pointsPerMonth / RELEASE_TARGET_POINTS_PER_MONTH, 1) * 60;
  const reach = Math.min(reachRate / RELEASE_TARGET_REACH_RATE, 1) * 40;
  return Math.round(Math.max(0, Math.min(100, volume + reach)));
}

export function computeReleaseFlow(input: ReleaseFlowInput): ReleaseFlowResult {
  const { start, end } = input;
  const months = monthsBetween(start, end);

  const myMrs = input.mrs.filter((m) => m.role === "author");
  const createdMrs = myMrs.filter((m) => inRange(m.created_at, start, end));
  const mergedMrs = myMrs.filter((m) => inRange(m.merged_at, start, end));

  const pushEvents = input.events.filter((e) => e.action === "pushed new" && inRange(e.created_at, start, end));
  const branchCount = pushEvents.length;

  const pushedRefs = new Set<string>();
  for (const e of input.events) {
    if (e.project_id && e.ref) pushedRefs.add(`${e.project_id}:${e.ref}`);
  }

  const stageRows: ReleaseFlowStageRow[] = (["develop", "release", "master", "other"] as FlowStage[]).map((stage) => {
    const created = createdMrs.filter((m) => stageOfTarget(m.target_branch) === stage).length;
    const merged = mergedMrs.filter((m) => stageOfTarget(m.target_branch) === stage);
    const carried = input.mrs.filter(
      (m) =>
        m.role !== "author" &&
        inRange(m.merged_at, start, end) &&
        stageOfTarget(m.target_branch) === stage &&
        m.source_branch &&
        stageOfTarget(m.source_branch) === "other" &&
        pushedRefs.has(`${m.project_id}:${m.source_branch}`),
    ).length;
    const pointsPerMr = stage === "other" ? 0 : STAGE_POINTS[stage];
    return {
      key: stage,
      label: stage === "other" ? "MR ke branch lain" : STAGE_LABELS[stage],
      created,
      merged: merged.length,
      carried,
      pointsPerMr,
      points: merged.length * pointsPerMr + carried * pointsPerMr * CARRIED_FACTOR,
    };
  });

  const branchPoints = branchCount * BRANCH_POINTS;
  const mrPoints = stageRows.reduce((s, r) => s + r.points, 0);
  const totalPoints = branchPoints + mrPoints;
  const monthCount = Math.max(1, (end.getTime() - start.getTime()) / (DAY_MS * 30.4375));

  const monthly: MonthlyFlowRow[] = months.map((ym) => {
    const row: MonthlyFlowRow = {
      ym,
      label: monthLabel(ym),
      branches: pushEvents.filter((e) => monthKey(e.created_at) === ym).length,
      develop: 0,
      release: 0,
      master: 0,
      other: 0,
      points: 0,
    };
    row.branches = pushEvents.filter((e) => monthKey(e.created_at) === ym).length;
    row.points += row.branches * BRANCH_POINTS;
    for (const m of mergedMrs) {
      if (monthKey(m.merged_at!) !== ym) continue;
      const stage = stageOfTarget(m.target_branch);
      row[stage] += 1;
      if (stage !== "other") row.points += STAGE_POINTS[stage];
    }
    for (const m of input.mrs) {
      if (m.role === "author" || !inRange(m.merged_at, start, end)) continue;
      if (monthKey(m.merged_at!) !== ym) continue;
      const stage = stageOfTarget(m.target_branch);
      if (stage === "other") continue;
      if (!m.source_branch || stageOfTarget(m.source_branch) !== "other" || !pushedRefs.has(`${m.project_id}:${m.source_branch}`)) continue;
      row.points += STAGE_POINTS[stage] * CARRIED_FACTOR;
    }
    return row;
  });

  const reachByCommit = new Map<string, Set<string>>();
  for (const r of input.reaches) {
    const set = reachByCommit.get(r.sha) ?? new Set<string>();
    set.add(r.stage);
    reachByCommit.set(r.sha, set);
  }

  let master = 0;
  let release = 0;
  let develop = 0;
  let none = 0;
  let total = 0;
  let firstMaster: string | null = null;
  for (const c of input.commits) {
    if (!inRange(c.authored_at, start, end)) continue;
    total++;
    const reach = reachByCommit.get(c.sha);
    if (reach?.has("master")) {
      master++;
      if (!firstMaster || new Date(c.authored_at) < new Date(firstMaster)) firstMaster = c.authored_at;
    } else if (reach?.has("release")) release++;
    else if (reach?.has("develop")) develop++;
    else none++;
  }
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const reachRate = total ? master / total : 0;
  const pointsPerMonth = totalPoints / monthCount;

  return {
    branches: branchCount,
    stages: stageRows,
    totalPoints,
    pointsPerMonth,
    monthly,
    hasOtherBranch: stageRows.some((r) => r.key === "other" && (r.created > 0 || r.merged > 0)),
    funnel: {
      master,
      release,
      develop,
      none,
      total,
      masterPct: pct(master),
      releasePct: pct(release),
      developPct: pct(develop),
    },
    reachRate,
    firstMasterMonth: firstMaster ? monthKey(firstMaster) : null,
    score: scoreReleaseFlow(pointsPerMonth, reachRate),
  };
}

export interface AreaContribution {
  key: "frontend" | "backend" | "qa";
  label: string;
  lines: number;
  pct: number;
}

export interface LanguageContribution {
  language: string;
  lines: number;
  commits: number;
  intensity: "Intensif" | "Aktif" | "Dasar";
}

export interface AreaResult {
  areas: AreaContribution[];
  primaryRole: string;
  roleLabel: string;
  languages: LanguageContribution[];
}

const AREA_LABELS: Record<AreaContribution["key"], string> = {
  frontend: "Frontend",
  backend: "Backend",
  qa: "Tes / QA",
};

const ROLE_LABELS: Record<AreaContribution["key"], string> = {
  frontend: "Frontend Engineer",
  backend: "Backend Engineer",
  qa: "QA Engineer",
};

export function computeAreas(files: CommitFileRow[]): AreaResult {
  const areaLines: Record<AreaContribution["key"], number> = { frontend: 0, backend: 0, qa: 0 };
  const languageLines = new Map<string, { lines: number; commits: Set<string> }>();

  for (const f of files) {
    const area = classifyArea(f.path);
    if (area) areaLines[area] += f.added;
    const lang = languageOf(f.path);
    const cur = languageLines.get(lang) ?? { lines: 0, commits: new Set<string>() };
    cur.lines += f.added;
    cur.commits.add(f.sha);
    languageLines.set(lang, cur);
  }

  const total = Object.values(areaLines).reduce((a, b) => a + b, 0);
  const areas = (Object.keys(areaLines) as AreaContribution["key"][])
    .map((key) => ({ key, label: AREA_LABELS[key], lines: areaLines[key], pct: total ? Math.round((areaLines[key] / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.lines - a.lines);

  const primary = areas[0]?.key ?? "backend";
  const languages = [...languageLines.entries()]
    .map(([language, v]) => ({
      language,
      lines: v.lines,
      commits: v.commits.size,
      intensity: (v.lines >= 3000 ? "Intensif" : v.lines >= 800 ? "Aktif" : "Dasar") as LanguageContribution["intensity"],
    }))
    .sort((a, b) => b.lines - a.lines);

  return { areas, primaryRole: ROLE_LABELS[primary], roleLabel: AREA_LABELS[primary], languages };
}

export interface RepeatedFile {
  file: string;
  fixCount: number;
  avgLines: number;
  rangeDays: number;
  medianGapDays: number;
  kind: string;
}

export interface FixOnFixExample {
  file: string;
  first: string;
  second: string;
  lines: number;
  gapDays: number;
}

export interface BackAndForthFile {
  file: string;
  lines: number;
  commits: number;
  lastCommit: string;
}

export interface RepeatedIssuesResult {
  fixCommitCount: number;
  repeatedFiles: RepeatedFile[];
  fixOnFix: { count: number; lines: number; examples: FixOnFixExample[] };
  backAndForth: { lines: number; commits: number; files: BackAndForthFile[] };
  monthly: Record<string, { fix: number; repeat: number }>;
}

interface FileCommit {
  sha: string;
  at: string;
  isFix: boolean;
  lines: number;
  addedHashes: string[];
  deletedHashes: string[];
}

function parseHashes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function computeRepeatedIssues(input: {
  commits: FlowCommit[];
  files: CommitFileRow[];
  lines: LineHashRow[];
}): RepeatedIssuesResult {
  const commitBySha = new Map(input.commits.map((c) => [c.sha, c]));
  const hashByShaPath = new Map<string, { added: string[]; deleted: string[] }>();
  for (const l of input.lines)
    hashByShaPath.set(`${l.sha}:${l.path}`, { added: parseHashes(l.added_hashes), deleted: parseHashes(l.deleted_hashes) });

  const byFile = new Map<string, FileCommit[]>();
  for (const f of input.files) {
    const c = commitBySha.get(f.sha);
    if (!c) continue;
    const hashes = hashByShaPath.get(`${f.sha}:${f.path}`);
    const entry: FileCommit = {
      sha: f.sha,
      at: c.authored_at,
      isFix: Boolean(c.is_fix),
      lines: f.added + f.deleted,
      addedHashes: hashes?.added ?? [],
      deletedHashes: hashes?.deleted ?? [],
    };
    const list = byFile.get(f.path) ?? [];
    list.push(entry);
    byFile.set(f.path, list);
  }
  for (const list of byFile.values()) list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const repeatedFiles: RepeatedFile[] = [];
  const fixOnFixExamples: FixOnFixExample[] = [];
  let fixOnFixLines = 0;
  let fixOnFixCount = 0;
  const backAndForthFiles: BackAndForthFile[] = [];
  const backCommitSet = new Set<string>();
  const monthly: Record<string, { fix: number; repeat: number }> = {};
  for (const c of input.commits) {
    if (!c.is_fix) continue;
    const ym = monthKey(c.authored_at);
    monthly[ym] ??= { fix: 0, repeat: 0 };
    monthly[ym].fix++;
  }

  for (const [file, list] of byFile) {
    const fixes = list.filter((e) => e.isFix);
    if (fixes.length >= 3) {
      const gaps: number[] = [];
      for (let i = 1; i < fixes.length; i++) gaps.push(daysBetween(fixes[i - 1].at, fixes[i].at));
      const avgLines = fixes.reduce((s, f) => s + f.lines, 0) / fixes.length;
      repeatedFiles.push({
        file,
        fixCount: fixes.length,
        avgLines: Math.round(avgLines * 10) / 10,
        rangeDays: Math.round(Math.max(...gaps)),
        medianGapDays: Math.round(median(gaps) * 10) / 10,
        kind: fixes.length >= 5 || avgLines >= 20 ? "perbaikan berulang" : "perbaikan kecil rutin",
      });
    }
    for (let i = 1; i < fixes.length; i++) {
      const gap = daysBetween(fixes[i - 1].at, fixes[i].at);
      if (gap > FIX_ON_FIX_WINDOW_DAYS) continue;
      fixOnFixCount++;
      fixOnFixLines += fixes[i].lines;
      const ym = monthKey(fixes[i].at);
      monthly[ym] ??= { fix: 0, repeat: 0 };
      monthly[ym].repeat++;
      fixOnFixExamples.push({ file, first: fixes[i - 1].sha, second: fixes[i].sha, lines: fixes[i].lines, gapDays: Math.round(gap * 10) / 10 });
    }

    const deletedAt = new Map<string, number>();
    const counted = new Set<string>();
    let lines = 0;
    const commits = new Set<string>();
    let last: FileCommit | null = null;
    for (const entry of list) {
      for (const h of entry.deletedHashes) deletedAt.set(h, new Date(entry.at).getTime());
      for (const h of entry.addedHashes) {
        const prev = deletedAt.get(h);
        if (prev === undefined || prev >= new Date(entry.at).getTime()) continue;
        if (counted.has(h)) continue;
        counted.add(h);
        lines++;
        commits.add(entry.sha);
        backCommitSet.add(entry.sha);
        last = entry;
      }
    }
    if (lines > 0 && last) backAndForthFiles.push({ file, lines, commits: commits.size, lastCommit: last.sha });
  }

  repeatedFiles.sort((a, b) => b.fixCount - a.fixCount);
  fixOnFixExamples.sort((a, b) => b.lines - a.lines);
  backAndForthFiles.sort((a, b) => b.lines - a.lines);

  return {
    fixCommitCount: input.commits.filter((c) => c.is_fix).length,
    repeatedFiles,
    fixOnFix: { count: fixOnFixCount, lines: fixOnFixLines, examples: fixOnFixExamples.slice(0, 8) },
    backAndForth: {
      lines: backAndForthFiles.reduce((s, f) => s + f.lines, 0),
      commits: backCommitSet.size,
      files: backAndForthFiles.slice(0, 8),
    },
    monthly,
  };
}

export function computeOverallScore(scores: {
  productivity: number;
  quality: number;
  collaboration: number;
  consistency: number;
  releaseFlow: number;
}): number {
  const total =
    scores.productivity * OVERALL_WEIGHTS.productivity +
    scores.quality * OVERALL_WEIGHTS.quality +
    scores.collaboration * OVERALL_WEIGHTS.collaboration +
    scores.consistency * OVERALL_WEIGHTS.consistency +
    scores.releaseFlow * OVERALL_WEIGHTS.releaseFlow;
  return Math.round(Math.max(0, Math.min(100, total / 100)));
}
