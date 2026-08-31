<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 📋 E-Ticket SMASA — Project Memory & Agent Context

> **Proyek**: Sistem E-Ticket untuk event "Bhima Night Carnival 2026" (BNC 2026) — SMA Negeri 1 Madiun
> **Repo**: `Davidzinco/e-ticket` (GitHub)
> **Branch utama**: `main` (development di `tes2`, merge ke `main`)
> **Tech Stack**: Next.js 16.3.1 (Turbopack), Firebase Firestore, DOKU Payment Gateway (Checkout), Google Sheets Sync, nodemailer

---

## 🏗️ Arsitektur Proyek

### Struktur Direktori Utama

```
src/
├── app/
│   ├── api/                          # API Routes (Backend)
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   ├── logout/route.ts   # Admin logout (clear cookie)
│   │   │   │   ├── session/route.ts  # Admin session check
│   │   │   │   └── verify-code/route.ts  # Access code verification + rate limiting
│   │   │   ├── orders/route.ts       # List orders (provider-neutral)
│   │   │   ├── stats/route.ts        # Dashboard statistics
│   │   │   ├── sync-sheets/route.ts  # Manual Google Sheets sync & test
│   │   │   └── tickets/route.ts      # List all tickets
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth Google OAuth
│   │   ├── doku/
│   │   │   └── notification/route.ts # DOKU Webhook callback (HMAC verification, guarded ticket issue)
│   │   ├── event/route.ts            # Event CRUD + stock release
│   │   ├── myticket/route.ts         # Public ticket lookup
│   │   ├── payments/
│   │   │   └── create/route.ts       # DOKU Checkout creation (server pricing, atomic stock reservation)
│   │   ├── qr/route.ts              # QR scan validation + Sheets sync
│   │   ├── tickets/by-order/route.ts # Tickets by order ID (provider-neutral status)
│   │   └── tokenizer/route.ts       # Transition wrapper (delegates to /api/payments/create)
│   ├── components/
│   │   ├── interfaces/               # TypeScript interfaces (paymentStatus, qrCode, event)
│   │   ├── utils/                     # Utility functions (toDate, etc.)
│   │   └── views/
│   │       ├── admin/
│   │       │   ├── consolAdminDashboardView.tsx   # Dashboard stats
│   │       │   ├── consolAdminEventsView.tsx      # Event management
│   │       │   ├── consolAdminOrdersView.tsx      # Order management
│   │       │   ├── consolAdminScanView.tsx        # QR Scanner gate (1:1 square, Web Audio beeps)
│   │       │   ├── consolAdminSettingsView.tsx    # Settings + Sheets sync buttons
│   │       │   └── consolAdminTicketsView.tsx     # Ticket management
│   │       ├── detail/bnc_2025/bnc2025View.tsx    # Event detail & ticket purchase
│   │       └── login/loginView.tsx                # Google OAuth login page
│   └── (pages)/                       # Next.js App Router pages
│       ├── consol_admin/              # Admin console pages
│       ├── auth/login/                # Login page
│       ├── detail/[eventId]/          # Event detail page
│       ├── myticket/                  # Public ticket lookup + admin backdoor
│       ├── success/                   # Payment success page (6 states, polling)
│       └── error/                     # Error page
├── libs/
│   ├── adminAuth.ts          # Server-side admin auth (HMAC-SHA256, rate limiting)
│   ├── adminAuthEdge.ts      # Edge-compatible admin auth (for middleware)
│   ├── googleSheets.ts       # Google Sheets webhook sync (send + scan update)
│   ├── auth/auth.ts          # NextAuth configuration
│   ├── firebase/
│   │   ├── admin.ts           # Firebase Admin SDK (server-side)
│   │   ├── init.ts            # Firebase client-side init
│   │   └── service.ts         # Firebase service layer
│   ├── payments/
│   │   ├── doku.ts            # DOKU Checkout API client & HMAC-SHA256 signature generator
│   │   └── status.ts          # Provider-neutral status mapper (paid, pending, failed, etc.)
│   ├── tickets/
│   │   ├── stock.ts           # Shared stock management (reserveStock, releaseStock)
│   │   └── issueTickets.ts    # Idempotent ticket issuance & QR code generator
│   └── email/
│       └── ticketEmail.ts     # HTML ticket email with inline CID QR code attachments
└── middleware.ts              # Route protection middleware
```

