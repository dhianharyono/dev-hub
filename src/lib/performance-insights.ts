/**
 * Insight performa dari data riil Scorecard (Prioritas Aksi, isu statis,
 * profil bahasa, isu berulang, hotspot). Tanpa tebakan: setiap baris
 * merangkum angka yang sudah dihitung computeScorecard.
 */
import type { ReviewInsight } from "./commit-review";
import type { Scorecard } from "./scoring";

const shortPath = (path: string) => path.replace(/^src\//, "");
const fmt = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

/** Rakit insight performa dari Scorecard, maksimal satu baris per sumber. */
export function buildPerformanceInsights(card: Scorecard): ReviewInsight[] {
  const insights: ReviewInsight[] = [];

  // 1. Prioritas Aksi: aksi P1 teratas beserta potensi poinnya.
  const p1 = card.actions.find((action) => action.priority === "P1");
  if (p1) {
    const title = p1.title.length > 140 ? `${p1.title.slice(0, 137)}…` : p1.title;
    insights.push({
      tone: "warn",
      text: `Aksi berdampak terbesar (+${fmt(p1.points)} poin): ${title}`,
    });
  }

  // 2. Isu statis: yang kritis dengan temuan terbanyak.
  const criticalIssue = card.skill.issues
    .filter((issue) => issue.status === "critical")
    .sort((a, b) => b.count - a.count)[0];
  if (criticalIssue) {
    const example = card.skill.examples[criticalIssue.key];
    insights.push({
      tone: "warn",
      text: `Isu statis terbanyak: ${criticalIssue.label.toLowerCase()} — ${fmt(criticalIssue.count)} temuan (${fmt(criticalIssue.per100)}/100 baris)${example ? `, terbanyak di ${shortPath(example.path)}` : ""}.`,
    });
  }

  // 3. Profil bahasa: bahasa terlemah di antara yang Intensif/Aktif.
  const weakestLanguage = [...card.skill.languages]
    .sort((a, b) => a.score - b.score || b.lines - a.lines)
    .find((language) => language.intensity !== "Dasar");
  if (weakestLanguage) {
    insights.push({
      tone: "info",
      text: `Bahasa terlemah: ${weakestLanguage.language} (skor ${weakestLanguage.score}, ${fmt(weakestLanguage.lines)} baris) — perbaikan statis di sana paling mengangkat Skill Kode.`,
    });
  }

  // 4. Isu berulang: status kritis dulu, lalu perhatian.
  const recurring =
    card.recurringIssues.find((issue) => issue.status === "critical") ??
    card.recurringIssues.find((issue) => issue.status === "warn");
  if (recurring) {
    insights.push({
      tone: recurring.status === "critical" ? "warn" : "info",
      text: `Isu berulang: ${recurring.label.toLowerCase()} — ${recurring.ratioLabel}.`,
    });
  }

  // 5. Hotspot: file yang paling sering diubah.
  const hotspot = [...card.hotspots].sort(
    (a, b) => b.commits - a.commits || b.selfReworkLines - a.selfReworkLines,
  )[0];
  if (hotspot) {
    insights.push({
      tone: hotspot.selfReworkPct >= 20 ? "warn" : "info",
      text: `Hotspot utama: ${shortPath(hotspot.path)} — ${hotspot.commits} commit, ${fmt(hotspot.selfReworkLines)} baris self-rework (${fmt(hotspot.selfReworkPct)}%).`,
    });
  }

  return insights;
}
