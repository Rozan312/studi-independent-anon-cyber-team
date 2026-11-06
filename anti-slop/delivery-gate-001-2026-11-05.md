# antislop Delivery Gate 001 (5 Nov 2026)

Mode: DURING (dipilih pemilik di sesi ini). Arah desain: `DESIGN.md` (Security-Paper Record), dengan Antislop Record di bagian Overview.

**Design Read:** a self-paced learning app (mostly Operate and Read surfaces) for community members who study cybersecurity in long sessions on laptops and phones, in a "security-paper record" visual language. **Dial: ENERGY 1 / RHYTHM 2 / MOTION 2.**

## Apa yang diaudit dan diperbaiki

- Audit 5 lensa antislop (kejujuran/fungsi, teks + komentar kode, aksesibilitas, mobile, visual + performa), setiap temuan diuji verifikator yang mencoba membantahnya.
- Hasil: 41 temuan terkonfirmasi (semua diperbaiki), 7 arahan pemilik (alasannya ditulis di DESIGN.md), 11 dibantah.
- Pengukuran objektif: 27 rute x 2 tema (terang, malam) x 2 viewport (1440x900 desktop, 390x844 ponsel dengan emulasi sentuh) = 108 pemuatan halaman, dengan akun member demo dan admin lokal.

## Block 1: Hard Gate

