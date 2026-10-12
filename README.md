# DevHub - Asisten Produktivitas Developer (Taiga & GitLab)

**DevHub** adalah aplikasi web lokal full-stack (_Next.js 16 + React 19 + TypeScript + SQLite_) yang dirancang khusus untuk mempercepat alur kerja harian developer: pencatatan task Taiga otomatis berbasis AI, pemenuhan lembar kerja (timesheet) WAD, asisten pembuatan GitLab Merge Request, pre-review audit keamanan kode, hingga pembuatan laporan performa mingguan.

---

## Fitur Utama

### 1. Smart Task Studio (`/tasks`)

- **Input Bebas ke Task Formal**: Ketik catatan kerja harian dengan gaya bahasa santai atau pesan commit ringkas. AI akan otomatis merapikan wording menjadi task formal profesional diawali kata kerja aktif.
- **Deteksi Otomatis Induk User Story & Project**: AI mencocokkan pekerjaan dengan daftar User Story aktif di sprint Taiga yang sedang berjalan.
- **Assigned Tasks Board & Update Status**: Pantau semua task Taiga yang di-assign ke Anda, lengkap dengan filter status dan update status langsung (_inline_) tanpa perlu membuka web Taiga.

### 2. Workload Monitor & Timesheet Gap Healer (`/workload`)

- **Monitoring Jam Kerja WAD**: Pantau pemenuhan target kerja 8.0 jam/hari (Senin – Jumat) secara real-time.
- **Deteksi Kesenjangan (Gap) Jam Kerja**: Menandai hari kerja yang tercatat kurang dari target secara otomatis.
- **Timesheet Gap Healer Berbasis Commit GitLab**:
  - Secara otomatis mendeteksi commit GitLab Anda pada tanggal terkait dari database lokal.
  - AI merumuskan draf task pengisi kekurangan jam (subjek kata kerja aktif, jam mulai realistis antara 08:00–17:00, durasi, dan deskripsi aktivitas terperinci).
- **Push Langsung ke Taiga & WAD**: Otomatis mengirim task ke Taiga dengan status **In Progress**, langsung di-assign ke user yang aktif, dan mengisi _Custom Attributes_ WAD (_Activity Date_, _Start Time_, dan _Total Time Spent in Minutes_).
- **Tabel Rekapitulasi**: Dilengkapi pagination dan filter bulan.

### 3. GitLab Productivity & MR Assistant (`/gitlab`)

- **AI Merge Request Assistant**:
  - Otomatis menyusun deskripsi MR standar enterprise (konteks masalah, detail perubahan teknis, referensi tiket Taiga).
  - Judul MR berformat Conventional Commits yang terhubung dengan tiket project (contoh: `[PROJ-1234] feat(auth): implement sso login`).
  - Pembuatan ringkasan _Release Notes_ untuk tim QA.
  - Tombol buat MR langsung ke GitLab via API.
- **Pre-Review Code & Security Health Check**:
  - Audit kode sebelum membuka MR: deteksi kebocoran kredensial/API key, celah XSS (`dangerouslySetInnerHTML`), `eval()`, sisa `console.log`, blok catch kosong, dan tipe `any`.
  - Skor kesehatan kode (0–100), checklist kepatuhan (Security, Performance, Maintainability, Functionality), dan rekomendasi cuplikan kode perbaikan.
- **Incoming Reviews & AI Code Reviewer**:
  - Daftar MR tim yang memerlukan review Anda.
  - Generator komentar review cerdas per blok diff lengkap dengan saran perubahan kode (_suggested change_).
- **Productivity Dashboard**: Radar 4 pilar metrik performa (Produktivitas, Kualitas, Kolaborasi, dan Konsistensi), grafik komparasi commit vs MR, dan analitik jam kerja vs lembur.

### 4. Dashboard Performa Utama (`/`)

- **Ringkasan Telemetri Real-Time**: Status koneksi Taiga, GitLab, dan pemenuhan jam kerja WAD.
- **Distribusi Aktivitas**: Visualisasi kalender kontribusi harian (heatmap) dan distribusi jam kerja 24 jam.
- **Quick Jump & Navigasi**: Akses cepat ke backlog aktif dan task yang perlu ditindaklanjuti.

### 5. Laporan Performa & Talent Tracer Export (`/report`)

