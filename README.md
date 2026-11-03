# DevHub - Asisten Produktivitas

**DevHub** adalah aplikasi web lokal full-stack (_Next.js 16 + React 19 + TypeScript + SQLite_) yang dirancang khusus untuk mempercepat alur kerja harian: pencatatan task Taiga otomatis berbasis AI, pemenuhan lembar kerja (timesheet) WAD, asisten pembuatan GitLab Merge Request, pre-review audit keamanan kode, hingga pembuatan laporan performa mingguan.

---

## Panduan Instalasi & Menjalankan

### Prasyarat

- **Node.js**: Versi 22.5.0+ (diperlukan untuk modul native `node:sqlite`)
- **PM2 (Opsional / Direkomendasikan)**: Untuk menjalankan DevHub sebagai background daemon tanpa terminal aktif:
  ```bash
  npm install -g pm2
  ```
  *(Khusus Windows, pasang juga `npm install -g pm2-windows-startup` agar fitur auto-startup saat komputer menyala berfungsi optimal).*
- **Akun Layanan**: Akun Taiga & Akun GitLab (Personal Access Token)
- **AI Engine (Opsional / 100% Free Tier)**: Google Gemini API Key dari [Google AI Studio](https://aistudio.google.com/apikey)

### Langkah Menjalankan

1. Clone repositori ini:
   ```bash
   git clone <URL_REPO_GITHUB>
   cd devhub
   ```
2. Pasang dependensi project:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal (Port 4000):
   ```bash
   npm run dev
   ```
4. Buka browser di: **[http://localhost:4000](http://localhost:4000)**

## Menjalankan dengan PM2 (Background Daemon)

Aplikasi telah dilengkapi dengan konfigurasi [`ecosystem.config.js`](./ecosystem.config.js) dan modul kontrol visual di halaman **Pengaturan (`/settings`)** agar dapat berjalan terus-menerus di layar belakang (*background service*) tanpa perlu membuka jendela terminal.

> **Penting**: PM2 adalah process manager tingkat sistem operasi, sehingga pastikan Anda telah memasang PM2 secara global terlebih dahulu dengan perintah:
> ```bash
> npm install -g pm2
> ```

### 1. Mengaktifkan via Web UI (Paling Praktis)
1. Buka menu **Pengaturan** di DevHub.
2. Buka modul **Background Process Service (PM2)**.
3. Klik tombol **"Aktifkan PM2 di Layar Belakang"**.
4. Aplikasi akan otomatis berjalan di port **4001** (`http://localhost:4001`) dan status live proses (PID, CPU, RAM, Uptime) dapat dipantau langsung.

### 2. Mengaktifkan via Terminal / CLI

#### Mode Production (Rekomendasi - Port 4001)
```bash
# 1. Build bundle Next.js
npm run build

# 2. Jalankan background daemon
npm run pm2:start
# atau: pm2 start ecosystem.config.js
```

#### Mode Development di Background
```bash
pm2 start ecosystem.config.js --env development
```

### 3. Perintah Monitoring & Kontrol PM2

```bash
# Cek status proses yang berjalan
pm2 status

# Monitoring log realtime
npm run pm2:logs
# atau: pm2 logs devhub

# Restart aplikasi
npm run pm2:restart
# atau: pm2 restart devhub

# Hentikan aplikasi
npm run pm2:stop

# Hapus aplikasi dari daftar PM2
pm2 delete devhub
```

## Dokumentasi Lengkap

Dokumentasi teknis modular tersedia di dalam folder [`docs/`](./docs/):

- **[Fitur Utama](docs/features.md)**: Rincian modul Smart Task Studio, Workload Monitor, GitLab Assistant, Dashboard, dan Pengaturan.
- **[Panduan Konfigurasi](docs/configuration.md)**: Setup Taiga SSO, GitLab PAT, Gemini AI, Mode Tampilan, dan Service PM2.
- **[Arsitektur & Struktur Proyek](docs/architecture.md)**: Spesifikasi Tech Stack, skema database SQLite, dan pemetaan direktori kode.
- **[Privasi & Keamanan Data](docs/security.md)**: Prinsip penyimpanan SQLite lokal (*zero token leak* dan isolasi data).
- **[Pengujian & Verifikasi Kualitas](docs/testing.md)**: Eksekusi unit test Vitest, validasi TypeScript, dan linter ESLint.