| Rule | Status | Bukti |
| --- | --- | --- |
| R-02 em dash | PASS | grep U+2014 di app/, components/, lib/, DESIGN.md: 0 hasil. |
| R-03 mobile | PASS | 108 pemuatan: 0 overflow horizontal. Target sentuh di 390x844 (sentuh): 0 di bawah 44 px (tombol, field, select, link teks lewat area sentuh tak terlihat, toolbar editor, tab, chip itinerary). Tabel leaderboard/riwayat memindahkan kolom sekunder ke baris kedua sel pertama. Field 16 px di layar sentuh (iOS tidak zoom). |
| R-17 angka tanpa sumber | PASS | Semua angka dihitung dari database. Daftar contoh di halaman depan berlabel "Example". |
| R-18 testimoni | PASS | Tidak ada testimoni. |
| R-23 aset tanpa konfirmasi | PASS | Tidak ada logo, foto, atau statistik baru. Footer memakai teks footer halaman depan yang sudah ada. Avatar tanpa foto tetap inisial. |
| R-24 navigasi | PASS | Uji klik: 377 link (82 tujuan unik) dari semua rute, 0 berstatus 4xx/5xx atau anchor hilang. |
| R-25 kontras | PASS | Semua teks aktif >= 4,5:1 di kedua tema (pengukuran per elemen). Sisa angka rendah hanya pada kontrol nonaktif (Send reset link dan Save new password di mode auth lokal, Previous/Next question sebelum menjawab, Reset lab/Submit flag placeholder, Alt/Table di toolbar sebelum ada gambar/tabel terpilih), yang dikecualikan WCAG 1.4.3. Tepi field 3,14 sampai 3,62:1. |
| R-26 kontrol mati | PASS | Kontrol placeholder lab nonaktif dengan label terlihat dan komentar TODO di kode. Tidak ada link `#`/kosong. |
| R-27 state empty/loading/error | PASS | Garis loading antarhalaman (`components/ui/route-progress.tsx`, status "Loading page"), `app/error.tsx` (Try again + dashboard), `app/global-error.tsx`, `app/not-found.tsx`; tombol Move/Delete editor punya pending state; logo, cover, dan avatar punya fallback bila gambar gagal; pesan error server tidak lagi bocor mentah (`lib/errors.ts`). |
| R-28 FAQ | PASS | Tidak ada FAQ. |
| R-32 keyboard | PASS | Uji Tab nyata (12 langkah) di 20 rute: setiap fokus punya indikator terlihat. Drawer: Escape menutup dan fokus kembali ke Menu. Area tulis editor kini punya outline fokus. Tab materi tidak memotong outline. |
| R-33 patch via skrip | PASS | Semua perubahan source ditulis langsung di file sumbernya. `scripts/showcase/` hanya alat screenshot, bukan penambal UI. |
| R-34 kedua tema | PASS | 54 pemuatan tema malam: 0 overflow, kontras lolos, token `--line-input` didefinisikan untuk kedua tema; stabilo materi dan swatch warna editor terbaca di malam. |
| R-35 dijalankan dan diklik | PASS | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` lolos; 0 pesan console di 108 pemuatan. Rekaman klik di bawah. |
| R-36 klaim palsu | PASS | Status lab "Ready" palsu diganti "Not connected"; penghitung "lab sessions started" dan baris Adjustments kosong dihapus dari Profile. |
| R-37 arah desain | PASS | DESIGN.md ada; keputusan pemilik dicatat satu baris (border field 3:1, titik untuk hari kosong heatmap, nomor serial merah sebagai pengecualian). |
| R-38 konten nyata | PASS | Empty state tidak lagi menebak ("instructors are still preparing"). |
| R-39 semantik | PASS | 27 judul halaman unik; header/nav/main/footer di semua halaman; 0 heading loncat; 0 kontrol tanpa nama; kursor pointer/not-allowed di base CSS; animasi berhenti di reduced motion. Satu-satunya h1 ganda ada di editor room: Heading 1 milik materi di dalam kolom editor (`role="textbox"`), bukan struktur halaman. |
| R-40 performa | PASS | Cover path `fetchPriority="high"` tanpa lazy; logo shell tidak di-preload; semua `<img>` berdimensi; tidak ada skrip pihak ketiga di `<head>`; tidak ada angka performa yang dilaporkan tanpa diukur. |

### Rekaman klik (R-35)

- Unknown URL -> 404 "Page not found" dengan link ke /dashboard dan /learning-paths.
- /login dan /register kosong -> pesan validasi ("Enter your username.", "Enter your full name (at least 2 characters).").
- Night mode di rail -> tema berganti dan bertahan antarhalaman -> kembali terang.
- Collapse rail 256 -> 76 px; Expand 76 -> 256 px.
- Tab room Material/Tasks/Quiz -> anchor #material/#tasks/#quiz ada.
- Jawaban task kosong -> "Enter an answer first."
- Quiz: memilih jawaban mengaktifkan Next question.
- Ponsel: Menu membuka drawer (fokus di dalam); Escape menutup (inert, fokus kembali ke Menu); toggle malam di bar atas berganti tema.
- Sign out -> /login.

## Block 2: Purpose-Gate

| Rule | Status | Alasan tertulis |
| --- | --- | --- |
| R-01 gradasi | PASS | Iris hanya di rail, drawer, hero, panel auth (DESIGN.md Antislop Record). |
| R-04 ikon | PASS | SVG inline buatan sendiri, satu ketebalan, selalu bersama label. |
| R-06 tipografi | PASS | Archivo (sumbu lebar untuk label), label kapital hanya untuk data, JetBrains Mono hanya kode dan string mesin. |
| R-07 latar pola | PASS | Grid titik dan sirkuit atas permintaan pemilik, hanya di permukaan navigasi/masuk. |
| R-08 panah | PASS | Hanya arah: maju di Resume/Next, mundur di Back to room. |
| R-09 badge | PASS | Tidak ada badge kapsul dekoratif; pill/tag membawa status nyata. |
| R-10 glassmorphism | PASS | Hanya backdrop blur bar atas ponsel. |
| R-12 bayangan | PASS | Sheet, lift (drawer), cyan whisper (tombol utama). |
| R-13 glow | PASS | Tidak ada glow. |
| R-14 kartu | PASS | Ukuran sheet mengikuti isi; sel angka sengaja seragam sebagai tabel. |
| R-19 animasi | PASS | Setiap gerak punya tujuan tertulis; MOTION 2 tanpa scroll reveal; mati di reduced motion. |
| R-22 ilustrasi | PASS | Tidak ada ilustrasi generik. |

## Block 3: Liveliness

| Pertanyaan | Jawaban | Bukti |
| --- | --- | --- |
| Dial ditetapkan | Ya | ENERGY 1 / RHYTHM 2 / MOTION 2 di DESIGN.md. |
| Hasil sesuai dial | Ya | Halaman kerja memakai satu tata sheet; jeda ritme di Continue sheet, header path, hero. |
| Satu fokus per layar | Ya | Continue sheet, cincin path, materi, soal aktif. |
| Whitespace struktural | Ya | Grid 20 px antar sheet, 28 px setelah judul. |
| Satu aksen | Ya | Cyan logo hanya untuk langkah berikutnya; tombol submit kini default sekunder, sakelar malam tidak lagi cyan. |
| Motif identitas | Ya | Cetak security-paper digital + penanda selesai langsung; titik hari kosong di heatmap menggemakan grid titik. |
| Design Read dinyatakan | Ya | Di atas dan di DESIGN.md. |

## Block 4: Craftsmanship & Quality Locks

| Rule | Status | Bukti |
| --- | --- | --- |
| C-1 intensionalitas | PASS | Setiap teknik punya alasan satu baris di DESIGN.md. |
| C-2 kelengkapan fungsi | PASS | Pengumuman dashboard tampil utuh; tidak ada kontrol tanpa aksi. |
| C-3 komposisi berbasis konten | PASS | Penghitung fitur yang tidak ada dihapus. |
| C-4 ketahanan | PASS | Kedua tema, kedua viewport, keyboard, state error/404/loading; dashboard/profil tidak terjepit di 1024 sampai 1180 px (kolom samping mulai xl). |
| C-5 bukti, bukan klaim | PASS | Status lab jujur. |
| R-05 layout template | PASS | Langkah "How a room works" berisi 4 langkah nyata, bukan template 3 ikon. |
| R-11 radius | PASS | Skala radius DESIGN.md. |
| R-15 CTA | PASS | grep "Get started/Learn more/Try now/Explore/Discover": 0. |
| R-16 buzzword | PASS | grep seamless/powerful/ultimate dll.: 0. |
| R-20 identitas | PASS | Security-paper record, motif digital, penanda selesai. |
| R-21 tema | PASS | Terang bawaan + toggle malam yang berfungsi. |
| R-29 palet | PASS | Netral + satu aksen + empat warna status, masing-masing satu arti (aturan diperbarui, pengecualian serial tertulis). |
| R-30 klon | PASS | Bukan tiruan produk populer. |
| R-31 alasan tertulis | PASS | Antislop Record di DESIGN.md. |

## Sisa yang diketahui (tidak memblokir gate)

- Di perangkat sentuh, select font di toolbar editor memotong nama panjang ("Times New Roman") saat tertutup; daftar pilihan native tetap menampilkan nama lengkap.
- Placeholder toolbar editor bisa bergeser sekali saat editor dimuat di tablet sentuh >= 640 px.
- Area sentuh pegangan resize gambar di editor aktif walau pegangan belum terlihat.
- Rute JSON `app/api/auth/*` kini menjawab "Unexpected error." untuk pesan Supabase teknis (UI memakai server action yang memetakan pesan dengan benar).
- Data demo showcase dibuat 21 Oktober, jadi streak akun demo sekarang 0; jalankan ulang `npm run seed:showcase` sebelum mengambil screenshot baru.