- **Ringkasan Mingguan AI**: Rangkuman otomatis pencapaian dan progres teknis untuk bahan _daily standup_ atau laporan mingguan ke lead/atasan.
- **Format Siap Cetak (A4)**: Tata letak laporan disesuaikan dengan format standar _Talent Tracer_, siap dicetak atau disimpan ke PDF via browser (`@media print`).

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Library UI**: React 19, [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Visualisasi & Grafik**: [ApexCharts](https://apexcharts.com/) (`react-apexcharts`)
- **Database Lokal**: SQLite via modul bawaan Node.js (`node:sqlite` / `DatabaseSync`, tanpa dependensi eksternal C++)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK
- **Validasi Data**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Panduan Instalasi & Menjalankan

### Prasyarat

- Node.js versi 22.5.0+ (diperlukan untuk modul native `node:sqlite`)
- Akun Taiga & Akun GitLab

### Langkah Menjalankan

1. Clone repositori ini:
   ```bash
   git clone <URL_REPO_GITHUB>
   cd devhub
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka browser di: **[http://localhost:4000](http://localhost:4000)**

---

## Menjalankan dengan PM2 (Background Daemon)

Aplikasi telah dilengkapi dengan konfigurasi [`ecosystem.config.js`](./ecosystem.config.js) agar dapat berjalan terus-menerus di latar belakang (_background service_):

### 1. Mode Production (Rekomendasi)

```bash
# 1. Build bundle Next.js
npm run build

# 2. Jalankan dengan PM2 di port 4000
npm run pm2:start
# atau: pm2 start ecosystem.config.js
```

### 2. Mode Development di Background

```bash
pm2 start ecosystem.config.js --env development
```

### 3. Perintah Monitoring & Kontrol PM2

```bash
# Cek status proses
pm2 status

# Monitoring log realtime
npm run pm2:logs
# atau: pm2 logs devhub

# Restart aplikasi
npm run pm2:restart
# atau: pm2 restart devhub

# Hentikan aplikasi
npm run pm2:stop

# Hapus dari daftar PM2
pm2 delete devhub
```

---

## Panduan Konfigurasi (`/settings`)

Buka menu **Pengaturan** di aplikasi untuk menghubungkan integrasi:

### 1. Taiga SSO

Taiga menggunakan autentikasi SSO (Single Sign-On):

1. Login ke web Taiga di browser Anda.
2. Buka DevTools (`F12` atau klik kanan → _Inspect_), masuk ke tab **Console**.
3. Di menu Pengaturan DevHub, klik tombol **"📋 Salin Script DevTools Console"** (atau jalankan script berikut di Console browser):
   ```javascript
   copy(
     JSON.stringify({
       token: localStorage.token,
       refresh: localStorage.refresh,
     }),
   );
   ```
4. Paste hasil salinan ke input **Taiga SSO Session / Bearer Token** di DevHub, lalu klik **Simpan Pengaturan**.
5. Klik **"Uji Koneksi"** untuk memastikan token valid.
6. _(Opsional)_ **Project Slug & Default Sprint Slug**: Biarkan kosong untuk deteksi otomatis project & sprint pertama Anda di Taiga.

### 2. GitLab Personal Access Token

1. Masuk ke profil Anda di GitLab → _User Settings_ → _Access Tokens_.
2. Buat _Personal Access Token_ baru dengan scope minimal **`api`** atau **`read_api`**.
3. Masukkan token tersebut di menu Pengaturan DevHub.
4. Isi _GitLab Username_, _Author Email_, dan _Author Name_ Anda untuk memfilter commit dan merge request pribadi.
5. Klik **"Uji Koneksi"**.

### 3. Google Gemini AI (100% Free Tier)

1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/apikey).
2. Masukkan ke menu Pengaturan DevHub (pilihan model: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, dsb.).
3. Klik **"Uji Koneksi"**.
   _(Catatan: Jika Gemini API Key belum diisi, DevHub tetap dapat berjalan menggunakan parser fallback cerdas lokal)._

---

## Privasi & Keamanan Data

- **Database Lokal**: Semua kredensial dan cache data disimpan secara lokal di mesin Anda (`data/devhub.db`) menggunakan SQLite. File database diabaikan oleh `.gitignore` dan **tidak akan terunggah ke repositori Git**.
- **Komunikasi Langsung**: DevHub berkomunikasi secara langsung dari mesin lokal Anda ke server Taiga dan GitLab resmi tanpa server perantara pihak ketiga.
- **Zero Token Leak**: Token SSO dan Personal Access Token disensor saat ditampilkan di antarmuka pengguna.

---

## Pengujian & Verifikasi Kualitas

```bash
# Pemeriksaan Linter ESLint
npm run lint

# Pemeriksaan Tipe TypeScript
npx tsc --noEmit

# Eksekusi Unit Test (Vitest)
npm test

# Build Produksi Turbopack
npm run build
```

---

## Struktur Direktori

```text
devhub/
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API Routes (Taiga, GitLab, AI, Workload)
│   │   ├── dashboard/       # Komponen modular dashboard utama
│   │   ├── gitlab/          # Fitur GitLab (Productivity, MR Assistant, Pre-Review, Reviews)
│   │   ├── report/          # Halaman laporan mingguan & export PDF Talent Tracer
│   │   ├── settings/        # Halaman konfigurasi token & kredensial
│   │   ├── tasks/           # Smart Task Studio & Assigned Tasks Board
│   │   ├── workload/        # Workload Monitor & Timesheet Gap Healer
│   │   ├── layout.tsx       # Root layout & favicon metadata
│   │   └── page.tsx         # Dashboard utama (KPI & Activity)
│   ├── components/          # Komponen UI bersama (Select, Markdown, Charts, Sidebar)
│   └── lib/                 # Core logic: ai, db, gitlab, taiga, workload, settings
├── data/                    # Database SQLite lokal (gitignored)
├── public/                  # Static assets & favicon SVG
├── tests/                   # Suite pengujian unit (Vitest)
└── ecosystem.config.js      # Konfigurasi background daemon PM2
```
