# Pengujian & Verifikasi Kualitas

Panduan menjalankan pengujian otomatis, validasi tipe TypeScript, dan linting kode pada DevHub:

---

## 1. Menjalankan Unit Test (Vitest)

DevHub menggunakan Vitest untuk pengujian unit cepat:

```bash
# Menjalankan seluruh test suite
npm test

# Menjalankan test dalam mode watch
npx vitest
```

---

## 2. Pemeriksaan Tipe TypeScript

Untuk memverifikasi keabsahan tipe di seluruh project tanpa emit file:

```bash
npx tsc --noEmit
```

---

## 3. Pemeriksaan Linter ESLint

Untuk memeriksa standar penulisan kode dan aturan Next.js:

```bash
npm run lint
```

---

## 4. Validasi Build Produksi

Untuk memverifikasi bundle Next.js sebelum deployment:

```bash
npm run build
```
