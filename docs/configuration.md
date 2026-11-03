# Panduan Konfigurasi (`/settings`)

Buka menu **Pengaturan** di antarmuka web DevHub untuk mengonfigurasi mode tampilan, kredensial integrasi, dan layanan background:

---

## 1. Mode Tampilan Sistem (App Mode)

Di bagian atas halaman Pengaturan, Anda dapat memilih mode operasional sistem:

* **Mode Developer (Standar)**:
  * Mengaktifkan seluruh modul dan alur kerja harian untuk software engineer: Smart Task Studio, GitLab MR Assistant, Pre-review Code Security, Timesheet Gap Healer, Workload Monitor, dan Talent Tracer Report.
* **Mode Monitoring**:
  * Mengoptimalkan antarmuka untuk pemantauan metrik dan supervisi tim.
  * Menyembunyikan modul pengisian task manual/AI (*Timesheet Gap Healer* di halaman Workload) dan membatasi opsi model AI hanya pada fitur yang aktif di mode monitoring.

> **Penyimpanan Otomatis**: Memilih salah satu kartu mode akan langsung menyimpan preferensi ke database lokal SQLite dan mengupdate tampilan seketika tanpa perlu menekan tombol simpan manual.

---

## 2. Modul Konfigurasi Modular (Minimize & Maximize)

Setiap card modul integrasi (Taiga, GitLab, AI & LLM Engine, PM2) kini dilengkapi tombol **Minimize / Expand** di pojok kanan atas kartu serta dapat diklik pada judulnya. Status terlipat kartu disimpan di `localStorage` per peramban dan secara default berada dalam kondisi ter-minimize agar antarmuka tetap ringkas dan teratur.

---

## 3. Taiga SSO

Taiga menggunakan autentikasi SSO (Single Sign-On):

1. Buka dan login ke web Taiga di Google Chrome Anda.
2. Pastikan tab Taiga aktif dan tidak terhalang verifikasi Cloudflare ("Tunggu sebentar...").
3. **Pengguna Windows (Sangat Mudah)**:
   - Klik tombol **"📋 Salin Script DevTools (Windows)"** di DevHub.
   - Buka tab Taiga di Chrome, tekan **F12** (tab Console), tekan **Ctrl+V** dan **Enter**. Token sesi akan otomatis tersalin ke clipboard.
   - *(Atau gunakan tombol **"⭐ Salin Bookmarklet"** untuk disimpan di bookmark bar browser).*
4. **Pengguna macOS**:
   - Klik tombol **"✨ Tarik Sesi (macOS)"** untuk menarik sesi dari Chrome secara otomatis via AppleScript.
5. *(Alternatif Manual)* Anda juga dapat menyalin token atau JSON session langsung ke kolom **JSON Session / Token**, lalu klik **Simpan Pengaturan**.
6. Klik **"Uji Koneksi Taiga"** untuk memastikan koneksi berhasil.
7. *(Opsional)* **Project Slug & Default Sprint Slug**: Masukkan project slug Taiga Anda untuk memuat sprint dan backlog yang spesifik.

---

## 4. GitLab Personal Access Token

1. Masuk ke profil Anda di GitLab → *User Settings* → *Access Tokens*.
2. Buat *Personal Access Token* baru dengan scope minimal **`api`** atau **`read_api`**.
3. Masukkan token tersebut di menu Pengaturan DevHub.
4. Isi *GitLab Username*, *Author Email*, dan *Author Name* Anda untuk memfilter commit dan merge request pribadi.
5. Klik **"Uji Koneksi"**.

---

## 5. Google Gemini AI & AI Engine (100% Free Tier)

1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/apikey).
2. Masukkan ke menu Pengaturan DevHub (pilihan model: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, dsb.).
3. DevHub juga mendukung konfigurasi model AI spesifik per menu (Smart Task, GitLab MR, Code Review, Workload, Report) serta custom provider AI lain (OpenAI, Anthropic, Custom Base URL).
4. Klik **"Uji Koneksi"**.
   *(Catatan: Jika Gemini API Key belum diisi, DevHub tetap dapat berjalan menggunakan parser fallback cerdas lokal).*

---

## 6. Background Process Service (PM2)

DevHub menyertakan modul pengelola proses latar belakang PM2 agar server dapat melayani permintaan terus menerus tanpa memerlukan jendela terminal yang terbuka.

### Prasyarat Instalasi PM2
Karena PM2 bertindak sebagai process daemon tingkat sistem operasi, PM2 **harus diinstal secara global** di mesin Anda:

```bash
# Wajib: Install PM2 secara global
npm install -g pm2
```

### Konfigurasi Auto-Startup Saat Komputer Dinyalakan
Agar server DevHub otomatis aktif setiap kali komputer/laptop dinyalakan atau di-restart:

* **Windows**:
  ```bash
  # Pasang package helper startup Windows
  npm install -g pm2-windows-startup
  pm2-startup install
  pm2 save
  ```
* **macOS / Linux**:
  ```bash
  pm2 startup
  pm2 save
  ```

### Kontrol PM2 melalui Antarmuka DevHub
Pada modul **Background Process Service (PM2)** di halaman Pengaturan:
- **Status Live**: Menampilkan badge status (Layanan Aktif / Layanan Berhenti / Sedang Memeriksa), PID proses, penggunaan CPU, konsumsi RAM, serta waktu aktif (uptime).
- **Tombol Aktifkan / Hentikan**: Menjalankan daemon di port **4001** (`ecosystem.config.js`) secara instan.
- **Restart**: Melakukan reload zero-downtime saat ada pembaruan konfigurasi.
- **Log Terminal**: Membuka collapsible drawer log stdout & stderr proses server DevHub secara realtime.
