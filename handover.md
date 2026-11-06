# Handover Website Anon Cyber Team

Tanggal peninjauan kode: 16 September 2026.

Untuk memahami alur internal sebelum mengubah kode, baca [Handover Arsitektur untuk Developer dan AI](docs/ARCHITECTURE-HANDOVER.md). Dokumen tersebut mencakup alur request, autentikasi, relasi data, aturan progress/poin, kontrak API, dan batasan implementasi.

Dokumen ini adalah panduan serah terima untuk developer/kolaborator berdasarkan kode repository, bukan hasil pengujian runtime pada tanggal di atas. Dokumentasi lama ada di `docs/HANDOVER.md`; gunakan dokumen ini untuk setup dan penjelasan akun lokal yang diperbarui.

## 1. Identitas dan Tujuan

- Nama proyek: Studi Independent Anon Cyber Team.
- Tampilan produk: Anon Cyber Team, platform pembelajaran cybersecurity dengan konsol belajar gelap berwarna logo ACT (bawaan gelap, opsi terang; lihat bagian 16 dan `DESIGN.md`). Seluruh teks UI berbahasa Inggris.
- Repository: https://github.com/Rozan312/studi-independent-anon-cyber-team
- Folder pada Mac pemilik: `/Users/macbook/studi-independent-anon-cyber-team`.
- Website lokal: http://localhost:3000
- Tujuan: menyediakan learning path, room, tugas, kuis, progress, leaderboard, dan pengelolaan pembelajaran berdasarkan role.
- Status: fondasi aplikasi plus ekosistem konten (authoring path/room/task/quiz dengan editor materi visual, upload media, jadwal room, profil student) yang berjalan di lingkungan lokal. Belum boleh dianggap siap produksi tanpa validasi autentikasi, deployment, dan pengujian lanjutan. Ringkasan pekerjaan per sesi ada di bagian 12 sampai 18; yang terbaru di bagian 18.
- Pembaruan terakhir: 6 November 2026 (task di bawah bab, quiz opsional, petunjuk jawaban, sidebar baru, lihat bagian 18; materi per bab dan editor room per halaman, bagian 17; redesign UI menjadi konsol gelap ACT, bagian 16; audit antislop, bagian 15).

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
| Publik | `/` | Halaman depan: identitas komunitas, cara kerja room, contoh daftar progres, tombol Sign in dan Create account |
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
- Navigasi mobile memakai tombol Menu di bar atas yang membuka drawer (meluncur masuk/keluar); rail tetap hanya di layar lebar.
- Jadwal kemunculan room: `Room.availableFrom` dan `Room.availableUntil` (opsional). Room published tanpa jadwal selalu tersedia. Di luar jendela, room tetap tampil dengan label status "Opens ..." atau "Closed" (waktu ditulis dengan zona, misalnya "21 Oct 2026, 19:30 WIB") dan server menolak submit task, quiz, dan lab session; instruktur/admin tetap bisa preview. Zona waktu tampilan mengikuti `NEXT_PUBLIC_TIME_ZONE` (default `Asia/Jakarta`).
- Gambar cover learning path dan room diunggah dari editor masing-masing dan tampil sebagai banner di halaman path dan di atas kolom samping room. Daftar dan kartu memakai logo room/path (unggahan atau inisial nama).
- Kepemilikan konten: `Room.createdById` dan `LearningPath.createdById` mencatat pembuat. Instruktur hanya dapat mengubah konten miliknya atau konten lama tanpa pemilik (seed); admin dapat mengubah semua. Konten seed dapat diberi pemilik lewat Prisma Studio bila ingin dikunci.
- Upload media tersimpan di disk server (`storage/uploads`, atau `UPLOAD_DIR`). Untuk deployment multi-instance atau serverless, ganti provider di `lib/storage/` ke object storage sebelum rilis.
- Menghapus task lewat editor ikut menghapus riwayat jawaban peserta untuk task itu (cascade); poin yang sudah diberikan tidak ditarik.
- Badge dan sertifikat belum diimplementasikan.
- UI tidak lagi memakai gambar eksternal. Room dan path tanpa logo unggahan memakai inisial namanya.
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

## 14. Redesign UI "Security Paper" dan Bahasa Inggris (21 Oktober 2026)

> Catatan historis. Dunia visual "Security Paper" di bagian ini (gradasi iris, grid titik, jejak sirkuit, cincin progres, Archivo, night mode sebagai opsi) sudah diganti pada 6 November 2026; lihat bagian 16. Perbaikan logika, logo room/path, bahasa Inggris, dan seed showcase dari bagian ini tetap berlaku.

Seluruh tampilan diganti dari tema gelap "console" menjadi tampilan terang yang nyaman untuk sesi belajar panjang dan selaras dengan logo resmi. Proses memakai skill impeccable: `PRODUCT.md` (kebenaran produk), arah visual dipilih pemilik dari beberapa opsi, kontrak arah di `.impeccable/surfaces/app-layout-tsx.md`, dan sistem desain yang terbangun didokumentasikan di `DESIGN.md` + `.impeccable/design.json`.

