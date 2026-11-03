# Panduan Konfigurasi (`/settings`)

Buka menu **Pengaturan** di antarmuka web DevHub untuk menghubungkan integrasi layanan:

---

## 1. Taiga SSO

Taiga menggunakan autentikasi SSO (Single Sign-On):

1. Buka dan login ke web Taiga di Google Chrome Anda.
2. Pastikan tab Taiga aktif dan tidak terhalang verifikasi Cloudflare ("Tunggu sebentar...").
3. **Pengguna Windows (Sangat Mudah)**:
   - Klik tombol **"📋 Salin Script DevTools (Windows)"** di DevHub.
   - Buka tab Taiga di Chrome, tekan **F12** (tab Console), tekan **Ctrl+V** dan **Enter**.
   - *(Atau gunakan tombol **"⭐ Salin Bookmarklet"** untuk disimpan di bookmark bar browser).*
4. **Pengguna macOS**:
   - Klik tombol **"✨ Tarik Sesi (macOS)"** untuk menarik sesi dari Chrome secara otomatis via AppleScript.
5. *(Alternatif Manual)* Anda juga dapat menyalin token atau JSON session langsung ke kolom **JSON Session / Token**, lalu klik **Simpan Pengaturan**.
6. Klik **"Uji Koneksi Taiga"** untuk memastikan koneksi berhasil.
7. *(Opsional)* **Project Slug & Default Sprint Slug**: Masukkan project slug Taiga Anda untuk memuat sprint dan backlog yang spesifik.

---

## 2. GitLab Personal Access Token

1. Masuk ke profil Anda di GitLab → *User Settings* → *Access Tokens*.
2. Buat *Personal Access Token* baru dengan scope minimal **`api`** atau **`read_api`**.
3. Masukkan token tersebut di menu Pengaturan DevHub.
4. Isi *GitLab Username*, *Author Email*, dan *Author Name* Anda untuk memfilter commit dan merge request pribadi.
5. Klik **"Uji Koneksi"**.

---

## 3. Google Gemini AI & AI Engine (100% Free Tier)

1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/apikey).
2. Masukkan ke menu Pengaturan DevHub (pilihan model: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, dsb.).
3. DevHub juga mendukung konfigurasi custom provider AI lain (OpenAI, Anthropic, Custom Base URL).
4. Klik **"Uji Koneksi"**.
   *(Catatan: Jika Gemini API Key belum diisi, DevHub tetap dapat berjalan menggunakan parser fallback cerdas lokal).*
