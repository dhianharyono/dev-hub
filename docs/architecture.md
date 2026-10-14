# Arsitektur & Struktur Proyek

Dokumen ini menjelaskan arsitektur teknologi serta struktur direktori di dalam basis kode DevHub.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library UI**: React 19, [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Visualisasi & Grafik**: [ApexCharts](https://apexcharts.com/) (`react-apexcharts`)
- **Database Lokal**: SQLite via modul native bawaan Node.js (`node:sqlite` / `DatabaseSync`, tanpa dependensi eksternal C++)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK
- **Validasi Data**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Struktur Direktori

```text
devhub/
├── docs/                    # Dokumentasi teknis modular
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API Routes (Taiga, GitLab, AI, Workload, Report)
│   │   ├── dashboard/       # Komponen modular dashboard utama
│   │   ├── gitlab/          # Fitur GitLab (Productivity, MR Assistant, Pre-Review, Reviews)
│   │   ├── report/          # Halaman laporan mingguan & export PDF Talent Tracer
│   │   ├── settings/        # Halaman konfigurasi token & kredensial
│   │   ├── tasks/           # Smart Task Studio & Assigned Tasks Board
│   │   ├── workload/        # Workload Monitor & Timesheet Gap Healer
│   │   ├── layout.tsx       # Root layout & favicon metadata
│   │   └── page.tsx         # Dashboard utama (KPI & Activity)
│   ├── components/          # Komponen UI bersama (Select, Markdown, Charts, Sidebar, Dock)
│   └── lib/                 # Core logic: ai, db, gitlab, taiga, workload, settings, sync
├── data/                    # Database SQLite lokal (devhub.db, gitignored)
├── public/                  # Static assets & icon SVG
├── tests/                   # Suite pengujian unit (Vitest)
├── ecosystem.config.js      # Konfigurasi background daemon PM2
├── package.json             # Manifest dependensi & script project
└── tsconfig.json            # Konfigurasi compiler TypeScript
```