- **Dunia visual**: kertas sekuriti bernuansa cyan (`paper #F3F7F8`, lembar `sheet #FCFDFD`), teks tinta (`ink #10161F`), rail kiri bergradasi cyan pucat ke periwinkle dengan grid titik halus (kelas `.digital-surface`). Cyan logo `#00C2F5` dengan garis tinta hanya untuk langkah berikutnya/aksi utama; link memakai `#006C8A`. Warna status: violet = selesai, hijau = benar/skor quiz, merah = ulangi/ditutup/error, amber = terjadwal. Satu-satunya permukaan gelap adalah blok kode di materi.
- **Font**: Archivo (variabel, sumbu lebar untuk label kapital condensed), JetBrains Mono hanya untuk kode. Dimuat lewat `next/font` di `app/layout.tsx`.
- **Token**: variabel CSS di `app/globals.css` (`:root`), dipetakan ke Tailwind di `tailwind.config.ts` (`bg-paper`, `bg-sheet`, `bg-well`, `border-line`, `text-ink`, `text-ink-2/3`, `bg-cyan`, `text-cyan-ink`, `violet/green/red/amber` + `-soft`). Palet bawaan Tailwind `slate-*`, `emerald-*`, `rose-*`, `blue-*` tidak dipakai lagi; nama `cyan/red/green/amber/violet` kini token, bukan skala angka.
- **Komponen**: `components/card.tsx` (Card, SectionHeader dengan `id`, StatusPill, ProgressBar, Figure, EmptyState), `components/paper/progress-ring.tsx` (cincin progres tersegmen, satu segmen per room: ungu selesai, cyan room berikutnya, abu-abu belum), `components/paper/circuit.tsx` (motif jalur sirkuit `CircuitField` dan strip `CircuitStrip`), `components/paper/completion.tsx` (penanda selesai: centang untuk room lulus, angka skor untuk quiz lulus, ikon retry; dan daftar "Completed"), `components/paper/state-tag.tsx` (label status datar "Opens 24 Oct", "Closed", "Solved", "Locked"), `components/paper/entity-logo.tsx` (logo room/path: gambar unggahan atau inisial nama), `components/brand-mark.tsx` (logo resmi `public/brand/act-256.png`), kelas form di `components/instructor/form-styles.ts`, kelas `.btn-*`, `.input`, `.field-label`, `.figure`, `.serial` di `globals.css`.
- **Halaman**: semua halaman member, instruktur, admin, auth, dan halaman depan publik ditulis ulang. Dashboard: room/task berikutnya, itinerary nomor room di path aktif, angka poin/streak/peringkat, daftar "Completed", daftar path dengan logo, dan pengumuman (sebelumnya diambil tapi tidak tampil). Search palsu, "Console Operational", "Online & Shielded", dan gambar stok eksternal dihapus.
- **Logo dan ikon**: `public/brand/act-256.png`, favicon `app/icon.png`, ikon iPhone `app/apple-icon.png` (latar putih). Semua raster diberi metadata asal (logo resmi dari anoncyberteam.or.id).
- **Bahasa Inggris**: semua teks UI, pesan server action/validasi/API, label editor, dan format tanggal ("21 Oct 2026", zona "WIB"). Materi walkthrough tulisan instruktur tetap apa adanya. Komentar kode tetap berbahasa Indonesia. Audiens STUDENT disebut "member" di UI.
- **Warna materi di latar terang**: palet warna teks/stabilo editor diganti agar kontras ≥ 4,5:1. Pengaman keterbacaan di `lib/content/rich-text.ts` memetakan warna palet lama (tema gelap) ke palet baru dan menggelapkan warna lain yang terlalu terang saat render/buka editor, tanpa mengubah isi database. Aturan tempel dari Word/Excel (`paste-normalize.ts`) disesuaikan untuk latar terang.
- **Perbaikan logika yang ikut masuk**: langkah berikutnya di dashboard melewati room tertutup/terjadwal; urutan tingkat kesulitan Beginner → Intermediate → Advanced (`lib/learning/difficulty.ts`) menggantikan urutan abjad; leaderboard memakai peringkat kompetisi (poin sama = peringkat sama) agar cocok dengan "Your rank"; "Rooms completed" hanya menghitung room terbit di path terbit; poin yang ditampilkan adalah poin yang bisa diraih (task + bonus quiz, `lib/learning/points.ts`); pesan validasi menyebut nama field yang terlihat (`lib/actions/form-errors.ts`); kegagalan login/registrasi tampil sebagai pesan, bukan halaman error; `getCurrentUser`/`getCurrentProfile` di-`cache()` per request; heading materi digeser lewat `aria-level` di bawah heading halaman; drawer mobile dapat diakses keyboard.
- **Data uji**: test `tests/service-smoke.test.ts` kini menghapus path tambahan yang dibuatnya; 12 sisa "Authoring Test Path B" dari run lama sudah dihapus dari database dev (tersisa 11 path dan 11 room).
- **Verifikasi**: `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build` lolos. Review adversarial 5 dimensi (perilaku, teks, aturan desain, aksesibilitas, keamanan editor) menghasilkan 54 temuan terkonfirmasi, semuanya diperbaiki. Finish review desain memberi verdict "ship" untuk perbaikan yang dinilainya; halaman instruktur, admin, editor, quiz, leaderboard, profil, dan animasi penanda selesai diperiksa manual di browser dan lewat review kode, tetapi tidak ditangkap layarnya untuk finish review. Tampilan desktop 1440 px dan ponsel 390 px dicek; tidak ada halaman yang melebar di layar sempit.
- **Catatan untuk perubahan berikutnya**: baca `DESIGN.md` sebelum mengubah UI. Lebar area tulis editor (`.rich-editor .ProseMirror`, `calc(66.6667% + 21.5px)`) bergantung pada grid kolom materi di `app/rooms/[slug]/page.tsx`; ubah keduanya bersamaan. Hanya `components/content/room-material.tsx` yang boleh merender HTML materi (`dangerouslySetInnerHTML`).
- **Perubahan lanjutan atas permintaan pemilik (21 Oktober 2026)**: stempel karet dihapus (dinilai mirip prangko), begitu pula konsep lencana. Penyelesaian kini ditampilkan langsung: room lulus = tanda centang (digambar sekali saat baru selesai), quiz lulus = angka skornya, quiz yang perlu diulang = ikon retry. Label status kecil kini datar dan tegak. Kata "stamp"/"passport" tidak dipakai lagi di UI ("Rooms completed", "Completed").
- **Logo room dan learning path**: kolom baru `Room.logoUrl` dan `LearningPath.logoUrl` (migration `20261021090000_room_and_path_logo`). Instruktur mengunggahnya di form konfigurasi (field "Logo" di samping "Cover image") pada `/instructor/paths/[id]` dan `/instructor/rooms/[id]` bagian Details. Bila kosong, UI menampilkan inisial nama dalam kotak berwarna (misalnya "Introduction to HTTP" → "IH"). Logo tampil di daftar path (`/learning-paths`, dashboard, `/progress`), daftar room (`/rooms`), baris room di halaman path, kartu jadwal dan kolom samping halaman room, Instructor Overview, Path manager, dan header editor path; inisial juga dipakai sebagai avatar profil bila foto belum ada (untuk nama orang, semua kata dipakai: "Dan Pratama" → "DP"). Belum tampil di tabel `/instructor/rooms` dan daftar room di editor path. Room baru dari room builder belum punya field logo; unggah setelah room dibuat.
- **Motif digital menggantikan latar ala prangko (permintaan pemilik, 21 Oktober 2026)**: lingkaran guilloche, garis gelombang, dan tepi rail bertitik seperti perforasi dihapus (`rosette.tsx` dan `guilloche-band.tsx` dihapus). Gantinya: bidang jalur sirkuit (garis siku 45°, titik via, chip kecil; deterministik dari seed) di hero beranda dan panel login, strip "data bus" sirkuit di kepala kartu Continue dan tepi bawah hero, grid titik halus di rail/drawer/hero/panel login, dan cincin progres tersegmen di dashboard serta halaman path. Path dengan 1 room digambar sebagai lingkaran penuh; lebih dari 24 room memakai satu busur kontinu.
- **Tombol utama tanpa garis hitam (permintaan pemilik)**: `.btn-primary` kini isian cyan dengan tepi cyan tipis dan bayangan lembut; teksnya memakai token `--on-cyan` (biru-tinta gelap) agar menyatu dengan latar. Pilihan jawaban quiz dan penanda soal aktif juga memakai tepi cyan, bukan hitam.
- **Animasi menu kiri**: drawer ponsel meluncur masuk/keluar dengan latar memudar (tetap terpasang tetapi `inert` saat tertutup, fokus kembali ke tombol Menu); saat rail desktop diciutkan, label memudar dan padding beranimasi, kartu anggota menyusut halus; konten halaman masuk dengan fade 320 ms setiap pindah menu. Semua animasi mati pada `prefers-reduced-motion`.
- **Night mode (seluruh aplikasi, opsional)**: tombol "Night mode" ada di bagian bawah menu kiri (dengan sakelar), di drawer ponsel, sebagai ikon di bar atas ponsel (di samping Menu), dan di header halaman lab. Semua tombol memakai satu preferensi (`localStorage` `act-night-mode`, komponen `components/theme/night-mode.tsx`). Skrip awal konstan di `app/layout.tsx` memasang `data-theme="night"` sebelum halaman tampil sehingga tidak ada kilatan terang. Token gelap ada di `:root[data-theme="night"]` (`globals.css`); materi room dan area tulis editor ikut gelap; warna teks pilihan instruktur (dipilih untuk latar terang) dibalik kecerahannya dengan `filter: invert(1) hue-rotate(180deg)` sehingga ronanya tetap tetapi terbaca (kontras palet 6-8:1). Stabilo dan elemen berwarna bertingkat dikecualikan agar tidak terbalik dua kali. Cincin progres dan motif sirkuit memakai token sehingga ikut berganti. Tampilan terang tetap bawaan.
- **Perbaikan dari review lanjutan**: skor quiz lulus kini ikut terbaca pembaca layar ("Quiz passed with 90% · …"), ikon retry diperbaiki (sebelumnya mirip huruf "G"), pratinjau unggah logo berbentuk kotak seperti tampilannya, dan field unggah memakai nama sesuai labelnya ("Logo URL", "Upload logo", "Upload cover image").
- **Heatmap aktivitas (pemanis untuk showcase)**: halaman Progress punya bagian "Activity" berisi heatmap 17 minggu (satu kolom per minggu, Senin di atas; warna makin pekat makin banyak jawaban task + attempt quiz hari itu, tanggal per hari lewat tooltip) plus angka Longest streak, This week, dan Busiest day. Profile menampilkan heatmap yang sama di samping "Recently completed". Data dari `getLearningActivity()` di `lib/services/activity-service.ts` (satu query yang sama dengan streak, jendela 120 hari, hari lokal server); komponen `components/paper/activity-heatmap.tsx`. Ambang warna tetap: 1, 2, 3–4, 5+ aktivitas per hari.
- **Data demo dan screenshot untuk banner komunitas**: `npm run seed:showcase` membuat 8 anggota contoh (akun utama `nadia`, email `<username>@local.dev` sehingga bisa login lokal) dengan riwayat jawaban, attempt quiz, progres room, dan poin yang mengikuti aturan aplikasi, tersebar di 17 minggu terakhir. ID profil demo berakhiran `5eed000006xx`; `npm run seed:showcase:remove` menghapus semuanya (cascade). Seed menolak berjalan bila `DATABASE_URL` bukan localhost. Screenshot 2× (desktop/ponsel, terang/malam), versi berbingkai browser/ponsel, dan contoh kolase banner dibuat dengan `scripts/showcase/capture.mjs` dan `scripts/showcase/compose.py`; cara pakai di `docs/showcase/README.md`. File PNG di `docs/showcase/{screens,framed,banner}/` tidak di-commit. Data demo saat ini masih ada di database dev.
- **Status akhir sesi (21 Oktober 2026)**: `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build` lolos setelah heatmap dan seed demo ditambahkan; test smoke tidak menghapus anggota demo. Profile memakai `CompletionList` dengan `columns={2}` karena kartunya berbagi baris dengan heatmap. Di akhir sesi, dev server dihentikan dan container `si-act-postgres` dihentikan dengan `docker compose stop` (data tetap di volume). Lanjutkan dengan `docker compose up -d` lalu `npm run dev`. Data demo showcase masih ada di database; hapus dengan `npm run seed:showcase:remove` bila tidak diperlukan.

