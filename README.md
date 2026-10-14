# DevHub - Asisten Produktivitas Developer (Taiga & GitLab)

**DevHub** adalah aplikasi web lokal full-stack (_Next.js 16 + React 19 + TypeScript + SQLite_) yang dirancang khusus untuk mempercepat alur kerja harian developer: pencatatan task Taiga otomatis berbasis AI, pemenuhan lembar kerja (timesheet) WAD, asisten pembuatan GitLab Merge Request, pre-review audit keamanan kode, hingga pembuatan laporan performa mingguan.

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

## Dokumentasi Lengkap

Dokumentasi teknis modular tersedia di dalam folder [`docs/`](./docs/):

- **[Fitur Utama](docs/features.md)**: Smart Task Studio, Workload Monitor, GitLab Assistant, Dashboard, dan Laporan Performa.
- **[Panduan Konfigurasi](docs/configuration.md)**: Langkah setup token Taiga SSO, GitLab Personal Access Token, dan Google Gemini AI.
- **[Arsitektur & Struktur Proyek](docs/architecture.md)**: Spesifikasi Tech Stack dan pemetaan direktori kode.
- **[Privasi & Keamanan Data](docs/security.md)**: Prinsip penyimpanan SQLite lokal (_zero token leak_ dan isolasi data).
- **[Pengujian & Verifikasi Kualitas](docs/testing.md)**: Eksekusi unit test Vitest, validasi TypeScript, dan linter.
