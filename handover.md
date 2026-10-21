# Handover Website Anon Cyber Team

Tanggal peninjauan kode: 16 September 2026.

Untuk memahami alur internal sebelum mengubah kode, baca [Handover Arsitektur untuk Developer dan AI](docs/ARCHITECTURE-HANDOVER.md). Dokumen tersebut mencakup alur request, autentikasi, relasi data, aturan progress/poin, kontrak API, dan batasan implementasi.

Dokumen ini adalah panduan serah terima untuk developer/kolaborator berdasarkan kode repository, bukan hasil pengujian runtime pada tanggal di atas. Dokumentasi lama ada di `docs/HANDOVER.md`; gunakan dokumen ini untuk setup dan penjelasan akun lokal yang diperbarui.

## 1. Identitas dan Tujuan

- Nama proyek: Studi Independent Anon Cyber Team.
- Tampilan produk: Anon Cyber Team, platform pembelajaran cybersecurity dengan tampilan terang "Security Paper & Stamps" (lihat bagian 14 dan `DESIGN.md`). Seluruh teks UI berbahasa Inggris.
- Repository: https://github.com/Rozan312/studi-independent-anon-cyber-team
- Folder pada Mac pemilik: `/Users/macbook/studi-independent-anon-cyber-team`.
- Website lokal: http://localhost:3000
- Tujuan: menyediakan learning path, room, tugas, kuis, progress, leaderboard, dan pengelolaan pembelajaran berdasarkan role.
- Status: fondasi aplikasi plus ekosistem konten (authoring path/room/task/quiz dengan editor materi visual, upload media, jadwal room, profil student) yang berjalan di lingkungan lokal. Belum boleh dianggap siap produksi tanpa validasi autentikasi, deployment, dan pengujian lanjutan. Ringkasan pekerjaan terakhir ada di bagian 12.
- Pembaruan terakhir: 21 Oktober 2026 (redesign UI dan bahasa Inggris, lihat bagian 14; editor materi visual, bagian 13).

## 2. Teknologi dan Arsitektur

Versi berikut mengikuti rentang dependency di `package.json`; versi instalasi ditentukan oleh `package-lock.json`.

| Komponen | Teknologi |
| --- | --- |
| Framework | Next.js 14.2, App Router |
| UI | React 18, Tailwind CSS 3 |
| Bahasa | TypeScript 5 |
| Database | PostgreSQL 16 lokal melalui Docker Compose |
| ORM | Prisma 6 |
| Auth | Supabase Auth atau mode development lokal |
| Validasi | Zod 3 |
| Materi | Editor visual TipTap 3 (seperti pengolah kata), disimpan sebagai HTML tersanitasi (sanitize-html); materi lama Markdown dikonversi dengan unified/remark |
| Media upload | Disk lokal `storage/uploads` (provider `lib/storage/local-storage.ts`), metadata di tabel `MediaAsset` |
| Pengujian service | tsx dan Node assert |

Alur utama: halaman/komponen -> Server Actions atau API Route Handlers -> service server-only -> Prisma -> PostgreSQL. Middleware dan guard server mengatur akses; role tidak cukup dibatasi dari menu frontend.

Dalam mode Supabase, identitas berasal dari Supabase Auth dan `Profile.id` mengikuti UUID user autentikasi. Mode lokal menggunakan profil database dan cookie development, tanpa pemeriksaan password asli.

## 3. Fitur dan Halaman

