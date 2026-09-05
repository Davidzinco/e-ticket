# 🎟️ E-Ticket SMASA — Bhima Night Carnival 2026 (BNC 2026)

Sistem pemesanan, pembayaran, penerbitan tiket elektronik (E-Ticket) dengan QR Code, verifikasi kehadiran gate scanner, dan manajemen tiket terintegrasi untuk event akbar tahunan **Bhima Night Carnival 2026** di SMA Negeri 1 Madiun.

---

## 📑 Daftar Isi
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Requirements](#requirements)
5. [Installation](#installation)
6. [Environment Setup](#environment-setup)
7. [Firebase Setup](#firebase-setup)
8. [DOKU Setup](#doku-setup)
9. [Running Development](#running-development)
10. [Build Production](#build-production)
11. [Payment Flow](#payment-flow)
12. [Ticket Flow](#ticket-flow)
13. [Admin Console](#admin-console)
14. [API Routes](#api-routes)
15. [Project Structure](#project-structure)
16. [Testing](#testing)
17. [Troubleshooting](#troubleshooting)
18. [Security Notes](#security-notes)

---

## 📌 Project Overview
- **Nama Proyek**: E-Ticket SMASA (Bhima Night Carnival 2026)
- **Instansi**: SMA Negeri 1 Madiun
- **Tujuan**: Menyediakan platform pemesanan tiket resmi berbasis web yang cepat, aman, dan dapat diandalkan untuk ribuan penonton festival musik dan karnaval BNC 2026.
- **Fungsi Utama**:
  - Penjualan tiket online dengan kalkulasi harga server-side dan reservasi kuota atomik (*concurrency-safe*).
  - Integrasi pembayaran resmi melalui **DOKU Checkout** (QRIS, Virtual Account, E-Wallet, Kartu Kredit).
  - Penerbitan otomatis E-Kupon ber-QR Code unik idempotensial disertai pengiriman email konfirmasi (inline attachment).
  - Portal pencarian tiket mandiri bagi pembeli via menu *"Kupon Saya"* (`/myticket`).
  - Sistem Gate Scanner panitia real-time via kamera HP/Webcam dengan Web Audio beeps.
  - Sinkronisasi real-time dua arah ke Google Sheets dan impor kupon offline dari Google Drive.
  - Dashboard Console Admin untuk monitoring pesanan, statistik penjualan, ekspor data Excel (`.xlsx`), dan kontrol event.

---

## ✨ Features
1. **Pembelian Tiket & Server Pricing**:
   - Pemilihan kuota paket tiket (Festival, VIP).
   - Validasi nama, NIK (16 digit), dan alamat email.
   - Perhitungan harga 100% di server dari database Firestore untuk mencegah manipulasi harga dari browser.
   - Reservasi stok tiket secara *atomic transaction* sebelum redirect ke payment gateway.
2. **DOKU Payment Gateway (Hosted Checkout)**:
   - Menggunakan DOKU Checkout dengan tanda tangan kriptografi simetris (HMAC-SHA256).
   - Pengalihan aman ke halaman checkout resmi DOKU.
   - Dukungan webhook notification terenkripsi dengan guard idempotensi (`tickets_issued`).
3. **QR Code Tiket & Email Delivery**:
   - Pembuatan string QR Code unik alphanumeric 20 karakter.
   - Gambar QR Code di-generate secara server-side dan di-embed ke email HTML (inline CID).
   - Kartu tiket interaktif di web dengan tombol cetak/unduh PDF.
4. **Halaman My Ticket (`/myticket`)**:
   - Pencarian tiket mandiri oleh pengunjung menggunakan Email dan NIK yang terdaftar.
   - Penyimpanan sesi login tiket lokal (`localStorage`) untuk kemudahan akses saat di lokasi acara.
5. **Halaman Sukses & Polling (`/success`)**:
   - Menangani 6 status transaksi (Paid, Processing, Pending, Expired, Failed, NotFound).
   - Auto-polling cerdas ke server hingga tiket diterbitkan oleh webhook.
6. **QR Scanner Gate (`/consol_admin/scan`)**:
   - Kamera live dengan viewport persegi 1:1 (`aspect-square`).
   - Algoritma pencocokan fleksibel (mendeteksi kode murni, prefix `E-Ticket-`, maupun format URL).
   - Efek suara Web Audio API:
     - 🟢 *Valid (Baru masuk)*: Double high beep.
     - 🟡 *Already Scanned (Pernah masuk)*: Triple warning beep.
     - 🔴 *Invalid (Tidak ditemukan)*: Buzz sound.
7. **Google Sheets Real-Time Sync & Drive Import**:
   - Otomatis mencatat setiap tiket baru ke tab Google Spreadsheet `"WEBSITE RESMI"`.
   - Update status kehadiran real-time saat tiket di-scan di gate.
   - Dukungan impor tiket fisik / kupon PDF dari Google Drive via tab `"DATA DRIVE"` dan background trigger Google Apps Script.
8. **Export Data Excel (`.xlsx`)**:
   - Tombol unduh data tiket langsung ke file Excel terformat di `/consol_admin/tickets`.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database & Auth**: [Firebase Firestore & Firebase Admin SDK](https://firebase.google.com/)
- **Payment Gateway**: [DOKU Checkout API](https://doku.com/) (HMAC-SHA256 Signature)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **QR Code Engine**: `qrcode`, `html5-qrcode`
- **Spreadsheet & Data Export**: `xlsx`, Google Apps Script Webhooks
- **Email Service**: [Nodemailer](https://nodemailer.com/) (Gmail SMTP via TLS)
- **Admin Authentication**: HMAC-SHA256 Signed HTTP-Only Cookies & NextAuth (Google OAuth)
- **UI Utilities**: `sonner` (Toast notifications), `swr`, `lucide-react`, `framer-motion`

---

## 📋 Requirements
Pastikan perangkat pengembangan Anda telah terinstal:
- **Node.js**: Versi `>= 20.9.0` (LTS direkomendasikan)
- **npm**: Versi `>= 10.0.0`
- **Firebase Project**: Firestore Database aktif (Native mode) & Service Account JSON key.
- **Akun DOKU Merchant**: Akun DOKU Sandbox atau Production dengan Client ID & Secret Key.
- **Akun Gmail**: Dengan fitur 2-Step Verification aktif untuk generate App Password (Nodemailer).

---

## 🚀 Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/Davidzinco/e-ticket.git
   cd e-ticket
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Buat file environment**:
   ```bash
   cp .env.example .env.local
   ```

---

## ⚙️ Environment Setup
Berikut adalah panduan seluruh variabel lingkungan yang ada di `.env.local` / `.env`:

| Variabel | Tipe | Status | Keterangan & Sumber |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL | Public | URL root aplikasi (`http://localhost:3000` atau URL production). |
| `NEXTAUTH_URL` | URL | Server | URL basis callback OAuth NextAuth. |
| `NEXTAUTH_SECRET` | String | Server | Random string 32+ karakter untuk enkripsi token session NextAuth. |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | String | Public | Nomor WhatsApp resmi panitia untuk tombol bantuan (contoh: `6289680575400`). |
| `NEXT_PUBLIC_FIREBASE_*` | String | Public | Kredensial Firebase Web SDK dari Firebase Console > Project Settings. |
| `FIREBASE_CLIENT_EMAIL` | String | Server | Email Service Account Firebase dari file JSON admin. |
| `FIREBASE_PRIVATE_KEY` | String | Server | Private Key RSA Service Account Firebase. |
| `DOKU_ENV` | String | Server | `"sandbox"` untuk pengujian atau `"production"` untuk transaksi asli. |
| `DOKU_CLIENT_ID` | String | Server | Client ID dari DOKU Merchant Dashboard. |
| `DOKU_SECRET_KEY` | String | Server | Secret Key dari DOKU Dashboard (Sangat rahasia!). |
| `DOKU_NOTIFICATION_URL` | URL | Server | URL endpoint webhook (`https://domain-anda.com/api/doku/notification`). |
| `DOKU_RETURN_URL` | URL | Server | URL redirect setelah pembayaran (`https://domain-anda.com/success`). |
| `PAYMENT_BYPASS` | Boolean | Server | `"true"` untuk bypass pembayaran di lokal (hanya aktif jika bukan production). |
| `GOOGLE_SHEETS_WEBHOOK_URL`| URL | Server | URL Web App Google Apps Script untuk sync data tiket ke Spreadsheet. |
| `ADMIN_SECRET_EMAIL` | String | Server | Email rahasia untuk backdoor admin via `/myticket`. |
| `ADMIN_SECRET_NIK` | String | Server | NIK rahasia untuk backdoor admin via `/myticket`. |
| `ADMIN_ACCESS_CODE` | String | Server | Password / kode akses untuk form login `/consol_admin`. |
| `ADMIN_SESSION_SECRET` | String | Server | Kunci rahasia HMAC penandatangan cookie session admin (min 32 karakter). |
| `DEFAULT_EMAIL_USER_ADMIN` | String | Server | Alamat email Gmail panitia untuk pengirim notifikasi e-tiket. |
| `DEFAULT_EMAIL_PASSWORD_ADMIN`| String| Server | Password Aplikasi 16 karakter dari Google App Passwords. |

---

## ☁️ Firebase Setup

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru (misal `e-ticket-bnc`).
2. Aktifkan **Cloud Firestore Database** dalam mode produksi (*Production Mode*).
3. Buka **Project Settings** > tab **General** > scroll ke bawah ke bagian **Your Apps** > pilih ikon Web (`</>`) untuk mendaftarkan web app.
4. Salin objek konfigurasi `firebaseConfig` dan masukkan nilainya ke variabel `NEXT_PUBLIC_FIREBASE_*` di `.env.local`.
5. Buka tab **Service Accounts** > klik tombol **Generate new private key**.
6. Simpan file JSON yang terunduh, lalu:
   - Isi `FIREBASE_CLIENT_EMAIL` dengan nilai `client_email` dari file JSON.
   - Isi `FIREBASE_PRIVATE_KEY` dengan nilai `private_key` dari file JSON.
   > **Catatan Multiline**: Pastikan seluruh string private key termasuk baris `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----` disalin dengan benar. Karakter baris baru `\n` harus dipertahankan.

---

## 💳 DOKU Setup

1. Buka dan masuk ke [DOKU Dashboard](https://sandbox.doku.com/) (Sandbox) atau [DOKU Production](https://dashboard.doku.com/).
2. Buka menu **Settings** > **API Keys**.
3. Salin **Client ID** ke variabel `DOKU_CLIENT_ID`.
4. Salin **Secret Key** ke variabel `DOKU_SECRET_KEY`.
   > ⚠️ **PENTING**: Jangan pernah menambahkan prefix `NEXT_PUBLIC_` pada `DOKU_SECRET_KEY` karena kunci ini hanya boleh diakses di sisi server.
5. Konfigurasi **Notification URL** di dashboard DOKU atau via API:
   - Atur URL ke: `https://domain-anda.com/api/doku/notification`
6. Atur **Return URL**:
   - Atur URL ke: `https://domain-anda.com/success`
7. Pengujian lokal: Saat melakukan uji coba di `localhost`, gunakan tunneling tool (seperti `ngrok` atau `cloudflared`) untuk mengarahkan notification URL DOKU ke port lokal Anda.

---

## 💻 Running Development

Jalankan server pengembangan lokal:
```bash
npm run dev
```

Buka peramban di:
```text
http://localhost:3000
```

---

## 🏗️ Build Production

Untuk menguji build produksi dan menjalankannya:
```bash
# 1. Typecheck & build aplikasi
npm run build

# 2. Menjalankan server hasil build
npm run start
```

---

## 🔄 Payment Flow

```text
Pengunjung Memilih Tiket di Halaman Event
                    │
                    ▼
Mengisi Nama, NIK, Email pada Form Pemesanan
                    │
                    ▼
Frontend mengirim POST ke /api/payments/create
                    │
                    ▼
Server Memvalidasi Data & Menghitung Harga dari Database Firestore
                    │
                    ▼
Server Melakukan Atomic Stock Reservation (Kunci Kuota Tiket)
                    │
                    ▼
Server Membuat Transaksi ke API DOKU Checkout (HMAC-SHA256 Signature)
                    │
                    ▼
Server Mengembalikan payment_url ke Browser
                    │
                    ▼
Browser Redirect Pengunjung ke Halaman Pembayaran DOKU
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
Pengunjung Menyelesaikan    DOKU Mengirim Webhook HTTP POST
Pembayaran di DOKU          ke /api/doku/notification
       │                         │
       ▼                         ▼
Browser Redirect ke          Backend Memvalidasi Signature HMAC,
/success?order_id=...        Memeriksa Nominal, & Memperbarui
       │                     Status Pembayaran menjadi "paid"
       │                         │
       │                         ▼
       │                     Sistem Menerbitkan Tiket (qr_detail),
       │                     Sync ke Google Sheets, & Kirim Email QR
       ▼                         │
Halaman /success Melakukan       │
Auto-Polling Status              │
       │                         │
       └─────────────────────────┘
                    │
                    ▼
Pengunjung Melihat Tiket & QR Code Siap Digunakan
```

---

## 🎫 Ticket Flow
Hubungan antar entitas database dalam sistem:
- **`event`**: Menyimpan katalog acara, paket tiket, harga satuan, dan kuota tersedia (`ticket`).
- **`payment_status`**: Menyimpan catatan permanen setiap transaksi pembayaran (`order_id`, `gross_amount`, `status`, `provider`, `stock_reserved`, `tickets_issued`).
- **`qr_detail`**: Menyimpan data spesifik setiap lembar tiket yang telah terbit (`qr_code`, `order_id`, `name`, `nik`, `email`, `isScanned`, `scanned_at`, `scanned_by`).
  - Relasi: Satu `order_id` di `payment_status` dapat memiliki $N$ dokumen tiket di `qr_detail` (sesuai jumlah kuota tiket yang dibeli).

---

## 🛡️ Admin Console

### Akses Console Admin
Console admin dapat diakses melalui rute:
- **Dashboard**: `/consol_admin` atau `/consol_admin/dashboard`
- **Gate Scanner**: `/consol_admin/scan`
- **Manajemen Tiket & Export Excel**: `/consol_admin/tickets`
- **Manajemen Pesanan**: `/consol_admin/orders`
- **Pengaturan & Sinkronisasi Drive/Sheets**: `/consol_admin/settings`

### Metode Autentikasi Admin
Sistem menyediakan dua jalur akses yang aman tanpa hardcoded credentials:
1. **Access Code Login (`/consol_admin`)**:
   - Memasukkan kode akses yang dikonfigurasi di `ADMIN_ACCESS_CODE`.
   - Dilindungi proteksi *rate-limiting* (maksimal 5 percobaan gagal per IP dengan lockout 15 menit).
2. **Backdoor Login (`/myticket`)**:
   - Memasukkan `ADMIN_SECRET_EMAIL` dan `ADMIN_SECRET_NIK` pada form pencarian tiket publik.
3. **Session Cookie**:
   - Sesi admin disimpan dalam HTTP-Only cookie `bnc_admin_session` yang ditandatangani menggunakan HMAC-SHA256 (`ADMIN_SESSION_SECRET`). Berlaku selama 8 jam.
4. **Logout**:
   - Menghapus cookie sesi melalui endpoint `/api/admin/auth/logout`.

---

## 📡 API Routes

### 1. `POST /api/payments/create`
- **Fungsi**: Membuat transaksi pembayaran baru dan mereservasi kuota tiket.
- **Request Body**:
  ```json
  {
    "eventId": "5W7jcnr28tGc5E8tywRl",
    "packageId": "FESTIVAL",
    "ticketQuantity": 1,
    "name": ["Budi Santoso"],
    "nik": ["3577012345670001"],
    "email": "budi@gmail.com"
  }
  ```
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "order_id": "BNC123456ABCDEF",
    "payment_url": "https://sandbox.doku.com/checkout/...",
    "gross_amount": 56000
  }
  ```

### 2. `POST /api/doku/notification`
- **Fungsi**: Webhook callback penerima notifikasi pembayaran resmi dari DOKU.
- **Headers Wajib**: `Client-Id`, `Request-Id`, `Request-Timestamp`, `Signature`.
- **Response (200)**: Mengembalikan HTTP 200 dengan status pemrosesan tiket. Dilengkapi guard idempotensi untuk mencegah duplikasi tiket jika webhook dikirim berulang.

### 3. `GET /api/qr`
- **Fungsi**: Memindai dan memverifikasi tiket di pintu gerbang event (Gate Scanner).
- **Query Params**: `code` (string kode QR atau URL kupon).
- **Response**:
  - Valid: `{ message: "Unscanned", data: { ... } }`
  - Pernah Masuk: `{ message: "Already Scanned", data: { ... } }`
  - Tidak Ditemukan: `{ message: "Barcode Tidak Ditemukan" }` (404)

### 4. `GET /api/tickets/by-order`
- **Fungsi**: Mengambil detail tiket berdasarkan `order_id` untuk halaman `/success`.
- **Query Params**: `order_id` (string).

### 5. `POST /api/myticket`
- **Fungsi**: Mencari seluruh tiket yang dimiliki pengunjung berdasarkan Email dan NIK.
- **Request Body**: `{ "email": "...", "nik": "..." }`

### 6. `POST /api/admin/import-drive`
- **Fungsi**: Batch import data tiket fisik/drive dari tab Google Spreadsheet ke database Firestore.
- **Headers**: `x-api-key: <ADMIN_ACCESS_CODE>`

---

## 📂 Project Structure

```text
e-ticket/
├── public/
│   ├── fonts/               # Custom web fonts (ClimateCrisis)
│   └── images/              # WebP assets & Favicon resmi SMASA
│       └── bnc_2025/        # Asset banner, hero background & logo resmi 2026
├── src/
│   ├── app/
│   │   ├── (pages)/         # App Router pages (/consol_admin, /myticket, /success, dll.)
│   │   ├── api/             # Backend API routes (payments, doku webhook, qr scan, admin)
│   │   ├── components/      # UI components, layouts, views, dan interfaces
│   │   └── globals.css      # Tailwind styles & font declarations
│   ├── libs/
│   │   ├── adminAuth.ts     # HMAC admin session tokens & rate limiting
│   │   ├── googleSheets.ts  # Webhook sync ke Google Spreadsheet
│   │   ├── firebase/        # Firestore client & Admin SDK service
│   │   ├── payments/        # DOKU API client, HMAC signatures, status mapper
│   │   ├── tickets/         # Concurrency stock management & issueTickets
│   │   └── email/           # HTML email templates dengan inline QR Code
│   └── middleware.ts        # Route protection untuk area admin
├── google-apps-script/      # Script Google Apps Script untuk tab DATA DRIVE & Sync
├── .env.example             # Template konfigurasi environment variables
└── README.md                # Dokumentasi resmi proyek
```

---

## 🧪 Testing

1. **Pembelian Tiket Sandbox**:
   - Kunjungi `http://localhost:3000`, pilih tiket, dan selesaikan checkout sandbox di DOKU menggunakan simulator pembayaran DOKU.
2. **Uji Coba Payment Bypass**:
   - Atur `PAYMENT_BYPASS=true` di `.env.local` saat offline/tanpa jaringan DOKU. Pembelian akan langsung sukses dan tiket langsung diterbitkan seketika.
3. **Pencarian Kupon di "Kupon Saya"**:
   - Buka `/myticket`, masukkan Email dan NIK yang digunakan saat checkout. Seluruh tiket yang terdaftar akan ditampilkan.
4. **Pengujian Gate Scanner**:
   - Buka `/consol_admin/scan` dari smartphone atau laptop dengan kamera, lalu arahkan kamera ke kode QR tiket. Dengarkan bunyi audio beep indikator validitas.
5. **Ekspor Data Excel**:
   - Buka `/consol_admin/tickets` dan klik tombol **"Download Data (.xlsx / Excel)"** untuk memastikan file Excel terunduh dengan rapi.

---

## 🔧 Troubleshooting

- **Firebase Credential Error (`error:06065064:pem routines:PEM_read_bio:bad base64 decode`)**:
  - Masalah: Format baris baru pada `FIREBASE_PRIVATE_KEY` rusak saat disalin ke environment variable.
  - Solusi: Bungkus private key dengan tanda kutip ganda (`"..."`) dan pastikan karakter baris baru menggunakan literal `\n`.
- **DOKU Invalid Signature**:
  - Masalah: Perbedaan Digest, path Request-Target, atau spasi pada `DOKU_SECRET_KEY`.
  - Solusi: Pastikan `DOKU_CLIENT_ID` dan `DOKU_SECRET_KEY` tidak memiliki spasi di awal/akhir dan environment diset ke `"sandbox"`.
- **Webhook Notifikasi DOKU Tidak Masuk di Localhost**:
  - Masalah: Server DOKU di internet tidak dapat menjangkau alamat IP `localhost:3000`.
  - Solusi: Gunakan software tunneling seperti `ngrok http 3000` dan masukkan URL tunneling publik ke `DOKU_NOTIFICATION_URL`.
- **QR Code Tiket Belum Tercentang di Google Spreadsheet**:
  - Masalah: Panggilan sync webhook tidak ditunggu (`await`).
  - Solusi: Fungsi `updateTicketScanInGoogleSheets` telah diperbarui dengan panggilan asinkron `await` penuh sehingga status kehadiran dipastikan terupdate sebelum response gate ditutup.

---

## 🔒 Security Notes
- **JANGAN PERNAH** melakukan commit file `.env`, `.env.local`, atau service account JSON ke Git repository.
- Seluruh rahasia API (`DOKU_SECRET_KEY`, `FIREBASE_PRIVATE_KEY`, `ADMIN_SESSION_SECRET`) hanya boleh berjalan di lingkungan **Server-Side**.
- Lakukan rotasi API Key secara berkala jika dicurigai terjadi kebocoran kredensial.
- Akses route scanner gate dan console admin dilindungi oleh cookie berenkripsi HMAC dengan atribut `HttpOnly`, `SameSite=Lax`, dan pembatasan durasi sesi.
