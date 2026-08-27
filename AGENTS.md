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
> **Tech Stack**: Next.js 16.3.1 (Turbopack), Firebase Firestore, Midtrans Payment, Google Sheets Sync, nodemailer

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
│   │   │   ├── orders/route.ts       # List orders
│   │   │   ├── stats/route.ts        # Dashboard statistics
│   │   │   ├── sync-sheets/route.ts  # Manual Google Sheets sync & test
│   │   │   └── tickets/route.ts      # List all tickets
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth Google OAuth
│   │   ├── event/route.ts            # Event CRUD
│   │   ├── midtrans/notification/route.ts  # Midtrans webhook callback
│   │   ├── myticket/route.ts         # Public ticket lookup
│   │   ├── qr/route.ts              # QR scan validation + Sheets sync
│   │   ├── tickets/by-order/route.ts # Tickets by order ID
│   │   └── tokenizer/route.ts       # Midtrans Snap token creation + bypass mode
│   ├── components/
│   │   ├── interfaces/               # TypeScript interfaces
│   │   ├── utils/                     # Utility functions
│   │   └── views/
│   │       ├── admin/
│   │       │   ├── adminView.tsx                  # Legacy admin view
│   │       │   ├── consolAdminDashboardView.tsx   # Dashboard stats
│   │       │   ├── consolAdminEventsView.tsx      # Event management
│   │       │   ├── consolAdminOrdersView.tsx      # Order management
│   │       │   ├── consolAdminScanView.tsx        # QR Scanner gate (1:1 square, Web Audio beeps)
│   │       │   ├── consolAdminSettingsView.tsx    # Settings + Sheets sync buttons
│   │       │   └── consolAdminTicketsView.tsx     # Ticket management
│   │       ├── detail/bnc_2025/bnc2025View.tsx    # Event detail & ticket purchase
│   │       ├── login/loginView.tsx                # Google OAuth login page
│   │       └── scan/scanVIew.tsx                  # Legacy scan view
│   └── (pages)/                       # Next.js App Router pages
│       ├── consol_admin/              # Admin console pages
│       ├── auth/login/                # Login page
│       ├── detail/[eventId]/          # Event detail page
│       ├── myticket/                  # Public ticket lookup + admin backdoor
│       ├── success/                   # Payment success page
│       └── error/                     # Error page
├── libs/
│   ├── adminAuth.ts          # Server-side admin auth (HMAC-SHA256, rate limiting)
│   ├── adminAuthEdge.ts      # Edge-compatible admin auth (for middleware)
│   ├── googleSheets.ts       # Google Sheets webhook sync (send + scan update)
│   ├── auth/auth.ts          # NextAuth configuration
│   └── firebase/
│       ├── admin.ts           # Firebase Admin SDK (server-side)
│       ├── init.ts            # Firebase client-side init
│       └── service.ts         # Firebase service layer
└── middleware.ts              # Route protection middleware
```

---

## 🔐 Sistem Autentikasi Admin (Console Admin)

### Dua Jalur Masuk Admin

1. **Via `/myticket` (Backdoor)**:
   - Input email rahasia + NIK → set cookie `bnc_admin_session` → redirect ke `/consol_admin`
   - Default: `admin@bnc.smasa.sch.id` + `3519999999999999`

2. **Via `/consol_admin` (Access Code)**:
   - Input kode akses → set cookie `bnc_admin_session`
   - Default: `BNC2026-ADMIN-PASS`
   - Rate limiting: max 5 percobaan gagal, lockout 15 menit per IP

### Session Cookie
- Nama: `bnc_admin_session`
- Tipe: `httpOnly`, `sameSite: "lax"`, `maxAge: 28800` (8 jam)
- Token: HMAC-SHA256 signed (`src/libs/adminAuth.ts`)
- Edge validator: `src/libs/adminAuthEdge.ts` (tanpa `node:crypto`, kompatibel Edge Runtime)

### Environment Variables Admin
```env
ADMIN_SECRET_EMAIL=admin@bnc.smasa.sch.id
ADMIN_SECRET_NIK=3519999999999999
ADMIN_ACCESS_CODE=BNC2026-ADMIN-PASS
ADMIN_SESSION_SECRET=bnc_admin_secret_session_key_2026
```

---

## 💳 Midtrans Payment Integration

### Konfigurasi Penting

```env
MIDTRANS_MERCHANT_ID=M610745839
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js  # atau https://app.midtrans.com/snap/snap.js untuk production
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
MIDTRANS_SERVER_KEY=<your-midtrans-server-key>
MIDTRANS_IS_PRODUCTION=false     # WAJIB diset, menentukan target API
NEXT_PUBLIC_BYPASS_MIDTRANS=false # true = skip Midtrans, langsung buat tiket
```

### ⚠️ PENTING: Deteksi Sandbox vs Production

**JANGAN** mendeteksi environment berdasarkan prefix `SB-` pada key! Kunci Sandbox dari Midtrans dashboard **TIDAK** selalu diawali `SB-`. Deteksi environment **HARUS** berdasarkan env var `MIDTRANS_IS_PRODUCTION`:

```typescript
// ✅ BENAR — mengutamakan MIDTRANS_IS_PRODUCTION
const midtransIsProductionEnv = process.env.MIDTRANS_IS_PRODUCTION;
const isProduction =
  midtransIsProductionEnv !== undefined
    ? midtransIsProductionEnv === "true"
    : (serverKey ? !serverKey.startsWith("SB-") : false);

