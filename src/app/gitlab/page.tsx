import type { Metadata } from "next";
import GitlabDashboard from "./GitlabDashboard";

export const metadata: Metadata = {
  title: "GitLab Monitor",
  description: "Dashboard produktivitas GitLab: skor, tren mingguan, heatmap, dan insight perbaikan.",
};

export default function Page() {
  return <GitlabDashboard />;
}