| Area | Route utama | Fungsi |
| --- | --- | --- |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` | Login, pendaftaran, dan alur recovery |
| Dashboard | `/dashboard` | Ringkasan pembelajaran |
| Learning paths | `/learning-paths`, `/learning-paths/[slug]` | Jalur pembelajaran dan room |
| Publik | `/` | Halaman depan: identitas komunitas, cara kerja room, contoh paspor belajar, tombol Sign in dan Create account |
| Rooms | `/rooms`, `/rooms/[slug]` | Materi (HTML editor visual atau Markdown lama), pengiriman jawaban tugas dengan hint bertahap, status penyelesaian room |
| Kuis | `/rooms/[slug]/quiz` | Submit jawaban, skor, pembahasan per pertanyaan, dan retake |
| Lab | `/rooms/[slug]/lab` | Workspace/status lab placeholder |
| Progress | `/progress` | Progress peserta |
| Leaderboard | `/leaderboard` | Ranking poin |
| Instruktur | `/instructor`, `/instructor/classes`, `/instructor/students` | Ringkasan kelas dan peserta |
| Profile | `/profile` | Identitas akun dan rekam jejak: poin, rank, streak, riwayat task dan quiz, progress room |
| Learning Path Manager | `/instructor/paths`, `/instructor/paths/[id]` | Membuat, mengedit, dan publish learning path; menyusun modul: memasukkan room yang sudah ada, mengurutkan room, dan membuat room baru di path itu |
| Room builder dan editor | `/instructor/rooms`, `/instructor/rooms/new`, `/instructor/rooms/[id]` | Membuat room, lalu mengelola metadata, materi dengan editor visual (font, ukuran, warna, stabilo, perataan, daftar, tabel, link, gambar), task, quiz, dan publish |
| Admin | `/admin`, `/admin/users`, `/admin/platform`, `/admin/announcements` | Ringkasan platform, ubah role, kelola pengumuman |

Role: `STUDENT`, `INSTRUCTOR`, `ADMIN`, dengan hierarki akses admin di atas instruktur dan student. Akun baru default ke student.

Kerangka halaman ada di `components/app-shell.tsx` (server component: mengambil profil untuk kartu anggota) dan `components/app-shell-frame.tsx` (client: rail kiri, drawer mobile). Tombol Collapse ada di bagian bawah rail desktop; preferensinya disimpan di localStorage dengan key `si-act-sidebar-collapsed`. Di layar kecil, tombol Menu membuka drawer yang memindahkan fokus keyboard ke dalamnya dan mengembalikannya saat ditutup.

## 4. Setup Kolaborator Baru

Prasyarat: Git, Node.js/npm yang kompatibel dengan dependency proyek, serta Docker Desktop dengan Compose. Repository belum menetapkan versi Node melalui field `engines`; sepakati versi Node tim sebelum memperbarui dependency.

```bash
git clone https://github.com/Rozan312/studi-independent-anon-cyber-team.git
cd studi-independent-anon-cyber-team
npm ci
cp .env.example .env
```

Isi `.env` untuk development lokal:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/si_act
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/si_act
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder
SUPABASE_SERVICE_ROLE_KEY=local-placeholder
```

Alamat Supabase di atas hanya placeholder; Compose proyek ini hanya menjalankan PostgreSQL, bukan Supabase. Kredensial PostgreSQL di atas adalah default development dari Compose.

Jalankan Docker Desktop, lalu:

```bash
docker compose up -d
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Buka http://localhost:3000/login. Untuk database lama yang sudah pernah di-seed sebelum 16 September 2026, jalankan juga `npm run prisma:backfill-content` (non-destruktif) agar materi dan hint room seed terisi. `prisma migrate deploy` menerapkan migration yang sudah ada. Saat mengubah schema dalam development, gunakan `npm run prisma:migrate` dan commit migration yang dihasilkan.

**Seed hanya untuk database latihan.** Script menghapus dan membuat ulang tugas/kuis pada room seed. Relasi cascade dapat menghapus submission dan attempt terkait; seed juga memperbarui contoh progress dan menambah lab session. Jangan jalankan ulang pada data penting tanpa backup.

## 5. Akun dan Login Lokal

Mode `AUTH_MODE=local` menerima username dan password sepanjang 8-128 karakter, misalnya `password123`. Password hanya divalidasi bentuk/panjangnya, tidak disimpan atau dicocokkan sebagai kredensial. Cookie sesi tidak ditandatangani. Mode ini khusus development tepercaya, bukan autentikasi produksi.

Login lokal mencari profil melalui email yang dibentuk dari username, yaitu `username@local.dev`. Jika belum ada, login membuat profil student baru dengan username sebagai nama awal. Sejak 21 Oktober 2026 login tidak lagi menimpa nama lengkap profil yang sudah ada (sebelumnya setiap login mengganti nama lengkap dengan username); nama yang terlanjur tertimpa perlu diisi ulang lewat Prisma Studio.

Profil contoh di seed:

| Username seed | Email seed | Role seed |
| --- | --- | --- |
| `rozaan` | `student@example.local` | STUDENT |
| `anon-instructor` | `instructor@example.local` | INSTRUCTOR |
| `platform-admin` | `admin@example.local` | ADMIN |

**Username seed tidak otomatis masuk ke profil seed melalui login lokal**, karena email pencarian berbeda. Login memakai username tersebut dapat membuat profil student baru dengan suffix username karena bentrok. Profil seed juga bukan akun Supabase Auth.

Cara menyiapkan akun lokal yang jelas:

1. Login/register dengan username baru, misalnya `instruktur_local` atau `admin_local`, dan password contoh di atas.
2. Jalankan `npm run prisma:studio`.
3. Buka model `Profile`, cari `instruktur_local@local.dev` atau `admin_local@local.dev`.
4. Ubah `role` menjadi `INSTRUCTOR` atau `ADMIN` sesuai kebutuhan.
5. Logout dan login kembali agar role cookie diperbarui.

Nama akun tersebut adalah contoh setup, bukan jaminan bahwa akun sudah ada di database kolaborator. Student dapat memakai username baru tanpa promosi role. Recovery password lokal tidak mengirim email atau mengubah kredensial asli.

## 6. Menyalakan dan Mematikan

Dari folder proyek, untuk penggunaan rutin setelah setup:

```bash
docker compose up -d
npm run dev
```

Database: container `si-act-postgres`, port host `54322`, database `si_act`. Data disimpan dalam named volume `si_act_postgres_data` milik Compose.

Untuk mematikan, tekan `Ctrl+C` pada terminal dev server, lalu:

```bash
docker compose down
```

Perintah tersebut mempertahankan volume database. Jangan tambahkan `-v` kecuali memang ingin menghapus data. Docker Desktop tetap terbuka; pilih Quit Docker Desktop jika engine juga perlu dimatikan.

Pemeriksaan layanan:

```bash
docker compose ps
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:54322 -sTCP:LISTEN
```

Jika terminal web hilang, identifikasi PID listener port 3000 dan hentikan hanya proses proyek tersebut dengan `kill <PID>`. Status hidup/mati layanan harus dicek langsung; dokumen ini tidak menetapkan status runtime.

## 7. Peta Kode dan Database

| Lokasi | Tanggung jawab |
| --- | --- |
| `app/` | Halaman App Router |
| `app/api/` | Endpoint auth, profile, learning, lab, instructor, admin |
| `components/` | UI, form, brand, sidebar |
| `app/globals.css` | Styling global |
| `lib/actions/` | Server Actions auth, learning, instructor, admin |
| `lib/services/` | Logika bisnis dan operasi database; `content-service.ts` untuk authoring path/room/task/quiz dengan aturan kepemilikan, `media-service.ts` untuk upload gambar |
| `lib/storage/` | Provider penyimpanan file upload (saat ini disk lokal, dapat diganti) |
| `app/api/media/` | Upload (POST, instruktur/admin) dan penyajian berkas media (GET, user login) |
| `storage/uploads/` | Berkas gambar hasil upload; di-ignore git, backup terpisah dari database |
| `lib/validation/` | Schema Zod |
| `lib/auth/` | Guard, RBAC, sesi lokal |
| `lib/supabase/` | Client/server/admin Supabase helpers |
| `lib/db/prisma.ts` | Prisma client server-only |
| `middleware.ts` | Proteksi route dan redirect |
| `prisma/schema.prisma` | Model, enum, relasi database |
| `prisma/migrations/` | Riwayat perubahan schema |
| `prisma/seed.ts` | Data demo |
| `tests/service-smoke.test.ts` | Smoke test service berbasis database |

Kelompok model: identitas (`Profile`); materi (`LearningPath`, `Room`, `RoomTask`, `MediaAsset`); kuis (`Quiz`, `QuizQuestion`, `QuizOption`); hasil (`UserRoomProgress`, `UserTaskSubmission`, `UserQuizAttempt`); kelas (`Class`, `ClassMember`); pengumuman/poin/lab (`Announcement`, `LeaderboardPoint`, `LabSession`).

Endpoint inti berada pada `/api/profile`, `/api/learning-paths`, `/api/rooms`, `/api/tasks/submit`, `/api/quizzes/submit`, `/api/leaderboard`, dan `/api/lab-sessions`. Endpoint pengelolaan berada di `/api/instructor/*` dan `/api/admin/*`. Periksa handler terkait untuk metode HTTP, validasi, dan role yang tepat sebelum membuat integrasi.

## 8. Verifikasi Perubahan

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` memerlukan database yang sudah dimigrasikan; test membuat data sementara lalu membersihkannya. Cakupannya meliputi RBAC, jawaban tugas, progress, skor kuis, dan poin leaderboard, bukan browser end-to-end.

Hentikan dev server sebelum build karena keduanya memakai `.next`. Untuk menjalankan hasil build gunakan `npm start`. Pada penulisan handover ini, pengujian aplikasi/build tidak dijalankan ulang dan layanan tidak dinyalakan.

Pemeriksaan manual sebelum merge: login/logout; akses student ditolak ke admin; submit tugas; kuis dan retake; role update; create/publish room; pengumuman; sidebar desktop dan navigasi mobile.

## 9. Batasan dan Prioritas Lanjutan

- Lab hanya menyimpan status placeholder; tidak menyalakan VM, VPN, atau container latihan sungguhan.
- Mode lokal tidak aman untuk deployment publik. Supabase perlu dikonfigurasi dan diuji sebelum produksi.
- Seed email dan pencarian login lokal belum selaras; pertimbangkan penyelarasan terpisah dengan test regresi.
- Editor room (materi, task, quiz) dan Learning Path Manager sudah ada; pengujian browser end-to-end otomatis belum ada.
- Progress room memakai satu aturan: semua task benar dan quiz lulus (jika ada). Untuk database yang sudah berisi data, jalankan `npm run prisma:backfill-content` sekali agar materi room seed terisi, hint task terisi, dan progress lama dihitung ulang.
- Task mendukung jawaban alternatif dan hint yang terbuka setelah dua percobaan salah; quiz menampilkan pembahasan per pertanyaan setelah submit.
- Navigasi mobile memakai tombol Menu di bar atas yang membuka drawer; rail tetap hanya di layar lebar.
- Jadwal kemunculan room: `Room.availableFrom` dan `Room.availableUntil` (opsional). Room published tanpa jadwal selalu tersedia. Di luar jendela, room tetap tampil dengan cap status "Opens ..." atau "Closed" (waktu ditulis dengan zona, misalnya "21 Oct 2026, 19:30 WIB") dan server menolak submit task, quiz, dan lab session; instruktur/admin tetap bisa preview. Zona waktu tampilan mengikuti `NEXT_PUBLIC_TIME_ZONE` (default `Asia/Jakarta`).
- Gambar cover learning path dan room diunggah dari editor masing-masing dan tampil di kartu daftar path, daftar room, detail path, hero room, dan dashboard.
- Kepemilikan konten: `Room.createdById` dan `LearningPath.createdById` mencatat pembuat. Instruktur hanya dapat mengubah konten miliknya atau konten lama tanpa pemilik (seed); admin dapat mengubah semua. Konten seed dapat diberi pemilik lewat Prisma Studio bila ingin dikunci.
- Upload media tersimpan di disk server (`storage/uploads`, atau `UPLOAD_DIR`). Untuk deployment multi-instance atau serverless, ganti provider di `lib/storage/` ke object storage sebelum rilis.
- Menghapus task lewat editor ikut menghapus riwayat jawaban peserta untuk task itu (cascade); poin yang sudah diberikan tidak ditarik.
- Badge dan sertifikat belum diimplementasikan.
- UI tidak lagi memakai gambar eksternal. Path/room tanpa cover memakai emblem rosette yang dibuat dari slug.
- Audit dependency dan validasi akses per resource diperlukan sebelum rilis; status keamanan dependency tidak diperiksa dalam tugas dokumentasi ini.

## 10. Deployment dan Kolaborasi

Untuk deployment dengan Supabase: set `AUTH_MODE=supabase`, isi URL/key Supabase dan koneksi PostgreSQL sebenarnya, atur URL aplikasi dan redirect auth, terapkan migration melalui `npx prisma migrate deploy`, lalu build. Jangan menjalankan seed demo otomatis pada produksi.

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan server-side. Jangan commit `.env`, token GitHub, password produksi, atau dump database. Middleware Supabase membaca `Profile`; jika memakai RLS, pastikan kebijakan membaca profil sendiri dan seluruh alur role diuji. Setup email confirmation dan password reset juga harus diverifikasi end-to-end.

Alur kolaborasi yang disarankan: undang collaborator melalui pengaturan repository GitHub, clone dengan akun masing-masing, buat branch fitur, commit perubahan terfokus, dan ajukan pull request ke `main`. Jangan berbagi personal access token. Commit migration bersama perubahan schema; kirim konfigurasi rahasia melalui kanal terpisah.

## 11. Troubleshooting

| Gejala | Pemeriksaan/tindakan |
| --- | --- |
| Docker daemon tidak tersedia | Buka Docker Desktop, tunggu engine siap, ulangi Compose |
| Login gagal karena database | Cek Compose, port 54322, koneksi `.env`, dan migration |
| Instruktur masuk sebagai student | Cari profil berdasarkan email `username@local.dev`, perbaiki role, login ulang |
| Port 3000 terpakai | Identifikasi proses atau gunakan `npm run dev -- --port 3001`; sesuaikan URL aplikasi |
| CSS/JS 404 setelah build/dev | Hentikan proses Next proyek, hapus cache `.next` saja, lalu mulai ulang |
| Prisma client tidak sesuai schema | Jalankan `npm run prisma:generate` dan cek migration |
| Data latihan berubah setelah seed | Seed mengganti tugas/kuis; pulihkan backup jika data perlu dikembalikan |

Referensi tambahan: `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SECURITY.md`. Untuk perilaku aktual, utamakan kode dan schema dibanding catatan historis.

## 12. Ringkasan Pekerjaan 16 September 2026

Semua butir di bawah sudah ada di kode, diuji manual di browser lokal (desktop dan ukuran ponsel), dan lolos `npm run typecheck`, `npm run lint`, `npm test`, serta `npm run build` pada saat penulisan. Detail teknis per fitur ada di `docs/ARCHITECTURE-HANDOVER.md` bagian 11 sampai 13.

### Perbaikan kecil awal

- Dashboard menampilkan banner saat `?error=forbidden`; halaman login menampilkan pesan untuk `missing-profile`, `registered`, `reset=sent`, `password=updated`, dan tujuan `next`.
- Login dan register lokal menghormati parameter `next` dengan validasi path relatif (`lib/auth/safe-redirect.ts`).
- Label format jawaban task dibuat jujur (penilaian berbasis teks); dua task seed yang berlabel pilihan ganda diubah ke `TEXT` dengan pilihan tertulis di deskripsi.
- Streak dan rank di dashboard dihitung dari data nyata; halaman Platform Statistics memakai ringkasan lab session nyata, bukan mock VM.
- Label "Locked" pada timeline dashboard diganti "Not started".

### Ekosistem konten untuk instruktur dan admin

- Learning Path Manager (`/instructor/paths`, `/instructor/paths/[id]`): buat, edit, cover, publish, dan komposisi modul (memasukkan room yang sudah ada, mengurutkan, membuat room baru di path itu).
- Editor room (`/instructor/rooms/[id]`): metadata dengan cover dan jadwal kemunculan; materi dengan editor visual (lihat bagian 13); task dengan jawaban alternatif dan hint serta pengurutan; quiz dengan pertanyaan dan opsi; publish. Room Builder mengarahkan ke editor setelah menyimpan.
- Upload media: `POST /api/media` dan `GET /api/media/[id]`, penyimpanan disk lokal `storage/uploads` lewat provider `lib/storage/local-storage.ts`, metadata di tabel `MediaAsset`.
- Kepemilikan konten: `Room.createdById` dan `LearningPath.createdById`; instruktur hanya mengubah miliknya atau konten tanpa pemilik, admin bebas.
- Cover tampil di daftar learning path, detail path, daftar room, hero room, dan dashboard.

### Pengalaman belajar student

- Navigasi mobile: tombol Menu di header membuka drawer dengan semua menu dan logout.
- Profile (`/profile`): poin per sumber, rank, streak, riwayat task, riwayat quiz dengan skor, progress room.
- Review quiz per pertanyaan setelah submit: jawaban peserta, jawaban benar, penjelasan.
- Hint task terbuka setelah dua percobaan salah; jawaban alternatif diterima; pesan salah menyebut nomor percobaan.
- Satu aturan penyelesaian room: semua task benar dan quiz lulus (jika ada), dihitung `lib/services/progress-service.ts`.
- Materi Markdown untuk 10 room seed dan 20 hint task (`prisma/seed-content.ts`), diterapkan ke database lama lewat `npm run prisma:backfill-content`.
- Jadwal kemunculan room: badge "Dibuka ..." atau "Ditutup sejak ...", halaman terkunci untuk student, penolakan submit di server, preview untuk instruktur dan admin.

### Perubahan teknis

- Migration baru: `20260916032324_content_authoring_and_media`, `20260916032645_quiz_option_order`, `20260916035755_task_hints_and_accepted_answers`, `20260916041212_room_availability_window`.
- Dependency baru: `remark-gfm` (react-markdown sempat dipakai lalu diganti editor visual pada 21 Oktober 2026, lihat bagian 13).
- Script baru: `npm run prisma:backfill-content` (non-destruktif).
- Variabel opsional: `UPLOAD_DIR` (folder upload), `NEXT_PUBLIC_TIME_ZONE` (zona waktu tampilan jadwal, default `Asia/Jakarta`).
- `PATCH /api/rooms` kini hanya menerima `roomId` dan menghitung ulang progress; persentase dari client tidak diterima.
- Bug laten yang diperbaiki: menyimpan form informasi room tidak lagi mengosongkan materi.
- Smoke test diperluas: kepemilikan, task/quiz authoring, urutan opsi, aturan progress, hint, jawaban alternatif, review quiz, jadwal room, komposisi path.
- `.claude/launch.json` berisi konfigurasi menjalankan dev server dari Claude Code; opsional dan tidak memengaruhi aplikasi.

### Data lokal saat penulisan

- Akun uji: `admin_local` (ADMIN), `instruktur_local` (INSTRUCTOR), `rozan` (STUDENT); password mode lokal bebas 8-128 karakter.
- Path contoh "Threat Hunting Basics" (dengan cover) berisi room "Hypothesis Driven Hunting" yang dijadwalkan dibuka 17 September 2026 pukul 09.00 WIB. Matikan centang jadwal di editor room bila ingin dibuka segera.
- Media hasil upload ada di `storage/uploads` (di luar git). Backup folder ini bersama database bila data ingin dipertahankan.

### Belum dikerjakan (prioritas menengah dari review)

1. Kelas dan rekam jejak instruktur: UI membuat kelas dan memasukkan student, halaman detail per student, statistik per room.
2. Lab terpandu: instruksi langkah demi langkah, unggah bukti, penilaian manual oleh instruktur; tombol lab saat ini masih placeholder.
3. Tipe task pilihan ganda dengan opsi sungguhan.
4. Diskusi atau tanya jawab per room.
5. ~~Konsistensi bahasa UI dan penghapusan elemen dekoratif tanpa fungsi~~ (selesai 21 Oktober 2026, bagian 14).
6. ~~Ukuran teks dan kontras label kecil~~ (selesai 21 Oktober 2026, bagian 14).
7. Autosave draft materi, preview room draft, pustaka media untuk hapus atau pakai ulang gambar.
8. Badge dan sertifikat per path.
9. Sebelum publik: Supabase Auth, pembatasan laju submit, unique constraint dan transaksi poin, object storage untuk media, tes browser otomatis, Compose untuk aplikasi.

## 13. Editor Materi Visual (21 Oktober 2026)

Editor materi room di `/instructor/rooms/[id]` bagian **Materi** kini editor visual seperti pengolah kata (TipTap 3), menggantikan textarea Markdown.

- **Toolbar**: urungkan/ulangi; gaya paragraf (Teks normal, Judul 1-4); jenis font (Default, Arial, Verdana, Trebuchet MS, Georgia, Times New Roman, Courier New); ukuran font 12-48 px; tebal, miring, garis bawah, coret, superskrip, subskrip, kode inline; warna teks dan stabilo (palet yang terbaca di tema gelap); hapus format; rata kiri/tengah/kanan/kiri-kanan; daftar berpoin, bernomor, dan centang beserta indentasi; kutipan, blok kode, garis pemisah; link; gambar; tabel dengan baris/kolom/gabung sel/baris judul.
- **Gambar**: tombol gambar, tempel (paste), atau seret-lepas langsung ke editor; diunggah ke `/api/media` (PNG, JPEG, GIF, WebP, maks 5 MB). Posisi seret tetap tepat walau instruktur terus mengetik selama upload.
- **Tempel dari Word/Excel/Google Docs**: tabel dan teks ditempel sebagai konten (bukan gambar pratinjau Office); daftar berpoin/bernomor Word (termasuk sub-item) menjadi daftar sungguhan; gaya sel Excel (tebal, miring, rata) dipertahankan; ukuran pt/em/rem dikonversi ke px; teks hitam dan latar putih dibuang agar terbaca di tema gelap; gambar lokal Word diganti catatan untuk diunggah ulang.
- **Aman untuk perintah dan kode**: tanda `*`, `_`, `==`, `~~` yang diketik atau ditempel tidak lagi diubah otomatis menjadi format (misalnya `find / -name *.txt`, `__init__`, `x == 1` tetap utuh). Pintasan blok seperti `- ` untuk daftar dan `## ` untuk judul tetap berfungsi. Hanya URL eksplisit `http(s)://` yang otomatis menjadi link; nama file (`exploit.py`) dan domain contoh (`malware.ru`) tetap teks biasa.
- **Gambar**: seret sudut gambar untuk mengubah ukuran (rasio terjaga); tombol **Alt** mengedit deskripsi gambar untuk pembaca layar.
- **Ponsel**: perintah yang jarang dipakai (superskrip, subskrip, kode, indentasi, kutipan, blok kode, garis) dikumpulkan di menu **Lainnya**; pengaturan tabel ada di menu **Tabel** agar isi tidak bergeser.
- **Simpan**: tombol Simpan materi atau Ctrl/⌘+S (Ctrl/⌘+Shift+S tetap untuk coret). Status "ada perubahan yang belum disimpan" ditampilkan; browser dan link di dalam aplikasi meminta konfirmasi sebelum meninggalkan halaman dengan perubahan belum tersimpan. Bila server membuang format yang tidak didukung, editor otomatis diselaraskan dengan versi tersimpan dan memberi tahu instruktur.
- **Penyimpanan**: HTML di `Room.content` dengan `Room.contentFormat = HTML`. Server menyaring HTML dengan allowlist ketat (`lib/content/rich-text.ts`) saat disimpan dan saat ditampilkan; script, event handler, `javascript:`, iframe, URL CSS, dan gambar dari luar `/api/media` atau https dibuang.
- **Materi lama**: room dengan `contentFormat = MARKDOWN` (seed dan data lama) tetap tampil, dan otomatis dikonversi saat dibuka di editor: teks tag ditampilkan apa adanya seperti dulu, daftar centang GFM menjadi daftar centang editor, judul 5-6 menjadi Judul 4, perataan kolom tabel dipertahankan, dan gambar dari alamat http/relatif diganti link agar tidak hilang. Klik Simpan sekali untuk menyimpannya sebagai HTML.
- Seed dan `npm run prisma:backfill-content` selalu menulis `contentFormat = MARKDOWN`; backfill hanya mengisi room Markdown yang kosong, jadi tidak menimpa materi yang dikosongkan lewat editor. API lama `POST/PATCH /api/instructor/rooms` tidak lagi menerima kolom materi.
- **Tampilan student** memakai CSS yang sama dengan editor (`.prose-cyber`), sehingga hasilnya sama dengan yang dilihat instruktur. Tabel lebar bisa digulir horizontal di ponsel.
- Dependency baru: `@tiptap/*` 3.32, `sanitize-html`, `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`. `react-markdown` dihapus.
- Migration baru: `20261021023000_room_content_format`.
- Verifikasi 21 Oktober 2026: `npm run typecheck`, `npm run lint`, `npm test` (termasuk tes sanitasi, konversi Markdown lama, dan penyimpanan HTML) lolos; alur editor diuji manual di browser desktop dan ukuran ponsel (format teks, tabel, daftar centang, tempel dari Word, simpan dengan Ctrl/⌘+S, tampilan student). Review terstruktur lima dimensi menghasilkan 33 temuan; 32 terkonfirmasi dan sudah diperbaiki, 1 sudah tertutup sebelumnya. Pemeriksa kelengkapan menambahkan 6 temuan (aturan Markdown otomatis memakan karakter, autolink nama file, daftar Word, performa ketik, alt/resize gambar, rollback); semuanya sudah ditangani dan diuji manual di browser.
- Belum dikerjakan untuk editor: autosave draft, riwayat versi materi, pustaka media (hapus/pakai ulang gambar), dan navigasi panah di toolbar.
- **Rilis maju saja (forward-only)**: setelah instruktur menyimpan materi lewat editor baru, isi room tersimpan sebagai HTML. Kode versi sebelum 21 Oktober 2026 tidak mengenal `contentFormat` dan akan menampilkan HTML mentah kepada student. Jangan rollback kode ke commit lama tanpa terlebih dulu mengonversi room `contentFormat = HTML`, dan backup database sebelum deploy.

## 14. Redesign UI "Security Paper & Stamps" dan Bahasa Inggris (21 Oktober 2026)

Seluruh tampilan diganti dari tema gelap "console" menjadi tampilan terang yang nyaman untuk sesi belajar panjang dan selaras dengan logo resmi. Proses memakai skill impeccable: `PRODUCT.md` (kebenaran produk), arah visual dipilih pemilik dari beberapa opsi, kontrak arah di `.impeccable/surfaces/app-layout-tsx.md`, dan sistem desain yang terbangun didokumentasikan di `DESIGN.md` + `.impeccable/design.json`.

- **Dunia visual**: kertas sekuriti bernuansa cyan (`paper #F3F7F8`, lembar `sheet #FCFDFD`), teks tinta (`ink #10161F`), rail kiri cetak pelangi (iris) dengan tepi perforasi. Cyan logo `#00C2F5` dengan garis tinta hanya untuk langkah berikutnya/aksi utama; link memakai `#006C8A`. Tinta stempel untuk status: violet = selesai, hijau = benar, merah = ulangi/ditutup/error, amber = terjadwal. Satu-satunya permukaan gelap adalah blok kode di materi.
- **Font**: Archivo (variabel, sumbu lebar untuk label kapital condensed), JetBrains Mono hanya untuk kode. Dimuat lewat `next/font` di `app/layout.tsx`.
- **Token**: variabel CSS di `app/globals.css` (`:root`), dipetakan ke Tailwind di `tailwind.config.ts` (`bg-paper`, `bg-sheet`, `bg-well`, `border-line`, `text-ink`, `text-ink-2/3`, `bg-cyan`, `text-cyan-ink`, `violet/green/red/amber` + `-soft`). Palet bawaan Tailwind `slate-*`, `emerald-*`, `rose-*`, `blue-*` tidak dipakai lagi; nama `cyan/red/green/amber/violet` kini token, bukan skala angka.
- **Komponen**: `components/card.tsx` (Card, SectionHeader dengan `id`, StatusPill, ProgressBar, Figure, EmptyState), `components/paper/rosette.tsx` (emblem guilloche unik per path, sekaligus cincin progres), `components/paper/guilloche-band.tsx`, `components/paper/stamp.tsx` (Stamp dengan animasi hentak, StateStamp, StampSlot), `components/paper/passport-page.tsx` (paspor belajar berbentuk halaman visa bernomor), `components/brand-mark.tsx` (logo resmi `public/brand/act-256.png`), kelas form di `components/instructor/form-styles.ts`, kelas `.btn-*`, `.input`, `.field-label`, `.figure`, `.serial` di `globals.css`.
- **Halaman**: semua halaman member, instruktur, admin, auth, dan halaman depan publik ditulis ulang. Dashboard: room/task berikutnya, itinerary nomor room di path aktif, angka poin/streak/peringkat, paspor stempel, daftar path, dan pengumuman (sebelumnya diambil tapi tidak tampil). Search palsu, "Console Operational", "Online & Shielded", dan gambar stok eksternal dihapus.
- **Logo dan ikon**: `public/brand/act-256.png`, favicon `app/icon.png`, ikon iPhone `app/apple-icon.png` (latar putih). Semua raster diberi metadata asal (logo resmi dari anoncyberteam.or.id).
- **Bahasa Inggris**: semua teks UI, pesan server action/validasi/API, label editor, dan format tanggal ("21 Oct 2026", zona "WIB"). Materi walkthrough tulisan instruktur tetap apa adanya. Komentar kode tetap berbahasa Indonesia. Audiens STUDENT disebut "member" di UI.
- **Warna materi di latar terang**: palet warna teks/stabilo editor diganti agar kontras ≥ 4,5:1. Pengaman keterbacaan di `lib/content/rich-text.ts` memetakan warna palet lama (tema gelap) ke palet baru dan menggelapkan warna lain yang terlalu terang saat render/buka editor, tanpa mengubah isi database. Aturan tempel dari Word/Excel (`paste-normalize.ts`) disesuaikan untuk latar terang.
- **Perbaikan logika yang ikut masuk**: langkah berikutnya di dashboard melewati room tertutup/terjadwal; urutan tingkat kesulitan Beginner → Intermediate → Advanced (`lib/learning/difficulty.ts`) menggantikan urutan abjad; leaderboard memakai peringkat kompetisi (poin sama = peringkat sama) agar cocok dengan "Your rank"; "Rooms stamped" hanya menghitung room terbit di path terbit; poin yang ditampilkan adalah poin yang bisa diraih (task + bonus quiz, `lib/learning/points.ts`); pesan validasi menyebut nama field yang terlihat (`lib/actions/form-errors.ts`); kegagalan login/registrasi tampil sebagai pesan, bukan halaman error; `getCurrentUser`/`getCurrentProfile` di-`cache()` per request; heading materi digeser lewat `aria-level` di bawah heading halaman; drawer mobile dapat diakses keyboard.
- **Data uji**: test `tests/service-smoke.test.ts` kini menghapus path tambahan yang dibuatnya; 12 sisa "Authoring Test Path B" dari run lama sudah dihapus dari database dev (tersisa 11 path dan 11 room).
- **Verifikasi**: `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build` lolos. Review adversarial 5 dimensi (perilaku, teks, aturan desain, aksesibilitas, keamanan editor) menghasilkan 54 temuan terkonfirmasi, semuanya diperbaiki. Finish review desain memberi verdict "ship" untuk perbaikan yang dinilainya; halaman instruktur, admin, editor, quiz, leaderboard, profil, dan animasi stempel diperiksa manual di browser dan lewat review kode, tetapi tidak ditangkap layarnya untuk finish review. Tampilan desktop 1440 px dan ponsel 390 px dicek; tidak ada halaman yang melebar di layar sempit.
- **Catatan untuk perubahan berikutnya**: baca `DESIGN.md` sebelum mengubah UI. Lebar area tulis editor (`.rich-editor .ProseMirror`, `calc(66.6667% + 21.5px)`) bergantung pada grid kolom materi di `app/rooms/[slug]/page.tsx`; ubah keduanya bersamaan. Hanya `components/content/room-material.tsx` yang boleh merender HTML materi (`dangerouslySetInnerHTML`).
