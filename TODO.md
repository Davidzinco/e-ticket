# TODO e-ticket

Terakhir diperbarui: 19 Agustus 2026

## Selesai kemarin (18 Agustus 2026)

- [x] Upgrade dependency utama proyek.
- [x] Perbaiki konflik dependency NextAuth dan Nodemailer.
- [x] Rapikan konfigurasi TypeScript dan konfigurasi lokal.
- [x] Perbaiki inisialisasi Firebase Admin agar aman ketika environment belum lengkap.
- [x] Tambahkan fallback URL untuk pemanggilan API event di lingkungan lokal.
- [x] Cegah runtime error ketika environment variable belum lengkap.
- [x] Tambahkan `.env.example` sebagai template konfigurasi.
- [x] Pastikan `.env` tidak ikut masuk ke Git.

## Prioritas berikutnya

- [ ] Ganti Google Inter dengan font lokal agar build tidak bergantung pada koneksi ke `fonts.googleapis.com`.
- [ ] Migrasikan `images.domains` ke `images.remotePatterns` di `next.config.js`.
- [ ] Migrasikan konvensi `middleware` ke `proxy` sesuai Next.js 16.
- [ ] Jalankan ulang `npm run build` sampai berhasil tanpa error.
- [ ] Perbaiki script lint karena `next lint` tidak lagi tersedia di Next.js 16, lalu jalankan lint.
- [ ] Selaraskan versi `eslint-config-next` dengan versi Next.js yang digunakan.
- [ ] Tinjau kompatibilitas React 18 dengan `@types/react` dan `@types/react-dom` versi 19.
- [ ] Lengkapi seluruh kredensial pada `.env` lokal: Firebase, Google OAuth, Midtrans, NextAuth, dan email admin.
- [ ] Uji alur login Google dan pengiriman email autentikasi.
- [ ] Uji daftar event dan halaman detail event dengan data Firebase asli.
- [ ] Uji transaksi Midtrans sandbox, webhook notification, dan pembaruan status pembayaran.
- [ ] Uji pembuatan QR ticket serta proses scan/validasi ticket.
- [ ] Perbarui `README.md` dengan langkah setup, daftar environment variable, dan panduan menjalankan proyek.
- [ ] Lakukan smoke test end-to-end sebelum deployment.

## Catatan verifikasi

- `npm run build` pada 19 Agustus 2026 berhenti karena Inter dari Google Fonts tidak dapat diunduh.
- Next.js juga menampilkan peringatan deprecation untuk `images.domains` dan konvensi file `middleware`.