---

## 💳 DOKU Payment Gateway Integration (Checkout)

### Produk: **DOKU Checkout**
- Alur Hosted Checkout: Server membuat transaksi via API → DOKU mengembalikan `payment.url` → Browser redirect ke halaman DOKU → DOKU mengirim notification webhook ke backend → Browser kembali ke `/success?order_id=...`
- Menggunakan **Symmetric Signature** (HMAC-SHA256) dengan `Client-Id`, `Request-Id`, `Request-Timestamp`, `Request-Target`, dan `Digest`.
- Tidak memerlukan Merchant Public Key atau Asymmetric RSA untuk Checkout.

### Konfigurasi Environment Variables

```env
# DOKU Payment Gateway
DOKU_ENV=sandbox                  # "sandbox" atau "production"
DOKU_CLIENT_ID=<your-client-id>
DOKU_SECRET_KEY=<your-secret-key>
DOKU_NOTIFICATION_URL=http://localhost:3000/api/doku/notification
DOKU_RETURN_URL=http://localhost:3000/success

# Payment Bypass Mode (Testing only, server-side)
PAYMENT_BYPASS=false              # true = terbitkan tiket langsung tanpa memanggil DOKU
```

### Keamanan & Idempotensi
1. **Server-Side Pricing**: Harga, nama produk, dan nominal dihitung 100% di server dari data Firestore `event`. Client tidak dapat memanipulasi harga.
2. **Atomic Stock Reservation**: Stok tiket direservasi dalam Firestore Transaction sebelum transaksi DOKU dibuat. Jika DOKU error, stok otomatis di-rollback.
3. **Idempotent Webhook**: Webhook DOKU (`/api/doku/notification`) dilindungi guard `tickets_issued` dan `stock_released` — pengiriman ulang webhook tidak menggandakan tiket atau stok.
4. **Permanent Payment History**: Koleksi `payment_status` disimpan secara permanen sebagai histori transaksi (tidak dihapus setelah tiket terbit).

---

## 🔐 Sistem Autentikasi Admin (Console Admin)

### Dua Jalur Masuk Admin

1. **Via `/myticket` (Backdoor)**:
   - Input email rahasia + NIK (dari `.env`) → set cookie `bnc_admin_session` → redirect ke `/consol_admin`

2. **Via `/consol_admin` (Access Code)**:
   - Input kode akses (dari `.env`) → set cookie `bnc_admin_session`
   - Rate limiting: max 5 percobaan gagal, lockout 15 menit per IP

### Session Cookie
- Nama: `bnc_admin_session`
- Tipe: `httpOnly`, `sameSite: "lax"`, `maxAge: 28800` (8 jam)
- Token: HMAC-SHA256 signed (`src/libs/adminAuth.ts`)
- Edge validator: `src/libs/adminAuthEdge.ts` (tanpa `node:crypto`, kompatibel Edge Runtime)

### Environment Variables Admin (Tersimpan aman di `.env`, tidak ada hardcoded di kode)
```env
ADMIN_SECRET_EMAIL=<your-private-admin-email>
ADMIN_SECRET_NIK=<your-private-admin-nik>
ADMIN_ACCESS_CODE=<your-private-access-code>
ADMIN_SESSION_SECRET=<your-random-session-secret>
```

---

## 📊 Google Sheets Integration

### Webhook URL
```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw-p9RZHlouOMh7QK8Tdo77v9fbCYSY9n2ywsLhY1Dv97e-BAX7nQpSmleE1tB6sZF1-g/exec
```

### Tab Spreadsheet Target
1. **"WEBSITE RESMI"** — Semua data tiket dari transaksi online website masuk ke tab ini.
2. **"DATA DRIVE"** — Data tiket offline/kupon dari file PDF Google Drive masuk ke tab ini via `google-apps-script/Code.gs`.

