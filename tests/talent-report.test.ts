import { describe, it, expect } from "vitest";
import {
  classifyArea,
  computeAreas,
  computeOverallScore,
  computeRepeatedIssues,
  computeReleaseFlow,
  languageOf,
  monthKey,
  monthsBetween,
  scoreReleaseFlow,
  stageOfTarget,
} from "../src/lib/talent-report";

const period = { start: new Date("2026-09-01T00:00:00Z"), end: new Date("2026-09-30T23:59:59Z") };

describe("Rapor Talent: alur rilis", () => {
  it("maps target branches to stages", () => {
    expect(stageOfTarget("develop")).toBe("develop");
    expect(stageOfTarget("release")).toBe("release");
    expect(stageOfTarget("master")).toBe("master");
    expect(stageOfTarget("main")).toBe("master");
    expect(stageOfTarget("production")).toBe("master");
    expect(stageOfTarget("feature/foo")).toBe("other");
    expect(stageOfTarget(null)).toBe("other");
  });

  it("counts points from merged MRs, branches, and carried work", () => {
    const result = computeReleaseFlow({
      ...period,
      commits: [
        { sha: "c1", project_id: 1, authored_at: "2026-09-02T10:00:00+07:00", is_fix: 0, adj_additions: 10, adj_deletions: 0 },
        { sha: "c2", project_id: 1, authored_at: "2026-09-03T10:00:00+07:00", is_fix: 0, adj_additions: 10, adj_deletions: 0 },
        { sha: "c3", project_id: 1, authored_at: "2026-09-04T10:00:00+07:00", is_fix: 0, adj_additions: 10, adj_deletions: 0 },
        { sha: "c4", project_id: 1, authored_at: "2026-09-05T10:00:00+07:00", is_fix: 0, adj_additions: 10, adj_deletions: 0 },
      ],
      reaches: [
        { sha: "c1", stage: "master" },
        { sha: "c2", stage: "release" },
        { sha: "c3", stage: "develop" },
      ],
      events: [
        { created_at: "2026-09-01T09:00:00+07:00", action: "pushed new", project_id: 1, ref: "feat/a" },
        { created_at: "2026-09-02T09:00:00+07:00", action: "pushed new", project_id: 1, ref: "feat/b" },
        { created_at: "2026-08-20T09:00:00+07:00", action: "pushed new", project_id: 1, ref: "feat/old" },
        { created_at: "2026-09-03T09:00:00+07:00", action: "pushed to", project_id: 1, ref: "feat/a" },
      ],
      mrs: [
        { project_id: 1, role: "author", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-05T10:00:00+07:00", source_branch: "feat/a", target_branch: "develop" },
        { project_id: 1, role: "author", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-06T10:00:00+07:00", source_branch: "feat/b", target_branch: "develop" },
        { project_id: 1, role: "author", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-07T10:00:00+07:00", source_branch: "feat/a", target_branch: "release" },
        { project_id: 1, role: "author", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-08T10:00:00+07:00", source_branch: "release", target_branch: "master" },
        { project_id: 1, role: "author", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-09T10:00:00+07:00", source_branch: "feat/b", target_branch: "feature/x" },
        { project_id: 1, role: "author", created_at: "2026-09-10T10:00:00+07:00", merged_at: null, source_branch: "feat/c", target_branch: "develop" },
        { project_id: 1, role: "reviewer", created_at: "2026-09-01T10:00:00+07:00", merged_at: "2026-09-11T10:00:00+07:00", source_branch: "feat/a", target_branch: "master" },
      ],
    });

    expect(result.branches).toBe(2);
    const byKey = Object.fromEntries(result.stages.map((s) => [s.key, s]));
    expect(byKey.develop.created).toBe(3);
    expect(byKey.develop.merged).toBe(2);
    expect(byKey.develop.points).toBe(4);
    expect(byKey.release.points).toBe(3);
    expect(byKey.master.points).toBe(7.5);
    expect(byKey.master.carried).toBe(1);
    // 2 branch + 4 develop + 3 release + 5 master + 2.5 carried
    expect(result.totalPoints).toBe(16.5);
    expect(result.funnel.master).toBe(1);
    expect(result.funnel.release).toBe(1);
    expect(result.funnel.develop).toBe(1);
    expect(result.funnel.none).toBe(1);
    expect(result.funnel.masterPct).toBe(25);
    expect(result.hasOtherBranch).toBe(true);
    expect(byKey.other.merged).toBe(1);
    expect(byKey.other.points).toBe(0);
    expect(result.monthly[0].points).toBe(16.5);
  });

  it("scores volume and production reach", () => {
    expect(scoreReleaseFlow(0, 0)).toBe(0);
    expect(scoreReleaseFlow(200, 0.25)).toBe(100);
    expect(scoreReleaseFlow(100, 0.25)).toBe(70);
  });
});

describe("Rapor Talent: area dan bahasa", () => {
  it("classifies test, frontend, and backend files", () => {
    expect(classifyArea("src/app/page.tsx")).toBe("frontend");
    expect(classifyArea("src/lib/api.ts")).toBe("backend");
    expect(classifyArea("src/lib/api.spec.ts")).toBe("qa");
    expect(classifyArea("tests/api.test.ts")).toBe("qa");
    expect(languageOf("src/app/page.tsx")).toBe("TypeScript (React)");
    expect(languageOf("src/lib/api.ts")).toBe("TypeScript");
    expect(languageOf("main.go")).toBe("Go");
  });

  it("derives the primary role from added lines", () => {
    const result = computeAreas([
      { sha: "1", project_id: 1, path: "src/app/page.tsx", added: 100, deleted: 0 },
      { sha: "2", project_id: 1, path: "src/lib/api.ts", added: 50, deleted: 0 },
      { sha: "3", project_id: 1, path: "service/main.go", added: 30, deleted: 0 },
      { sha: "4", project_id: 1, path: "src/lib/api.spec.ts", added: 200, deleted: 0 },
      { sha: "5", project_id: 1, path: "src/app/page.spec.tsx", added: 20, deleted: 0 },
    ]);
    expect(result.areas.find((a) => a.key === "qa")?.lines).toBe(220);
    expect(result.areas.find((a) => a.key === "frontend")?.lines).toBe(100);
    expect(result.primaryRole).toBe("QA Engineer");
    expect(result.languages[0].language).toBe("TypeScript");
    expect(result.languages[0].lines).toBe(250);
    expect(result.languages.find((l) => l.language === "TypeScript (React)")?.lines).toBe(120);
  });
});

describe("Rapor Talent: isu berulang", () => {
  it("detects repeated fixes, fix-on-fix, and restored lines", () => {
    const commits = [
      { sha: "f1", project_id: 1, authored_at: "2026-09-01T10:00:00+07:00", is_fix: 1, adj_additions: 10, adj_deletions: 0 },
      { sha: "f2", project_id: 1, authored_at: "2026-09-05T10:00:00+07:00", is_fix: 1, adj_additions: 0, adj_deletions: 5 },
      { sha: "f3", project_id: 1, authored_at: "2026-09-10T10:00:00+07:00", is_fix: 1, adj_additions: 5, adj_deletions: 0 },
    ];
    const files = commits.map((c) => ({ sha: c.sha, project_id: 1, path: "src/a.ts", added: c.adj_additions, deleted: c.adj_deletions }));
    const lines = [
      { sha: "f1", path: "src/a.ts", added_hashes: "[]", deleted_hashes: '["h1"]' },
      { sha: "f2", path: "src/a.ts", added_hashes: '["h1"]', deleted_hashes: '["h2"]' },
      { sha: "f3", path: "src/a.ts", added_hashes: '["h2"]', deleted_hashes: "[]" },
    ];
    const result = computeRepeatedIssues({ commits, files, lines });
    expect(result.repeatedFiles).toHaveLength(1);
    expect(result.repeatedFiles[0].fixCount).toBe(3);
    expect(result.repeatedFiles[0].rangeDays).toBe(5);
    expect(result.repeatedFiles[0].medianGapDays).toBe(4.5);
    expect(result.fixOnFix.count).toBe(2);
    expect(result.fixOnFix.lines).toBe(10);
    expect(result.backAndForth.lines).toBe(2);
    expect(result.backAndForth.commits).toBe(2);
    expect(result.monthly["2026-09"]).toEqual({ fix: 3, repeat: 2 });
  });
});

describe("Rapor Talent: skor keseluruhan", () => {
  it("uses the five weighted components", () => {
    expect(computeOverallScore({ productivity: 100, quality: 100, collaboration: 100, consistency: 100, releaseFlow: 100 })).toBe(100);
    expect(computeOverallScore({ productivity: 80, quality: 60, collaboration: 40, consistency: 20, releaseFlow: 100 })).toBe(66);
  });

  it("builds month ranges in Asia/Jakarta", () => {
    expect(monthsBetween(new Date("2026-01-15T00:00:00Z"), new Date("2026-03-02T00:00:00Z"))).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(monthKey("2026-11-01T00:30:00+07:00")).toBe("2026-11");
  });
});
