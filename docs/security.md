# Privasi & Keamanan Data

DevHub dirancang dengan prinsip *privacy-first* dan isolasi data lokal:

---

## 1. Penyimpanan Lokal (SQLite)

- Semua kredensial, token akses, riwayat sinkronisasi, dan cache data tersimpan secara lokal di mesin Anda (`data/devhub.db`) menggunakan modul bawaan `node:sqlite`.
- File database telah didaftarkan dalam `.gitignore` sehingga **tidak akan pernah terunggah atau terekspos ke repositori Git**.

---

## 2. Komunikasi Langsung Tanpa Perantara

- DevHub berkomunikasi secara langsung (*direct client-to-server* atau *local server actions*) ke endpoint resmi API Taiga dan GitLab.
- Tidak ada server proxy perantara pihak ketiga yang mengumpulkan atau membaca data telemetri Anda.

---

## 3. Pencegahan Kebocoran Kredensial (Zero Token Leak)

- Token sesi SSO Taiga dan Personal Access Token GitLab disensor (masked) pada antarmuka pengguna setelah disimpan.
- Seluruh input path dan parameter sensitif divalidasi secara ketat menggunakan Zod schema sebelum dieksekusi.
