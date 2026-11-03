# Fitur Utama DevHub

DevHub dilengkapi dengan serangkaian modul dan asisten otomatis untuk mempercepat operasional harian perekayasa perangkat lunak:

---

## 1. Smart Task Studio (`/tasks`)

- **Input Bebas ke Task Formal**: Ketik catatan kerja harian dengan gaya bahasa santai atau pesan commit ringkas. AI akan otomatis merapikan wording menjadi task formal profesional diawali kata kerja aktif.
- **Deteksi Otomatis Induk User Story & Project**: AI mencocokkan pekerjaan dengan daftar User Story aktif di sprint Taiga yang sedang berjalan.
- **Dukungan Mode Input**: Tersedia tab input **Naratif** untuk sintesis AI dari deskripsi bebas dan tab **Multi Task** untuk pembuatan beberapa task sekaligus.
- **Daftar Tiket Taiga (Assigned Tasks Board)**:
  - **Tab Task Aktif**: Menampilkan semua task Taiga yang ditugaskan ke Anda dan berstatus aktif/dalam progres.
  - **Tab Semua Task (Pagination 10 Task per Project)**: Memuat seluruh riwayat task Anda yang dikelompokkan rapi per project. Untuk menjaga performa dan keterbacaan, setiap project dibatasi menampilkan **10 task per halaman** dilengkapi kontrol pagination (Prev/Next, nomor halaman, dan indikator jumlah baris).
  - **Inline Status & Quick Edit**: Perbarui status task, subject, jam kerja, atau tanggal aktivitas secara langsung tanpa perlu membuka web portal Taiga.
- **Skeleton Loading Berpresisi Tinggi**: Antarmuka transisi loading yang dirancang 1:1 dengan form input dan card draft, menghilangkan kedipan atau lonjakan tata letak (*Cumulative Layout Shift*).

---

## 2. Workload Monitor & Timesheet Gap Healer (`/workload`)

- **Monitoring Jam Kerja WAD**: Pantau pemenuhan target kerja 8.0 jam/hari (Senin - Jumat) secara real-time.
- **Deteksi Kesenjangan (Gap) Jam Kerja**: Menandai hari kerja yang tercatat kurang dari target secara otomatis dengan visualisasi grid kalender interaktif.
- **Timesheet Gap Healer Berbasis Commit GitLab (Khusus Mode Developer)**:
  - Secara otomatis mendeteksi commit GitLab Anda pada tanggal terkait dari database lokal (terfilter khusus commit akun Anda).
  - AI merumuskan draf task pengisi kekurangan jam (subjek kata kerja aktif, jam mulai realistis antara 08:00 - 17:00, durasi, dan deskripsi aktivitas terperinci).
  - **Push Langsung ke Taiga & WAD**: Otomatis mengirim task ke Taiga dengan status **In Progress**, langsung di-assign ke user yang aktif, dan mengisi *Custom Attributes* WAD (*Activity Date*, *Start Time*, dan *Total Time Spent in Minutes*).
- **Perilaku pada Mode Monitoring**: Pada mode monitoring, tombol Timesheet Gap Healer otomatis disembunyikan agar antarmuka fokus murni pada evaluasi dan kepatuhan waktu kerja tim.
- **Tabel Rekapitulasi**: Dilengkapi pagination, filter bulan, pencarian aktivitas, serta penghapusan item draf/rekap.

---

## 3. GitLab Productivity & MR Assistant (`/gitlab`)

- **AI Merge Request Assistant**:
  - Otomatis menyusun deskripsi MR standar enterprise (konteks masalah, detail perubahan teknis, referensi tiket Taiga).
  - Judul MR berformat Conventional Commits yang terhubung dengan tiket project (contoh: `[PROJ-1234] feat(auth): implement sso login`).
  - Pembuatan ringkasan *Release Notes* untuk tim QA.
  - Tombol buat MR langsung ke GitLab via API.
- **Pre-Review Code & Security Health Check**:
  - Audit kode sebelum membuka MR: deteksi kebocoran kredensial/API key, celah XSS (`dangerouslySetInnerHTML`), `eval()`, sisa `console.log`, blok catch kosong, dan tipe `any`.
  - Skor kesehatan kode (0 - 100), checklist kepatuhan (Security, Performance, Maintainability, Functionality), dan rekomendasi cuplikan kode perbaikan.
  - **Prompt Generator**: Salin hasil review audit untuk ditempelkan ke AI coding assistant pilihan Anda (Cursor, Copilot, Antigravity, Claude, ChatGPT, dll.) untuk perbaikan otomatis.
- **Incoming Reviews & AI Code Reviewer**:
  - Daftar MR tim yang memerlukan review Anda.
  - Generator komentar review cerdas per blok diff lengkap dengan saran perubahan kode (*suggested change*).
- **Productivity Dashboard**: Radar 4 pilar metrik performa (Produktivitas, Kualitas, Kolaborasi, dan Konsistensi), grafik komparasi commit vs MR, rekomendasi teknis performa, serta evaluasi kebugaran *Work-Life Balance* (jam kerja normal, larut malam, akhir pekan).

---

## 4. Dashboard Performa Utama (`/`)

- **Ringkasan Telemetri Real-Time**: Status koneksi Taiga, GitLab, dan pemenuhan jam kerja WAD.
- **Distribusi Aktivitas**: Visualisasi kalender kontribusi harian (heatmap) dan distribusi jam kerja 24 jam.
- **Quick Jump & Navigasi**: Akses cepat ke backlog aktif dan task yang perlu ditindaklanjuti.

---

## 5. Laporan Performa & Talent Tracer Export (`/report`)

- **Ringkasan Performa AI**: Rangkuman otomatis pencapaian dan progres teknis untuk bahan *daily standup* atau laporan mingguan ke lead/atasan.
- **Contoh Rework & Analisis Hotspot**: Pelacakan riwayat pengerjaan ulang kode dengan tautan commit/diff GitLab lengkap dan indikator jeda waktu perbaikan.
- **Format Siap Cetak (A4)**: Tata letak laporan disesuaikan dengan format standar *Talent Tracer*, siap dicetak atau disimpan ke PDF via browser (`@media print`).

---

## 6. Pengaturan Sistem & Layanan Background PM2 (`/settings`)

- **Mode Tampilan Sistem (Developer Mode vs Monitoring Mode)**: Pilihan mode global dengan penyimpanan otomatis instan yang menyelaraskan fitur menu dan navigasi sidebar.
- **Manajemen Kartu Modular (Minimize / Expand)**: Seluruh kartu modul konfigurasi (Taiga, GitLab, AI Engine, PM2) dapat di-minimize secara independen dengan status bawaan terlipat untuk kenyamanan visual.
- **Background Process Manager (PM2)**:
  - Tombol 1-klik untuk mengaktifkan PM2 agar aplikasi DEV HUB berjalan secara otomatis di layar belakang (*background daemon*) pada port 4001.
  - Menghilangkan ketergantungan pada jendela terminal terbuka agar server terus melayani request secara reliabel.
  - Telemetri live status: PID, CPU, Memory usage, Uptime, dan jumlah restart.
  - Opsi kontrol siklus hidup: Aktifkan, Restart, Hentikan, dan inspeksi log terminal terakhir.
