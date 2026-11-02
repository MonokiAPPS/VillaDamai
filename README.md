# Villa Kamar — Kalender Reservasi

Aplikasi kalender reservasi untuk 1 villa dengan 4 kamar. Bisa dipublikasikan lewat GitHub Pages dan memakai Supabase agar semua admin melihat data yang sama.

## Menjalankan

1. Buat project gratis di Supabase.
2. Buka SQL Editor Supabase dan jalankan isi `supabase-schema.sql`.
3. Salin Project URL dan publishable key dari Supabase ke `config.js`.
4. Buka `index.html` untuk uji coba, atau unggah seluruh folder ini ke repository GitHub lalu aktifkan GitHub Pages.

Tanpa konfigurasi Supabase, aplikasi memakai `localStorage` di perangkat tersebut sebagai mode uji coba. Data lokal tidak terbagi ke admin lain.

## Catatan akses

Aplikasi sengaja tidak memakai PIN/login sesuai kebutuhan. Siapa pun yang memiliki alamat GitHub Pages dapat melihat, mengubah, atau membatalkan data. Jangan memasukkan data identitas sensitif tamu.


## Fitur laporan

- Kalender menampilkan centang hijau pada setiap tanggal kamar terisi.
- Klik centang untuk membuka detail reservasi.
- Tombol Laporan PDF menyediakan filter periode, rekap jumlah reservasi, total DP, dan unduhan PDF.

