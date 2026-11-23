# Panduan Deploy Catevia ke Hostinger Web Hosting via GitHub

Aplikasi **Catevia** telah disiapkan untuk langsung di-deploy sebagai aplikasi web statis (React + Vite) di **Hostinger Web Hosting (Shared / Cloud Hosting)** menggunakan **GitHub Actions** secara otomatis setiap kali ada pembaruan di branch `main`.

---

## Ringkasan File Kesiapan Hostinger

- `public/.htaccess` — Otomatis tersalin ke `dist/.htaccess` saat build. Mengatur redirect HTTPS, SPA fallback (`index.html`), caching aset Vite, proteksi file tersembunyi, dan header `Cross-Origin-Opener-Policy: same-origin-allow-popups` agar login Google Firebase tetap berjalan lancar.
- `.github/workflows/deploy-hostinger.yml` — Workflow otomatis yang menjalankan `npm ci` → `npm run lint` → `npm run build` lalu mengunggah isi `dist/` ke Hostinger via **FTPS** dengan aman (tanpa menghapus folder `.well-known/` milik SSL Let's Encrypt).
- `src/firebase.ts` — Menggunakan `firebase-applet-config.json` secara default, dan mendukung override opsional melalui variabel `VITE_FIREBASE_*` jika Anda ingin menghubungkan proyek Firebase produksi terpisah.

---

## Langkah 1 — Siapkan Domain / Subdomain & Akun FTP di Hostinger hPanel

1. Masuk ke **Hostinger hPanel** → pilih paket Web Hosting Anda.
2. (Disarankan) Buat subdomain khusus, misalnya `katekese.namaparoki.org`, atau gunakan domain utama di folder `public_html/`.
3. Aktifkan **SSL (HTTPS)** gratis di menu **Keamanan → SSL**.
4. Buka menu **File → Akun FTP**, lalu catat:
   - **FTP IP / Hostname** (contoh: `ftp.namaparoki.org` atau alamat IP server Hostinger)
   - **FTP Username** (contoh: `u123456789.katekese`)
   - **FTP Password** (buat/reset password khusus FTP)
   - **Target Direktori** (umumnya `./public_html/` untuk domain utama, atau `./` jika akun FTP sudah diarahkan langsung ke direktori subdomain).

---

## Langkah 2 — Hubungkan Repository GitHub & Isi GitHub Secrets

1. Push seluruh kode proyek ini ke repository GitHub Anda (branch `main`).
2. Di GitHub, buka **Settings → Secrets and variables → Actions**.
3. Pada tab **Secrets**, klik **New repository secret** dan tambahkan 3 secret wajib:

| Nama Secret | Contoh Nilai | Keterangan |
| :--- | :--- | :--- |
| `HOSTINGER_FTP_SERVER` | `145.14.151.xx` atau `ftp.namaparoki.org` | Alamat server FTP dari hPanel |
| `HOSTINGER_FTP_USERNAME` | `u123456789.catevia` | Username akun FTP dari hPanel |
| `HOSTINGER_FTP_PASSWORD` | `••••••••••••` | Password akun FTP dari hPanel |

4. *(Opsional)* Pada tab **Variables**, Anda dapat menambahkan:

| Nama Variable | Nilai Default | Keterangan |
| :--- | :--- | :--- |
| `HOSTINGER_SERVER_DIR` | `./public_html/` | Ubah ke `./` jika akun FTP sudah mengarah langsung ke folder subdomain |
| `HOSTINGER_FTP_PORT` | `21` | Port FTP Hostinger |
| `VITE_BASE_PATH` | `/` | Ubah misalnya ke `/catevia/` hanya jika aplikasi dipasang di dalam subfolder |
| `VITE_ADMIN_EMAIL` | *(default proyek)* | Email Google Administrator utama Paroki (pastikan juga cocok dengan aturan Firestore) |

5. *(Opsional — Proyek Firebase Terpisah)* Jika Anda menggunakan proyek Firebase produksi sendiri (bukan bawaan `firebase-applet-config.json`), tambahkan secret berikut di tab **Secrets**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_ID`

---

## Langkah 3 — WAJIB: Daftarkan Domain Hostinger di Firebase Console

Agar tombol **Masuk dengan Google** dan **Formulir Pendaftaran Mandiri** tidak diblokir (`auth/unauthorized-domain`):

1. Buka **Firebase Console** → pilih proyek Firebase Catevia Anda.
2. Masuk ke **Authentication → Settings → Authorized domains**.
3. Klik **Add domain**, lalu tambahkan domain/subdomain Hostinger Anda (contoh: `katekese.namaparoki.org` dan/atau `namaparoki.org` tanpa `https://`).
4. Simpan perubahan.

---

## Langkah 4 — Jalankan Deploy Pertama

1. Buka tab **Actions** di repository GitHub Anda.
2. Pilih workflow **Deploy Catevia to Hostinger Web Hosting**.
3. Klik **Run workflow** (atau cukup `git push origin main`).
4. Tunggu proses build & upload FTPS selesai (±1–2 menit), lalu buka domain Hostinger Anda di browser.

---

## Checklist Verifikasi Pasca-Deploy

- [ ] Halaman depan (*frontpage*) tampil penuh beserta logo Catevia & daftar program dari Firestore.
- [ ] Refresh halaman di browser tidak menghasilkan error `404 Not Found`.
- [ ] Klik **Masuk Portal** atau kirim **Formulir Pendaftaran Mandiri** → popup Login Google terbuka tanpa error `auth/unauthorized-domain`.
- [ ] Masuk sebagai Administrator Paroki dan pastikan menu **Paroki & CMS Website** serta seluruh data katekese tersinkronisasi.
- [ ] Tinjau ulang file `firestore.rules` dan pastikan aturan keamanan sudah ter-deploy di proyek Firebase produksi sebelum dibagikan ke seluruh umat.

---

## Pemecahan Masalah Singkat

- **Popup Login Google menampilkan pesan domain belum terdaftar**: Pastikan domain Hostinger sudah ditambahkan di *Firebase Console → Authentication → Settings → Authorized domains*.
- **File lama masih muncul setelah deploy**: Bersihkan cache Hostinger di *hPanel → Lanjutan → Pengelola Cache (Flush Cache)*, lalu muat ulang browser (`Ctrl+Shift+R`).
- **Deploy FTPS gagal `530 Login authentication failed`**: Pastikan `HOSTINGER_FTP_USERNAME` menggunakan username lengkap (termasuk prefix `u123456789...`) dan password FTP terbaru dari hPanel.