// ❌ SALAH — kunci sandbox bisa saja TIDAK diawali SB-
const isProduction = !serverKey.startsWith("SB-");
```

**Bug yang pernah terjadi**: Kunci sandbox `Mid-server-xxxxx` (tanpa prefix `SB-`) terdeteksi sebagai kunci Production, sehingga request dikirim ke `app.midtrans.com` (Production) dan ditolak 401.

### Bypass Mode
- `NEXT_PUBLIC_BYPASS_MIDTRANS=true` → Tidak memanggil Midtrans API, langsung membuat QR tiket
- Berguna untuk testing lokal tanpa koneksi payment

### Debug Logging
File `src/app/api/tokenizer/route.ts` memiliki debug log detail:
- **🔧 MIDTRANS CONFIG DEBUG** — menampilkan mode, key (masked), API target saat request masuk
- **❌ MIDTRANS API ERROR** — menampilkan HTTP status, API response, key used saat error

---

## 📊 Google Sheets Integration

### Webhook URL
```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw-p9RZHlouOMh7QK8Tdo77v9fbCYSY9n2ywsLhY1Dv97e-BAX7nQpSmleE1tB6sZF1-g/exec
```

### Tab Spreadsheet Target
**"WEBSITE RESMI"** — Semua data tiket dari website harus masuk ke tab ini.

### Dua Fungsi Sync (`src/libs/googleSheets.ts`)

1. **`sendBuyerToGoogleSheets(items)`** — Kirim data tiket baru ke Sheets (dipanggil saat pembayaran berhasil)
2. **`updateTicketScanInGoogleSheets(qrCode, scannedAt, isScanned)`** — Update status kehadiran real-time saat tiket di-scan

### Teknis Penting untuk Google Apps Script
- Gunakan `Content-Type: "text/plain;charset=utf-8"` (bukan `application/json`) — mencegah CORS preflight
- Gunakan `redirect: "follow"` — Google Apps Script redirect ke `script.googleusercontent.com`
- Apps Script menggunakan Upsert: cek Column 12 (`Kode Tiket`) sebelum append untuk mencegah duplikasi
- `action: "update_scan"` → update Column 14 (`Kehadiran` → checkbox `true`) dan Column 15 (`Waktu Scan`)

### Manual Sync UI
Tersedia di `/consol_admin/settings`:
- **"Kirim 1 Baris Uji Coba"** — Test kirim 1 baris
- **"Sinkronkan Seluruh Tiket Database ke Spreadsheet"** — Bulk sync semua tiket dari Firestore

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

### File: `src/app/components/views/admin/consolAdminScanView.tsx`

---

## 🔒 Middleware (`src/middleware.ts`)

### Route Protection
- `/consol_admin/:path*` — Memerlukan `bnc_admin_session` cookie (subroutes redirect ke `/consol_admin` jika belum auth)
- `/admin/:path*` — Memerlukan NextAuth session dengan role `admin`
- `/auth/login` — Redirect jika sudah login
- Legacy `/admin/scan` → redirect ke `/consol_admin/scan`

### Matcher
```typescript
export const config = {
  matcher: ["/admin/:path*", "/auth/login", "/consol_admin/:path*"],
};
```

---

## 📧 Email System

### Konfigurasi
```env
DEFAULT_EMAIL_USER_ADMIN=<gmail address>
DEFAULT_EMAIL_PASSWORD_ADMIN=<gmail app password>
```

### Flow
- Setelah pembayaran berhasil (Midtrans notification `settlement`/`capture`), sistem:
  1. Generate QR codes unik (20 char alphanumeric)
  2. Simpan ke Firestore `qr_detail`
  3. Sync ke Google Sheets
  4. Generate QR code images
  5. Kirim email HTML dengan QR code attachments (inline CID)

---

## 🗄️ Firebase Firestore Collections

| Collection | Deskripsi |
|---|---|
| `event` | Data event (nama, harga, kuota, tanggal, lokasi) |
| `qr_detail` | Detail tiket + QR code (nama, NIK, email, status scan) |
| `payment_status` | Status pembayaran (temporary, dihapus setelah QR dibuat) |
| `users` | User data (Google OAuth, role) |

---

## 🔄 Git Workflow

- Branch development: `tes2`
- Branch production: `main`
- Flow: commit di `tes2` → push → checkout `main` → merge `tes2` → push `main` → checkout `tes2`

---

## 📝 Riwayat Perubahan Penting

### 1. Dual-Path Admin Console Access
- Implementasi `/myticket` backdoor (email + NIK → admin session)
- Implementasi `/consol_admin` access code dengan rate limiting
- HMAC-SHA256 session tokens
- Edge-compatible middleware validator

### 2. QR Scanner Gate (`/consol_admin/scan`)
- Strict 1:1 square camera viewport dan qrbox
- Dihapus dependency pada Google OAuth untuk scanning
- Web Audio API beep sounds

### 3. Google Sheets Real-Time Sync
- `sendBuyerToGoogleSheets()` — kirim tiket baru
- `updateTicketScanInGoogleSheets()` — update kehadiran real-time
- Content-Type `text/plain` + `redirect: follow` untuk kompatibilitas Apps Script
- Upsert mechanism untuk mencegah duplikasi

### 4. Midtrans Sandbox Fix (Bug Kritis)
- **Bug**: Kunci Sandbox Midtrans dari dashboard **tidak diawali `SB-`**, tapi kode mendeteksi `isProduction` berdasarkan prefix `SB-`. Akibatnya kunci Sandbox dikirim ke server Production → 401 Unauthorized.
- **Fix**: Logika `isProduction` diubah agar mengutamakan env var `MIDTRANS_IS_PRODUCTION` daripada menebak dari prefix key.
- **Debug logging** ditambahkan di `tokenizer/route.ts` untuk menampilkan konfigurasi Midtrans dan detail error di console.

### 5. Midtrans Bypass Mode
- `NEXT_PUBLIC_BYPASS_MIDTRANS=true` → skip payment, langsung buat tiket
- Berguna untuk testing tanpa payment gateway

---

## ⚙️ Environment Variables Reference

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# App URLs
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Midtrans (Sandbox / Production)
MIDTRANS_MERCHANT_ID=M610745839
NEXT_PUBLIC_MIDTRANS_SNAP_URL=    # https://app.sandbox.midtrans.com/snap/snap.js ATAU https://app.midtrans.com/snap/snap.js
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false      # WAJIB: true untuk production, false untuk sandbox
NEXT_PUBLIC_BYPASS_MIDTRANS=false  # true = skip Midtrans API

# Google Sheets
GOOGLE_SHEETS_WEBHOOK_URL=

# Admin Auth
ADMIN_SECRET_EMAIL=admin@bnc.smasa.sch.id
ADMIN_SECRET_NIK=3519999999999999
ADMIN_ACCESS_CODE=BNC2026-ADMIN-PASS
ADMIN_SESSION_SECRET=

# Email
DEFAULT_EMAIL_USER_ADMIN=
DEFAULT_EMAIL_PASSWORD_ADMIN=
```

---

## 🚨 Known Issues & Gotchas

1. **Midtrans Sandbox keys mungkin TIDAK diawali `SB-`** — selalu gunakan `MIDTRANS_IS_PRODUCTION` env var
2. **Google Apps Script POST** — harus `text/plain` content type + `redirect: follow`, bukan `application/json`
3. **Middleware convention** — Next.js 16.3.1 menampilkan warning bahwa `middleware.ts` deprecated, diganti `proxy`. Belum dimigrasikan.
4. **Email template** — menggunakan inline HTML email dengan CID-embedded QR code images
5. **Rate limiting admin** — in-memory store, akan reset jika server restart
