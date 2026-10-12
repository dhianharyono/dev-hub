import { describe, it, expect } from "vitest";
import { computeMetrics, gradeOf, weekStart, workdaysBetween } from "../src/lib/metrics";
import { fallbackParse } from "../src/lib/ai";

describe("Metrics Engine", () => {
  it("determines grade correctly", () => {
    expect(gradeOf(90).grade).toBe("A");
    expect(gradeOf(75).grade).toBe("B");
    expect(gradeOf(60).grade).toBe("C");
    expect(gradeOf(45).grade).toBe("D");
    expect(gradeOf(30).grade).toBe("E");
  });

  it("calculates workdays accurately", () => {
    // 2026-10-05 (Mon) to 2026-10-09 (Fri) = 5 days
    const mon = new Date("2026-10-05T00:00:00Z");
    const fri = new Date("2026-10-09T00:00:00Z");
    expect(workdaysBetween(mon, fri)).toBe(5);

    // including weekend: Mon to Sun = 5 workdays
    const sun = new Date("2026-10-11T00:00:00Z");
    expect(workdaysBetween(mon, sun)).toBe(5);
  });

  it("finds Monday week start", () => {
    expect(weekStart("2026-10-03")).toBe("2026-09-28"); // Sat -> Mon
    expect(weekStart("2026-10-05")).toBe("2026-10-05"); // Mon -> Mon
  });

  it("computes scores and ignores merge commits", () => {
    const start = new Date("2026-09-01T00:00:00Z");
    const end = new Date("2026-09-30T00:00:00Z");

    const result = computeMetrics({
      start,
      end,
      commits: [
        {
          authored_at: "2026-09-02T10:00:00Z",
          adj_additions: 100,
          adj_deletions: 20,
          additions: 100,
          deletions: 20,
          is_merge: 0,
          is_fix: 0,
          project_id: 1,
        },
        {
          authored_at: "2026-09-03T11:00:00Z",
          adj_additions: 0,
          adj_deletions: 0,
          additions: 500,
          deletions: 200,
          is_merge: 1, // merge commit! Should be ignored
          is_fix: 0,
          project_id: 1,
        },
      ],
      mrs: [
        {
          role: "author",
          created_at: "2026-09-02T12:00:00Z",
          merged_at: "2026-09-03T09:00:00Z",
          state: "merged",
          project_id: 1,
        },
      ],
      events: [],
      pipelines: [
        {
          status: "success",
          created_at: "2026-09-02T10:30:00Z",
        },
      ],
      projectNames: { 1: "satu-data-digital/airflow" },
    });

    expect(result.kpis.commits).toBe(1);
    expect(result.kpis.mergeCommits).toBe(1);
    expect(result.kpis.linesAdded).toBe(100);
    expect(result.kpis.mrsMerged).toBe(1);
    expect(result.topProjects[0].name).toBe("satu-data-digital/airflow");
    expect(result.scores.overall).toBeGreaterThan(0);
  });
});

describe("AI Fallback Parser", () => {
  it("parses lines and extracts hour estimates", () => {
    const input = `fix bug dag airflow 2 jam\nreview MR mycarrier 1.5h\nmeeting standup`;
    const drafts = fallbackParse(input, { mode: "auto", defaultParentId: null });

    expect(drafts.length).toBe(3);
    expect(drafts[0].subject).toContain("Fix bug dag airflow");
    expect(drafts[0].estimateHours).toBe(2);
    expect(drafts[1].estimateHours).toBe(1.5);
  });
});
