# Showcase: screenshot untuk banner

Bahan visual platform untuk materi promosi komunitas (misalnya banner "benefit anggota ACT").
Semua gambar diambil dari aplikasi lokal dengan **data demo**, bukan data anggota asli.

| Folder | Isi |
| --- | --- |
| `screens/` | Screenshot mentah 2× (desktop 1440×900 → 2880×1800, ponsel 390×844 → 780×1688), gelap (`night`, bawaan aplikasi) dan terang (`light`). Akhiran `-full` = satu halaman penuh. |
| `framed/` | Screenshot yang sama dalam bingkai browser atau ponsel, PNG latar transparan, siap ditempel di desain. |
| `banner/` | Contoh kolase 3200×1680 (desktop + ponsel di atas latar warna merek) sebagai titik awal desainer. |

Gambar PNG tidak di-commit (lihat `.gitignore`) karena ukurannya besar dan bisa dibuat ulang kapan saja.

Saran untuk banner: `dashboard`, `progress` (heatmap aktivitas), `room` (materi), dan `leaderboard`.
Halaman lab masih placeholder ("Labs aren't connected yet"), jadi sebaiknya tidak ditonjolkan.

## Membuat ulang

1. Jalankan database lokal dan dev server (`npm run dev`) dengan login lokal aktif.
2. Isi data demo (8 anggota contoh, akun utama `nadia`):

   ```bash
   npm run seed:showcase
   ```

3. Ambil screenshot (Google Chrome terpasang; password apa saja yang lolos validasi form, login lokal tidak memeriksanya):

   ```bash
   node scripts/showcase/capture.mjs docs/showcase/screens nadia <password-uji> scripts/showcase/shots.json
   ```

4. Buat bingkai dan kolase (butuh Python 3 + Pillow):

   ```bash
   python3 scripts/showcase/compose.py docs/showcase/screens docs/showcase
   ```

5. Hapus data demo setelah selesai:

   ```bash
   npm run seed:showcase:remove
   ```

Daftar halaman, ukuran, dan tema ada di `scripts/showcase/shots.json`. Variabel `SHOWCASE_BASE_URL` dan `CHROME_PATH` bisa dipakai bila dev server atau Chrome berada di tempat lain.
Seed demo menolak berjalan bila `DATABASE_URL` bukan `localhost`.