## 15. Audit antislop (5 November 2026)

Plugin Claude Code **antislop** (aturan anti "AI slop" untuk UI, teks, dan kode) dijalankan dalam mode DURING atas permintaan pemilik, dengan perubahan UI yang terlihat. Laporan lengkap dengan bukti per aturan: `anti-slop/delivery-gate-001-2026-11-05.md`.

- **Cara kerja:** pengukuran otomatis di Chrome (27 rute x tema terang/malam x desktop/ponsel), audit 5 lensa (kejujuran/fungsi, teks + komentar, aksesibilitas, mobile, visual + performa), setiap temuan diuji verifikator; 41 temuan terkonfirmasi diperbaiki, 7 arahan pemilik dicatat alasannya, 11 dibantah.
- **State yang sebelumnya tidak ada:** garis loading cyan di tepi atas saat pindah halaman (`components/ui/route-progress.tsx`, tidak memakai `loading.tsx` agar rail tidak hilang), `app/error.tsx` (Try again), `app/global-error.tsx`, `app/not-found.tsx`. Error server tak terduga tidak lagi tampil mentah: `lib/errors.ts` (`UserFacingError` untuk pesan yang aman ditampilkan, `userMessage()` untuk sisanya). Tombol Move/Delete di editor task/quiz punya pending state (`components/instructor/move-button.tsx`). Logo, cover, dan avatar punya fallback bila URL gambar mati (`components/paper/fallback-image.tsx`).
- **Halaman dan struktur:** setiap halaman punya judul tab sendiri (room/path memakai nama yang sudah terbit lewat `lib/services/page-title-service.ts`; editor memakai judul statis agar nama draf tidak bocor). Landmark header/nav/main/footer di semua halaman; footer bersama `components/site-footer.tsx`.
- **Perubahan UI yang terlihat:** tepi field lebih tegas (token `--line-input`, kontras 3:1 ke atas); tombol submit default sekunder, cyan hanya untuk aksi utama view (Create announcement, simpan path, Save material, Resume room); sakelar night mode tidak lagi cyan; kotak hint netral (bukan amber); status lab "Not connected" (bukan "Ready" palsu); Profile tanpa "lab sessions started" dan tanpa baris Adjustments bila nol; pengumuman dashboard tampil utuh; heatmap menggambar hari kosong sebagai titik kecil dan punya daftar hari aktif untuk pembaca layar; dashboard, profil, dan pengumuman admin baru memecah dua kolom mulai xl (di 1024 sampai 1180 px kolom utama tidak terjepit); tabel leaderboard dan riwayat di ponsel memindahkan nama/tanggal/jawaban ke baris kedua; teks seragam ("Rooms completed", "Passed ...").
- **Perangkat sentuh:** varian Tailwind `coarse:` (plugin di `tailwind.config.ts`) dan blok `@media (pointer: coarse)` di `globals.css` membuat semua target sentuh minimal 44 px (tombol, field, select, item menu, toolbar editor, tab) dan link teks mendapat area sentuh tak terlihat (`.text-link`, `.tap-target`). Field 16 px di layar sentuh agar iOS tidak zoom. Tampilan desktop dengan mouse tidak berubah.
- **Aksesibilitas lain:** kursor pointer/not-allowed di base CSS; outline fokus di area tulis editor; stabilo materi dan swatch warna editor terbaca di night mode; transisi progress bar dan sakelar berhenti di reduced motion; nama aksesibel itinerary cocok dengan teks terlihat.
- **Perbaikan penting di luar UI:** pola `.gitignore` `storage/` ikut mengabaikan `lib/storage/`, sehingga `lib/storage/local-storage.ts` tidak pernah ter-commit (clone bersih tidak bisa build). Pola kini `/storage/`; file itu harus ikut di-commit. Warning next/image pada logo diperbaiki (tinggi atribut memakai rasio asli file 256x241, dibulatkan seperti `img.height`).
- **Verifikasi:** typecheck, lint, `npm test`, dan `npm run build` lolos; 108 pemuatan halaman tanpa overflow, tanpa pesan console, 0 target sentuh di bawah 44 px; uji klik 377 link dan 17 interaksi lolos. Catatan sisa ada di bagian akhir laporan Delivery Gate.
- **Catatan:** dev server bisa kehabisan memori bila banyak Chrome headless memuat halaman paralel; jalankan skrip pengukuran berurutan.
- **Status akhir sesi (5 November 2026):** semua perubahan audit antislop di-commit bersama `lib/storage/local-storage.ts` yang sebelumnya tidak ter-track. Docker Desktop, container `si-act-postgres`, dan dev server (port 3000) masih menyala; data demo showcase (8 anggota, dibuat 21 Oktober) masih ada di database. Setelah commit, data demo di-seed ulang (tanggal mengikuti 5 November 2026) dan screenshot, bingkai, serta kolase banner di `docs/showcase/` diambil ulang dengan UI hasil audit.