### Fungsi Sync (`src/libs/googleSheets.ts` & `src/app/api/admin/import-drive/route.ts`)
1. **`sendBuyerToGoogleSheets(items)`** — Kirim data tiket baru online ke Sheets (dipanggil saat pembayaran DOKU berhasil).
2. **`updateTicketScanInGoogleSheets(qrCode, scannedAt, isScanned)`** — Update status kehadiran real-time saat tiket di-scan (otomatis mencari di kedua tab: `WEBSITE RESMI` & `DATA DRIVE`).
3. **`POST /api/admin/import-drive`** — Batch import kupon/tiket dari tab `DATA DRIVE` ke Firestore `qr_detail`.

---

## 📱 QR Scanner Gate (`/consol_admin/scan`)

### Fitur
- Kamera live dengan **viewport persegi 1:1** (`aspect-square max-w-[340px]`)
- Dynamic `qrbox` 1:1 pada mobile dan desktop
- **Tidak memerlukan Google OAuth** — cukup session cookie `bnc_admin_session`
- Web Audio API sound effects:
  - ✅ Valid: High double beep
  - ⚠️ Already Scanned: Lower triple beep
  - ❌ Invalid: Buzz sound

---

## 📧 Email System

### Konfigurasi
```env
DEFAULT_EMAIL_USER_ADMIN=<gmail address>
DEFAULT_EMAIL_PASSWORD_ADMIN=<gmail app password>
```

### Flow
- Setelah pembayaran berhasil, sistem:
  1. Generate QR codes unik (20 char alphanumeric)
  2. Simpan ke Firestore `qr_detail`
  3. Sync ke Google Sheets
  4. Generate QR code images (PNG base64)
  5. Kirim email HTML dengan QR code attachments (inline CID)

---

## 🗄️ Firebase Firestore Collections

| Collection | Deskripsi |
|---|---|
| `event` | Data event (nama, harga, kuota per paket, tanggal, lokasi) |
| `qr_detail` | Detail tiket + QR code (nama, NIK, email, status scan) |
| `payment_status` | Histori pembayaran permanen (order_id, status, nominal, provider, timestamps) |
| `users` | User data (Google OAuth, role) |

---

## 🔄 Git Workflow

- Branch development: `tes2`
- Branch production: `main`
- Aturan: **JANGAN push ke remote manapun tanpa perintah eksplisit dari pengguna!**

---

## 📝 Riwayat Perubahan Penting

### 1. Migrasi Midtrans Snap → DOKU Checkout
- Implementasi API DOKU Checkout (`src/libs/payments/doku.ts`) dengan HMAC-SHA256 symmetric signature.
- Endpoint baru `/api/payments/create` dengan perhitungan harga server-side, atomic stock reservation, dan permanent `payment_status`.
- Webhook baru `/api/doku/notification` dengan verifikasi signature, pemeriksaan nominal, penerbitan tiket ber-guard, dan fallback stock release.
- Modularisasi arsitektur: `stock.ts`, `issueTickets.ts`, `ticketEmail.ts`, `status.ts`.
- Frontend `buyModal.tsx` & `content.tsx` dibersihkan dari dependency `snap.js` dan diarahkan ke redirect checkout DOKU.
- Dependency `midtrans-client` dan `@types/midtrans-client` dihapus.

### 2. Dual-Path Admin Console Access
- Implementasi `/myticket` backdoor (email + NIK → admin session)
- Implementasi `/consol_admin` access code dengan rate limiting
- HMAC-SHA256 session tokens

### 3. QR Scanner Gate (`/consol_admin/scan`)
- Strict 1:1 square camera viewport dan qrbox
- Web Audio API beep sounds

### 4. Google Sheets Real-Time Sync
- `sendBuyerToGoogleSheets()` — kirim tiket baru
- `updateTicketScanInGoogleSheets()` — update kehadiran real-time

---

## 🚨 Known Issues & Gotchas

1. **DOKU Webhook Domain** — Saat testing lokal, DOKU tidak bisa mengirim webhook ke `localhost`. Gunakan ngrok / tunnel publik.
2. **Google Apps Script POST** — harus `text/plain` content type + `redirect: follow`, bukan `application/json`.
3. **Middleware convention** — Next.js 16.3.1 menampilkan warning bahwa `middleware.ts` deprecated, diganti `proxy`.
4. **Git Push Restriction** — Jangan pernah melakukan `git push` tanpa izin langsung dari pengguna.
