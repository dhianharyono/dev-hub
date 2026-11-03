# Arsitektur & Struktur Proyek

Dokumen ini menjelaskan arsitektur teknologi serta struktur direktori di dalam basis kode DevHub.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Webpack/Turbopack, Server Actions, API Routes)
- **Library UI**: React 19, [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) dengan arsitektur utility-first, CSS variables theming, dan micro-interactions
- **Visualisasi & Grafik**: [ApexCharts](https://apexcharts.com/) (`react-apexcharts`)
- **Database Lokal**: SQLite via modul native bawaan Node.js (`node:sqlite` / `DatabaseSync`, tanpa dependensi eksternal C++)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK dengan smart fallback parser lokal
- **Process Daemon**: [PM2](https://pm2.keymetrics.io/) via `ecosystem.config.js` (port 4001 untuk background service)
- **Validasi Data**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Port & Pola Eksekusi

DevHub mendukung dua pola eksekusi:
1. **Interactive Development Server**: Berjalan di port **4000** via perintah `npm run dev` (cocok untuk debugging aktif).
2. **Background Process Daemon (PM2)**: Berjalan di port **4001** via `ecosystem.config.js` atau tombol kontrol di halaman `/settings`. Pola ini membebaskan pengembang dari terminal yang harus selalu terbuka.

---

## Struktur Direktori

```text
devhub/
├── docs/                                  # Dokumentasi teknis modular
│   ├── architecture.md                    # Arsitektur & tech stack
│   ├── configuration.md                   # Panduan integrasi & setup PM2
│   ├── features.md                        # Deskripsi detail seluruh fitur
│   ├── security.md                        # Kebijakan isolasi data & privasi
│   └── testing.md                         # Panduan unit test & lint
├── src/
│   ├── app/
│   │   ├── api/                           # Next.js API Routes
│   │   │   ├── ai/                        # Endpoint inferensi Gemini & model selection
│   │   │   ├── gitlab/                    # Proxy & cache GitLab API
│   │   │   ├── settings/                  # Endpoint CRUD settings & PM2 daemon control
│   │   │   ├── taiga/                     # Proxy Taiga SSO, assigned tasks & mutations
│   │   │   └── workload/                  # Perhitungan WAD & gap healer
│   │   ├── dashboard/                     # Komponen modular dashboard utama
│   │   ├── gitlab/                        # Fitur GitLab (Productivity, MR Assistant, Code Audit)
│   │   ├── report/                        # Laporan mingguan & export Talent Tracer
│   │   ├── settings/                      # Halaman konfigurasi & modul service
│   │   │   ├── components/                # Mode section, PM2 section, AI model panel, dsb.
│   │   │   └── SettingsView.tsx           # Tampilan utama pengaturan
│   │   ├── tasks/                         # Smart Task Studio
│   │   │   ├── board/                     # Assigned Tasks Board, per-project pagination & row
│   │   │   ├── smart-task/                # Input area, draft cards, skeleton loading
│   │   │   └── SmartTask.tsx              # Controller utama studio task
│   │   ├── workload/                      # Workload Monitor & Timesheet Gap Healer
│   │   ├── layout.tsx                     # Root layout & providers
│   │   └── page.tsx                       # Dashboard utama
│   ├── components/                        # Komponen UI bersama (Dock, Sidebar, Select, Markdown)
│   └── lib/                               # Core logic: ai, db, gitlab, taiga, workload, sync
├── data/                                  # Database SQLite lokal (devhub.db, gitignored)
├── public/                                # Static assets & icon SVG
├── tests/                                 # Suite pengujian unit (Vitest)
├── ecosystem.config.js                    # Konfigurasi background daemon PM2 (Port 4001)
├── package.json                           # Manifest dependensi & script project
└── tsconfig.json                          # Konfigurasi compiler TypeScript
```
