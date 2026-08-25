Side Question: apkakah alat untuk scan qr jika kita buat di web dan menggunakan hp untuk scan itu akan memberatkan server dan bisa mengalami penurunan kecepatan scan

Secara umum: **Tidak memberatkan server secara signifikan dan tidak akan menurunkan kecepatan scan gambar**, asalkan arsitekturnya tepat. 

Berikut penjelasan detail dan teknisnya:

---

### 1. Di Mana Proses Scan Kamera Berjalan? (Client-Side)
* **Kamera & Pemrosesan Gambar (100% di HP)**:
  Saat HP panitia membuka scanner web (menggunakan library seperti `html5-qrcode` yang ada di proyek ini), proses pembacaan feed kamera dan penerjemahan gambar menjadi string teks kode QR dilakukan **sepenuhnya oleh prosesor HP (Client-Side)** melalui browser.
* **Server Tidak Menerima Video/Gambar**: HP **tidak** mengirimkan aliran video atau foto ke server, melainkan hanya membaca QR di layar HP sendiri. Karena itu, server sama sekali tidak terbebani oleh proses kamera.

---

### 2. Kapan Server Bekerja? (Hanya Saat Kode Terbaca)
Server hanya bekerja **sekali** setiap kali sebuah kode QR berhasil terbaca:
* HP hanya mengirim satu permintaan teks ringan (misalnya: `GET /api/qr?qrCode=BNC123...` berukuran hanya beberapa *bytes*).
* Server hanya melakukan:
  1. Mencari dokumen tiket di database Firestore (kueri cepat berbasis indeks).
  2. Mengecek apakah statusnya sudah `isScanned: true` atau belum.
  3. Memperbarui status menjadi `isScanned: true` dan mencatat waktu scan.
* Response balik ke HP juga berupa teks JSON sangat kecil (di bawah 1 KB).

---

### 3. Apa yang Bisa Menyebabkan Penurunan Kecepatan & Solusinya?

| Penyebab Potensial | Dampak | Solusi Terbaik |
| :--- | :--- | :--- |
| **Koneksi Internet Lemah di Gate** | Respon server terasa *delay* 1–3 detik setelah scan. | Pastikan HP panitia terhubung ke Wi-Fi dedicated/stabil atau jaringan 4G/5G yang lancar di pintu masuk. |
| **Kualitas Kamera HP / Pencahayaan** | Kamera HP lambat mengenali QR di layar HP pengunjung. | Panitia menyalakan *flash* HP jika area gelap, atau minta pengunjung menaikkan kecerahan layar HP mereka. |
| **Double Request (Debounce)** | Kamera HP membaca QR yang sama berkali-kali dalam 1 detik. | Beri jeda (*debounce/pause*) pada scanner selama 2–3 detik setelah berhasil membaca 1 tiket sebelum kamera aktif kembali. |
| **Banyak Panitia Scan Bersamaan** | Ratusan tiket di-scan dalam waktu berdekatan. | Database Firestore sangat mampu menangani ribuan *concurrent read/write* per detik, sehingga beban server tetap sangat aman. |

---

### 💡 Kesimpulan
Menggunakan web scanner di HP untuk validasi tiket **sangat aman, efisien, dan tidak akan membebani server**. Kunci kelancaran saat hari H di pintu masuk adalah **koneksi internet panitia yang stabil** dan **pencahayaan yang cukup** saat memindai tiket pengunjung.