## 16. Redesign UI: Konsol Gelap ACT (6 November 2026)

Pemilik menilai tampilan "Security Paper" (bagian 14) masih terasa buatan AI: gradasi dan motif, kartu membulat mengambang, pola template dashboard, warna pastel dengan font aman. Tampilan dirombak total lewat skill impeccable (mode antislop DURING tetap aktif). Arah yang dipilih pemilik: standar kategori platform belajar security, digarap setingkat kerapian Hack The Box (mulus, panel bersambungan) tetapi tidak hijau dan tidak meniru HTB; warna dari logo ACT (cyan di atas hampir hitam) pada teks, tepi, dan aksi utama; paling banyak satu gradasi lembut; tanpa klise "hacker". Kontrak arah: `.impeccable/surfaces/app-layout-tsx.md`; preferensi tetap pemilik dicatat di `PRODUCT.md` (Brand Commitments); sistem desain hasil build di `DESIGN.md` + `.impeccable/design.json`.

- **Tema**: gelap menjadi bawaan, terang opsional. Token gelap di `:root`, token terang di `:root[data-theme="light"]` (`app/globals.css`). Preferensi disimpan di `localStorage` `act-theme` (`"light"` atau `"dark"`; belum ada sampai tombol pertama kali ditekan, dan selain `"light"` dibaca gelap); kunci lama `act-night-mode` tidak dibaca lagi, jadi semua pengguna mulai dari gelap. Komponen `components/theme/night-mode.tsx` diganti nama menjadi `components/theme/theme-toggle.tsx` (`ThemeToggle` varian `rail`/`icon`, `useLightMode()`, `THEME_KEY`); tombolnya berlabel "Light mode" dan ada di rail, bar atas ponsel, drawer, bar halaman publik, dan halaman auth. Header halaman lab tidak lagi punya tombol tema.
- **Warna**: gelap memakai `paper #0A1118`, `sheet #0F1922`, `well #14212C`, tepi `line #1E2C38`, teks `ink #E7EEF2` / `ink-2 #A3B3BE` / `ink-3 #8597A3`, cyan logo `#00C2F5`. Terang memakai `paper #F4F7F9`, `sheet #FFFFFF`, link `cyan-ink #006C8A`. Cyan hanya untuk aksi utama, item aktif/berikutnya, link, progres, dan fokus; violet = selesai, hijau = benar/skor, merah = ulangi/error, amber = terjadwal. Satu-satunya gradasi adalah `.rail-surface` (token `--rail`) di rail kiri, drawer ponsel, dan kolom merek halaman auth; `.digital-surface` dan grid titik dihapus.
- **Font**: Red Hat Display (judul, label data, angka, tombol), Red Hat Text (teks baca), Red Hat Mono (kode, nomor seri, slug, referensi error), lewat `next/font` di `app/layout.tsx` dan dipetakan ke `font-display` / `font-sans` / `font-mono` di `tailwind.config.ts`. Archivo dan JetBrains Mono tidak dipakai lagi.
- **Bentuk**: panel rata menempel dengan garis tipis (`.sheet` tanpa bayangan; bayangan `lift` hanya untuk lapisan mengambang seperti drawer dan popover editor), radius 6-10 px. Tidak ada eyebrow di atas judul, grid kartu berukuran sama, atau cincin progres pengganti isi.
- **Shell aplikasi** (`components/app-shell-frame.tsx`): rail bergradasi dengan item aktif `bg-cyan-soft` + garis cyan tipis; bar atas desktop (sticky, 56 px) berisi breadcrumb grup/halaman dan, untuk member, pil poin dan peringkat yang menautkan ke `/leaderboard` (dihitung di `components/app-shell.tsx`). Halaman publik (beranda, 404, error) memakai `components/public-shell.tsx`; halaman auth memakai kolom merek sempit dengan formulir rata tanpa kartu (`components/auth/auth-frame.tsx`).
- **Dashboard**: panel Continue (room berikutnya, task berikutnya "Next task 2 of 3", dan daftar room path dengan menit), satu strip angka (Streak, Rooms completed, Quizzes passed), Recent activity, Learning paths, Top members, Announcements. Poin dan peringkat pindah ke pil di bar atas.
- **Halaman lain**: daftar path/room berbentuk baris bergaris dengan progres; halaman path memakai ringkasan progres + daftar room (bukan cincin); kolom samping room berupa baris `<dl>`; Progress menampilkan heatmap 26 minggu ukuran besar (`size="lg"`, `ACTIVITY_CALENDAR_WEEKS_WIDE`), di ponsel hanya 17 minggu terakhir dengan keterangan yang sesuai; Profile memasukkan angka ke daftar detail; leaderboard memakai baris sorot untuk pengguna sendiri; halaman instruktur dan admin memakai ringkasan bergaris.
- **Penanda selesai**: tetap centang (room) dan ikon retry, kini lingkaran berbingkai tipis (28 px di daftar penyelesaian, halaman room, dan baris Room passed di hasil quiz; ikon retry di hasil quiz 44 px); quiz lulus tetap angka skor hijau tanpa bingkai (di hasil quiz berukuran besar). `CompletionList` menjadi satu kolom berbaris dengan tanggal rata kanan; prop `columns` dihapus.
- **Dihapus**: `components/paper/circuit.tsx`, `components/paper/progress-ring.tsx`, kelas `.digital-surface` dan animasi `.ring-in`.
- **File baru**: `components/public-shell.tsx` (`PublicShell`: bar atas tipis berisi logo dan tombol tema + footer bersama, untuk beranda, 404, dan error boundary), `components/rooms/room-section-nav.tsx` (`RoomSectionNav`: tab Material/Tasks/Quiz di halaman room yang menandai seksi yang sedang dibaca; di desktop menempel di bawah bar atas), dan `components/instructor/publish-state.tsx` (`PublishPill`: hijau Published / netral Draft di halaman instruktur dan admin; `RoomStateMarks`: status terbit + label jadwal Opens/Closed untuk room di halaman instruktur). Ketiganya file baru; pastikan ikut di-`git add` saat commit agar clone bersih tetap bisa build (lihat catatan `lib/storage/local-storage.ts` di bagian 15).
- **Warna materi instruktur**: di tema gelap warna teks pilihan instruktur dibalik kecerahannya (`filter: invert(1) hue-rotate(180deg)` di bawah `:root:not([data-theme="light"])`), sama seperti night mode sebelumnya; isi database tidak berubah. Konstanta kalibrasi palet di `lib/content/rich-text-config.ts` (`SHEET_RGBA` #FCFDFD, `WELL_RGBA` #ECF3F5) sengaja tetap memakai nilai lama karena palet teks dikalibrasi terhadap nilai itu; token terang kini `sheet` #FFFFFF dan `well` #EDF2F5, jadi kontras palet hanya naik atau bergeser sekitar 0,3% (komentar di file itu menjelaskannya). Tes palet di `tests/service-smoke.test.ts` menulis ulang nilai lama yang sama (`sheetRgba`, `wellRgba`) alih-alih mengimpor konstanta ini.
- **Verifikasi**: `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build` lolos (build dijalankan di salinan terpisah agar dev server tidak terganggu). Pengukuran Chrome 108 pemuatan (27 rute x gelap/terang x 1440/390 px): 0 overflow, 0 pesan console, judul tab unik, landmark lengkap, 0 heading melompat, 0 kontrol tanpa nama, 0 target sentuh di bawah 44 px; kontras rendah hanya pada kontrol disabled (dikecualikan WCAG). Uji klik 377 link dan 17 interaksi lolos, fokus terlihat di 20 rute. Finish review impeccable memberi verdict "ship" setelah tiga putaran (8 lalu 2 perbaikan). `DESIGN.md` dan `.impeccable/design.json` ditulis ulang dari hasil build, lalu dicocokkan dengan kode dalam dua putaran pemeriksaan silang (50 lalu 18 koreksi, semuanya diterapkan). Dari pemeriksaan itu ikut diperbaiki di kode: fade warna tema kini berhenti pada `prefers-reduced-motion`, outline fokus pada baris tautan di panel (daftar instruktur/admin, Progress, Profile) digambar ke dalam agar tidak terpotong tepi panel, dan varian `button` yang tidak terpakai dihapus dari `ThemeToggle`.
- **Catatan konten**: estimasi path "~12 h" tidak cocok dengan total menit room (155 menit); perbaiki di editor path bila perlu.
- **Showcase**: screenshot di `docs/showcase/` diambil sebelum redesign ini. `scripts/showcase/capture.mjs` sudah memakai `act-theme` ("night"/"dark" di spec = gelap, "light" = terang); ambil ulang bila banner perlu UI baru.

## 17. Materi per Bab, Editor Room per Halaman, Tab Room Member (6 November 2026)

Revisi pemilik setelah redesign: (1) bagian editor room jangan satu halaman panjang, menu di samping dan tiap bagian halaman sendiri; (2) materi satu room dipecah menjadi beberapa bab karena satu tema berisi banyak subbab; (3) di halaman room member materi selebar halaman, progres/detail room/tombol Lab pindah ke atas di bawah judul tanpa mengganggu. Keputusan pemilik: bab ditulis terpisah oleh instruktur, Tasks punya halaman sendiri, aturan selesai room tetap (semua task benar + quiz lulus; bab hanya navigasi baca), panel materi penuh dengan teks dibatasi sekitar 90 karakter per baris.

- **Data**: model baru `RoomChapter` (judul, isi, `contentFormat`, `orderIndex`, cascade dari `Room`), migration `20261106100000_room_chapters`. Migration menyalin materi lama setiap room menjadi Bab 1. `Room.content`/`contentFormat` tetap ada sebagai cadangan lama dan tidak lagi dibaca atau ditulis aplikasi (service dan API memakai `omit`, jadi tidak ikut terkirim). Service bab di `lib/services/content-service.ts` (`createRoomChapter`, `updateRoomChapter`, `moveRoomChapter`, `deleteRoomChapter`; kepemilikan sama dengan room), pembaca di `lib/services/room-service.ts` (`getRoomBySlug` membawa daftar bab tanpa isi, `getRoomChapterForReader` memuat satu bab dari room terbit). Pindah/hapus bab tidak mengubah waktu "Edited" bab lain. Judul bab maksimal 160 karakter, sama dengan judul room.
- **Deploy**: jalankan `npx prisma migrate deploy` sebelum kode baru dipakai. Di lokal, backup database sebelum migration disimpan di luar repo (folder scratchpad sesi, bukan di-commit).
- **Editor room** (`app/instructor/rooms/[id]/`): `layout.tsx` + loader ber-`cache()` `editor-data.ts`; halaman `page.tsx` (Details), `schedule/` (status, form jadwal buka/tutup, publish + checklist konten), `material/` (daftar bab: tambah, naik/turun, hapus dengan konfirmasi), `material/[chapterId]/` (judul + editor visual satu bab, bab sebelumnya/berikutnya), `tasks/`, `quiz/`. Menu seksi `components/instructor/room-editor-nav.tsx` berupa kolom samping yang menempel mulai lebar 1280 px (xl); di bawahnya menjadi deretan tab. Tanggal jadwal pindah dari Details ke halaman Schedule & publishing (`room-schedule-form.tsx`, `updateRoomScheduleAction`); menyimpan Details tidak lagi menyentuh jadwal. Peringatan perubahan belum disimpan kini juga menghitung judul bab, dan sesi login yang habis saat menyimpan tidak membuang tulisan.
- **Room member** (`app/rooms/[slug]/`): loader ber-`cache()` `room-view.ts` dan `room-frame.tsx` dipakai tiga tab. Strip ringkas di bawah judul (`components/rooms/room-status-strip.tsx`: progres, task, quiz, path, poin, waktu, level, tombol Lab) menggantikan kolom kanan. Tab Material / Tasks / Quiz (`room-tabs.tsx`) adalah halaman sendiri: `/rooms/[slug]?chapter=N` (satu bab per halaman, daftar "All chapters", Previous/Next; bab terakhir mengarah ke Tasks), `/rooms/[slug]/tasks` (baru), `/rooms/[slug]/quiz`. Nomor bab yang salah atau di luar jangkauan menampilkan bab 1. Room yang belum dibuka/sudah ditutup tetap memakai tampilan jadwal (`room-schedule-view.tsx`) di Material dan Tasks. Judul tab browser per bab: "Judul bab · Judul room" (untuk room dengan lebih dari satu bab); judul bab yang sama dengan judul room disembunyikan secara visual dan tetap terbaca pembaca layar.
- **Lebar baca**: panel materi selebar area konten; teks berjalan dibatasi `--prose-measure: 43.5rem` (sekitar 90 karakter) di `app/globals.css`, tabel/kode/gambar memakai lebar penuh. Aturan lama lebar editor (`calc(66.6667% + 21.5px)`, bagian 14) sudah dihapus; editor dan tampilan member memakai ukuran yang sama lewat `.prose-cyber`. Ukuran heading materi diturunkan agar tidak lebih besar dari judul bab.
- **Gambar cover room**: tidak lagi ditampilkan di halaman member, sehingga field-nya dihapus dari Details. Nilai `coverImageUrl` yang sudah ada tetap tersimpan dan tidak terhapus saat Details disimpan. Cover learning path tidak berubah.
- **Data demo**: `npm run prisma:backfill-content` sudah dijalankan: 10 room seed kini punya 4–5 bab (dipecah dari teks seed di heading `## `, isi identik) dan bab pembukanya berjudul "Introduction". Room yang sudah disunting (misalnya `hypothesis-driven-hunting`) tidak disentuh dan tetap satu bab. Progress tidak berubah (dicek sebelum dan sesudah).
- **Catatan dari bagian sebelumnya yang kini usang**: bagian 14 menyebut aturan lebar editor 66.6667%, dan bagian 16 menyebut `components/rooms/room-section-nav.tsx`; keduanya sudah diganti oleh perubahan di atas.
- **Verifikasi**: `npx prisma migrate status` (up to date), `npm run typecheck`, `npm run lint`, `npm test` (termasuk tes bab: buat, simpan dengan sanitasi, ganti judul, pindah, hapus + urutan ulang, tolak instruktur lain, bab dari room lain/draf, API tanpa hint dan tanpa materi lama), dan `npm run build` (di salinan terpisah) lolos. Review kode dan review desain dengan screenshot (desktop 1440/1024, ponsel 390, gelap/terang, sisi instruktur dan member) menghasilkan 17 temuan terverifikasi, semuanya diperbaiki; alur tambah/pindah/hapus bab diuji di browser headless. Audit otomatis: tanpa overflow, tanpa heading melompat, tanpa kegagalan kontras, target sentuh 44 px terpenuhi.
- **Belum dikerjakan**: `GET /api/rooms?roomId=` masih mengembalikan daftar task (tanpa jawaban/hint) untuk room draf atau di luar jadwal; ini celah lama di luar revisi ini dan dicatat sebagai tugas terpisah. Setiap halaman editor memuat isi semua bab untuk menghitung jumlah; cukup untuk ukuran sekarang, perlu dirampingkan bila room punya banyak bab panjang. `scripts/showcase/shots.json` belum punya screenshot halaman Tasks.

## 18. Task di Bawah Bab, Quiz Opsional, Petunjuk Jawaban, Sidebar (6 November 2026)

Revisi pemilik: task ditampilkan di bawah materi babnya (opsional per bab) di halaman yang sama; quiz opsional; kolom jawaban diberi petunjuk `****` sesuai jumlah huruf; sidebar tidak boleh bergerak saat pindah halaman, tombol buka/tutup harus selalu terlihat, dan saat tertutup nama fitur muncul saat kursor diarahkan. Keputusan pemilik: tab Tasks dihapus, urutan buka task per bab, quiz room boleh ada atau tidak (bisa dihapus), petunjuk satu `*` per huruf/angka dengan spasi dan tanda baca tetap terlihat.

- **Data** (migration `20261106120000_chapter_tasks_quiz_history`): `RoomTask.chapterId` (opsional, `ON DELETE SET NULL`); task lama dipindah ke bab terakhir room-nya. `UserQuizAttempt` kini menyimpan `roomId` dan `quizTitle` sendiri, dan `quizId` boleh kosong (`SET NULL`), sehingga riwayat attempt tetap tampil di dashboard, Progress, dan Profile setelah quiz dihapus ("quiz removed"). "Quizzes passed" dihitung per room di ketiga halaman. Backup database sebelum migration disimpan di folder scratchpad sesi (bukan di repo). Saat deploy: `npx prisma migrate deploy`.
- **Member**: tab tinggal Material dan Quiz (bar tab disembunyikan bila room tanpa quiz). Task tampil di bawah materi babnya (`components/rooms/chapter-tasks.tsx`); task tanpa bab tampil di bawah bab terakhir; di dalam satu bab task terbuka berurutan, bab lain tidak ikut terkunci (`lib/learning/chapters.ts`). Daftar "All chapters" menampilkan jumlah task terpecahkan per bab. `/rooms/[slug]/tasks` kini mengalihkan ke bab yang berisi task terbuka pertama; link lama tetap jalan. Halaman quiz untuk room tanpa quiz menampilkan keadaan "This room has no quiz". "Resume room" di dashboard membuka bab yang berisi task berikutnya. Urutan buka task tetap hanya di tampilan (server menerima jawaban task mana pun), sama seperti sebelumnya.
- **Petunjuk jawaban**: `lib/learning/answer-pattern.ts` membentuk pola dari jawaban utama di server (contoh "false positive" → `***** ********`); jawaban dan jawaban alternatif tidak pernah dikirim ke browser (dicek juga di payload halaman). Pembaca layar mendengar kalimat seperti "Answer pattern: 6 characters, hyphen, 4 characters…", bukan deretan bintang.
- **Instruktur**: halaman Tasks dikelompokkan per bab, setiap task punya pilihan "Chapter" (bawaan bab terakhir); halaman bab menampilkan task yang menempel; daftar bab menampilkan jumlah task. Quiz bisa dihapus lewat "Remove quiz" (dengan konfirmasi): pertanyaan terhapus, riwayat attempt dan poin member tetap, dan progres room dihitung ulang (room selesai cukup dengan semua task benar). Penghapusan ditolak bila room belum punya task, agar status selesai member tidak hilang. Menambah quiz baru juga menghitung ulang progres. Poin quiz hanya dibayar sekali per room meskipun quiz diganti. Checklist publish menulis quiz sebagai opsional.
- **Sidebar**: status buka/tutup disimpan di cookie `act-rail-collapsed` dan dibaca server (`components/app-shell.tsx`), jadi rail langsung tampil dalam posisi yang benar tanpa animasi saat pindah halaman; animasi hanya saat tombol ditekan. Tombol chevron kecil di tepi kanan rail sejajar logo menggantikan baris "Collapse" (selalu terlihat, `aria-expanded`, area sentuh 44 px). Saat tertutup, arahkan kursor atau fokus keyboard ke ikon untuk melihat namanya (tooltip `position: fixed`, berjarak 14 px dari tepi rail). Preferensi lama di localStorage dipindah sekali ke cookie. Drawer ponsel tidak berubah.
- **Verifikasi**: `npx prisma migrate status`, `npm run typecheck`, `npm run lint`, `npm test` (termasuk tes pola jawaban, task per bab, hapus quiz dengan riwayat tetap, poin tidak dobel, progres dihitung ulang, API tanpa jawaban/hint), dan `npm run build` (salinan terpisah) lolos. Review kode dan desain dengan screenshot dan audit otomatis (desktop/ponsel, gelap/terang, member dan instruktur) menghasilkan 6 temuan terverifikasi ditambah 3 temuan sesi utama; semuanya diperbaiki. Di browser dicek: pengalihan `/tasks`, petunjuk jawaban, tombol tepi rail, tooltip, dan lebar rail tetap 76 px selama pindah bab. Data demo tidak berubah (progress, jumlah task/bab/quiz sama).
- **Catatan**: celah `GET /api/rooms?roomId=` (bagian 17, "Belum dikerjakan") ikut diperbaiki di sini: room draf memberi hasil kosong, dan member tidak mendapat daftar task untuk room di luar jadwal.
