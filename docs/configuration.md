# Panduan Konfigurasi (`/settings`)

Buka menu **Pengaturan** di antarmuka web DevHub untuk menghubungkan integrasi layanan:

---

## 1. Taiga SSO

Taiga menggunakan autentikasi SSO (Single Sign-On):

1. Login ke web Taiga di browser Anda.
2. Buka DevTools (`F12` atau klik kanan → *Inspect*), masuk ke tab **Console**.
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
6. *(Opsional)* **Project Slug & Default Sprint Slug**: Biarkan kosong untuk deteksi otomatis project & sprint pertama Anda di Taiga.

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
