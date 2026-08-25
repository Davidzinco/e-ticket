# TODO e-ticket

Terakhir diperbarui: 25 Agustus 2026

## Selesai
- [x] Perbaiki bug halaman beranda "Gagal Memuat Acara" dengan Admin SDK data fetching & graceful event fallback.
- [x] Integrasikan halaman `/success` dengan data tiket asli dari database Firestore berdasarkan `order_id`.
- [x] Buat endpoint `GET /api/tickets/by-order` dengan serialisasi timestamp dan verifikasi transaksi.
- [x] Buat komponen reusable `TicketCard` dengan QR generator asli dan tombol download per tiket.
- [x] Sediakan 6 handling state di `/success`: Loading, Success (Tiket Asli), Processing/Webhook Polling, Pending, Failed, Not Found.
- [x] Simpan otomatis kredensial pembeli ke `localStorage` (`bnc_saved_ticket_auth`) untuk akses instan di `/myticket`.
- [x] Implementasi integrasi pencatatan pembeli ke Google Sheets dengan checkbox kehadiran.
- [x] Migrasikan `images.domains` ke `images.remotePatterns` di `next.config.js`.
- [x] Verifikasi TypeScript (`npx tsc --noEmit`) dan tes build produksi (`npm run build`) dengan status 100% SUKSES (0 error).
