# Handover Arsitektur untuk Developer dan AI

Ditinjau dari kode pada 16 September 2026. Baca bersama [handover operasional](../handover.md). Dokumen ini membedakan implementasi sekarang dari rekomendasi; bukan klaim bahwa seluruh sistem sudah diuji atau siap produksi.

## 1. Model Mental Sistem

Proyek adalah satu aplikasi Next.js App Router: frontend dan backend berada dalam repository dan proses aplikasi yang sama. Tidak ada backend Express terpisah. PostgreSQL adalah layanan terpisah. Docker Compose saat ini hanya menjalankan database, bukan website atau mesin lab.

```text
Browser
  |-- navigasi halaman --> middleware (route yang cocok matcher)
  |                         --> Server Component --> guard --> service
  |-- submit form -------> Server Action ---------> guard --> service
  |-- fetch JSON --------> API Route Handler -----> guard --> service
                                                              |
                                                        Zod / Prisma
                                                              |
                                                         PostgreSQL

Autentikasi: AUTH_MODE=local    -> cookie development + Profile
             AUTH_MODE=supabase -> Supabase Auth + Profile
```

Halaman server dapat membaca service langsung; tidak wajib memanggil HTTP API milik aplikasi sendiri. Service ditandai `server-only`. Komponen client menangani interaksi dan menerima data yang sesuai untuk browser, bukan Prisma client atau kredensial server.

## 2. Urutan Membaca untuk AI Baru

1. `package.json`, `handover.md`: perintah, dependensi, dan setup.
2. `prisma/schema.prisma`: model dan constraint sebagai sumber kebenaran data.
3. `lib/auth/rbac.ts`, `lib/auth/guards.ts`, `middleware.ts`: akses dan identitas.
4. `lib/auth/local-session-core.ts`, `lib/auth/local-session.ts`, `lib/services/auth-service.ts`: perbedaan local/Supabase.
5. `app/rooms/[slug]/page.tsx`, `components/rooms/task-submit-form.tsx`, `lib/actions/learning-actions.ts`, `lib/services/task-service.ts`: contoh fitur dari UI sampai DB.
6. `app/rooms/[slug]/quiz/quiz-view.tsx`, `app/api/quizzes/submit/route.ts`, `lib/services/quiz-service.ts`: contoh jalur JSON API.
7. Service fitur yang akan diubah, schema Zod terkait, dan test relevan.
8. `components/app-shell.tsx`, `app/globals.css`: shell dan desain bila perubahan menyentuh UI.

Dokumen arsitektur lama di `docs/ARCHITECTURE.md` masih menyebut UI minimal; UI saat ini sudah memiliki tema CyberGuard. Periksa kode saat dokumen berbeda. Jangan memakai percakapan sebelumnya sebagai bukti state database, service aktif, atau hasil test terbaru.

## 3. Batas Tanggung Jawab

| Lapisan | Lokasi | Tanggung jawab dan kontrak |
| --- | --- | --- |
| Halaman | `app/**/page.tsx` | Guard server, ambil data, susun halaman |
| UI client | `components/`, `quiz-view.tsx` | State form, loading, error, navigasi; bukan otoritas role/skor |
| Server Actions | `lib/actions/` | Baca FormData, identitas, service, feedback dan revalidasi |
| HTTP API | `app/api/` | Query/body, guard, service, respons JSON |
| Validasi | `lib/validation/` | Bentuk input, batas nilai, enum |
| Service | `lib/services/` | Query, penilaian, mutasi, scope resource sesuai implementasi |
| Auth | `lib/auth/`, `lib/supabase/` | Identitas, profil, role, cookie/client Supabase |
| Persistensi | `lib/db/prisma.ts`, `prisma/` | Client ORM, schema dan migration |

Service tidak semuanya memanggil guard sendiri. Banyak service menerima `userId` yang sudah ditentukan pemanggil. Karena itu endpoint/action baru wajib mengambil identitas di server, bukan mempercayai `userId` dari request. Validasi Zod tidak menggantikan pemeriksaan hak akses resource.

`lib/db/prisma.ts` menyimpan instance Prisma pada `globalThis` dalam development untuk mengurangi pembuatan client akibat hot reload. Pertahankan pola ini saat menambah akses database.

## 4. Identitas dan Otorisasi

### Mode Supabase

- `getCurrentUser()` memanggil `supabase.auth.getUser()`.
- `Profile.id` memakai UUID identitas Supabase; ini pemetaan aplikasi, bukan relasi Prisma ke tabel `auth.users`.
- Registrasi membuat/upsert profil dengan default role `STUDENT` untuk profil baru.
- Middleware membaca role lewat Supabase `.from("Profile")`; guard server membaca profil lewat Prisma.
- Kedua akses tersebut harus menuju database/schema aplikasi yang selaras. RLS Supabase dapat memengaruhi pembacaan middleware.

### Mode Lokal

- Aktivasi hanya berdasarkan `AUTH_MODE === "local"`; tidak ada penolakan otomatis hanya karena `NODE_ENV=production`.
- Cookie `si_act_local_session` berisi JSON URL-encoded: `id`, `email`, `role`; bukan token bertanda tangan.
- Password 8-128 karakter hanya divalidasi, tidak diverifikasi terhadap password tersimpan.
- Login membentuk email `username@local.dev` dan dapat membuat profil baru jika email itu belum ada.
- Email profil seed berbeda dari email pencarian tersebut. Lihat handover utama untuk promosi akun lokal melalui Prisma Studio.
- Middleware memakai role cookie; guard membaca profil database. Logout/login diperlukan setelah perubahan role agar keduanya selaras.
- Local auth adalah fasilitas development, bukan pola yang boleh diterapkan untuk autentikasi publik.

### Hierarki dan Route

`hasRoleAccess()` menggunakan ranking `STUDENT < INSTRUCTOR < ADMIN`; daftar required roles berarti syarat minimum dengan logika any, bukan daftar role yang harus sama persis.

`requireRole()` memanggil `requireProfile()`, lalu memeriksa role dari database. Identitas hilang diarahkan ke `/login`; profil hilang ke `/login?error=missing-profile`; role ditolak ke `/dashboard?error=forbidden`.

Matcher middleware meliputi halaman auth tertentu, student, instructor, admin. **Tidak mencakup `/api/*`**. Proteksi API bergantung pada guard handler. Menyembunyikan menu di AppShell tidak melindungi endpoint.

## 5. Peta Relasi Data

```text
LearningPath 1 -> banyak Room
Room         1 -> banyak RoomTask
Room         1 -> 0/1 Quiz -> banyak QuizQuestion -> banyak QuizOption

Profile + Room     -> UserRoomProgress (unik userId + roomId)
Profile + RoomTask -> UserTaskSubmission (riwayat, boleh berkali-kali)
Profile + Quiz     -> UserQuizAttempt (riwayat, boleh berkali-kali)
Profile           -> banyak LeaderboardPoint (event poin)

Profile (instructor) -> banyak Class
Class + Profile     -> ClassMember (unik classId + userId)
Profile (author)     -> banyak Announcement
Profile + Room      -> banyak LabSession
```

`Room.quiz` satu per room karena `Quiz.roomId` unik. Urutan tugas/room/pertanyaan memakai `orderIndex`. `expectedAnswer` dan `QuizOption.isCorrect` adalah data penilaian server; query untuk peserta menghilangkan field tersebut pada jalur pembacaan terkait.

Banyak relasi memakai cascade delete. Penghapusan materi dapat ikut menghapus riwayat terkait; periksa `onDelete` sebelum menambah delete/archive. Author pengumuman memakai `Restrict`. `Room.createdById` dan `LearningPath.createdById` (nullable, `onDelete: SetNull`) mencatat pembuat konten. Aturan di `content-service.ts`: ADMIN bebas; INSTRUCTOR hanya untuk konten miliknya atau konten dengan `createdById` null (data seed/lama). Route API instruktur lama ikut memakai `assertCanManageRoom()`.

## 6. Alur Fitur yang Perlu Dipahami

### Jawaban Tugas

`task-submit-form.tsx` -> `submitTaskAnswerAction()` -> `requireRole(["STUDENT"])` -> `submitTaskAnswer(profile.id, input)`.

Service memvalidasi input, mengambil tugas, lalu membandingkan jawaban yang dinormalisasi (trim, lowercase, spasi ganda diringkas) dengan `expectedAnswer` dan setiap `acceptedAnswers`. Setiap percobaan dicatat. Jawaban benar memicu poin tugas lalu `recalculateRoomProgress()`. Tidak ada expected answer berarti hasil salah. Service mengembalikan jumlah percobaan salah dan status hint: `RoomTask.hint` ditampilkan ke peserta setelah `HINT_UNLOCK_AFTER_WRONG_ATTEMPTS` (2) percobaan salah, dihitung di server pada halaman room. Room yang belum dipublish menolak submit.

Action mengembalikan `{ tone, message }` dan merevalidasi room, progress, leaderboard bila `roomSlug` tersedia. `roomSlug` bukan bukti hak akses tugas.

### Kuis

`quiz-view.tsx` -> `POST /api/quizzes/submit` -> guard -> `submitQuizAttempt()`.

Input answers berbentuk map `questionId -> optionId`. Service menghitung persentase jawaban benar dan membandingkan `passingScore`, menyimpan attempt, lalu memanggil `recalculateRoomProgress()`. Lulus memberi poin sebesar `max(room.points, 0)` sekali per quiz. Respons menyertakan `review` per pertanyaan (jawaban peserta, jawaban benar, penjelasan) yang ditampilkan `quiz-view.tsx` setelah submit; ini keputusan produk agar peserta belajar dari pembahasan, dengan konsekuensi jawaban benar terlihat setelah attempt.

### Progress Memakai Satu Aturan

Sejak 16 September 2026 seluruh penulisan `UserRoomProgress` melewati `recalculateRoomProgress()` di `lib/services/progress-service.ts`:

- Setiap task bernilai satu unit, quiz (bila ada) satu unit.
- Unit task terpenuhi bila peserta pernah menjawab benar; unit quiz terpenuhi bila pernah lulus.
- Persentase = unit terpenuhi / total unit, dibulatkan, dan dibatasi 99 sampai benar-benar lengkap. `COMPLETED` hanya saat semua unit terpenuhi.
- Pemanggil: jawaban task benar, setiap attempt quiz, dan `PATCH /api/rooms` (`startRoomProgress()`, hanya menerima `roomId`; persentase dari client tidak lagi diterima).

Script `npm run prisma:backfill-content` menghitung ulang seluruh baris lama dengan aturan ini. Jangan menulis `UserRoomProgress` dari tempat lain.

### Poin

`addLeaderboardPoints()` melewati nilai nonpositif. Jika `sourceId` ada, service mencari event dengan `userId + sourceType + sourceId` sebelum membuat event. Ranking menjumlahkan event per user.

Pengecekan duplikat ini bukan jaminan atomik: schema belum memasang unique constraint untuk kombinasi tersebut. Request bersamaan dapat melewati pemeriksaan. Submission, poin, dan progress juga belum dibungkus satu transaksi bersama. Jangan mengklaim exactly-once atau rollback menyeluruh.

### Instruktur dan Admin

Query kelas/peserta instruktur discope melalui `instructorId` dan anggota kelas. Room builder memakai nested create Prisma untuk room beserta tugas `TEXT` dan mencatat `createdById`, lalu mengarahkan ke editor room. Seluruh mutasi konten lain berjalan lewat `lib/services/content-service.ts` yang menerima `actor` dari sesi server dan memeriksa kepemilikan sebelum menulis.

UI pengelolaan memakai action pada `lib/actions/instructor-actions.ts` dan `lib/actions/admin-actions.ts`; API terkait tetap ada. Saat memperbaiki fitur, periksa kedua entry point agar perubahan validasi/akses tidak hanya berlaku pada UI.

### Lab

`lab-session-service.ts` hanya menulis metadata/status PostgreSQL. Create memeriksa room published; get/stop peserta memakai `userId`. `PATCH /api/lab-sessions` membutuhkan instruktur, tetapi service update berdasarkan session ID tanpa scope kelas/pemilik. Tidak ada provider Docker/VM atau worker yang menjalankan mesin lab.

## 7. Kontrak Respons dan Refresh

- `jsonOk(data)` menghasilkan `{ data }`.
- `jsonError()` menghasilkan `{ error }`; Zod menghasilkan HTTP 422 dengan `details`.
- Status error umum default 400, tetapi beberapa handler memasok status lain; jangan menganggap semua API konsisten 401/403/404.
- `jsonError()` melempar ulang `NEXT_REDIRECT`, sehingga guard dapat menghasilkan redirect, bukan JSON auth error.
- Server Actions memakai state feedback sendiri; contoh learning action menangkap error secara umum, berbeda dari helper JSON yang mengenali redirect.
- Setelah mutasi, periksa penggunaan `revalidatePath()` dan `router.refresh()` pada jalur terkait. Data benar di DB belum tentu berarti halaman yang sedang terbuka sudah terbarui.

## 8. Batasan yang Terlihat dari Kode

Catatan ini adalah observasi static read, bukan hasil eksploitasi atau audit lengkap:

| Area | Kondisi sekarang | Implikasi untuk perubahan |
| --- | --- | --- |
| Publikasi materi | List/detail room memfilter published; `getRoomTasks(roomId)` dan submit task/quiz tidak menerapkan filter yang sama | Jangan menganggap ID valid berarti materi boleh diakses |
| Role vs resource | Konten path/room/task/quiz dicek kepemilikannya di `content-service.ts`; lab session PATCH dan kelas masih berbasis role saja | Gunakan pola `actor` + `requireManaged*` saat menambah mutasi baru |
| Progress | Satu aturan di `progress-service.ts` (semua task benar + quiz lulus) | Panggil `recalculateRoomProgress()`, jangan tulis `UserRoomProgress` langsung |
| Poin | Check-then-create tanpa unique constraint gabungan | Test concurrency dan constraint diperlukan bila diperkuat |
| Local auth | Cookie tidak ditandatangani, password tidak diverifikasi | Wajib gunakan autentikasi nyata untuk publik |
| Seed | Mengganti tugas/kuis, memperbarui demo progress, menambah lab session | Bukan migration atau import non-destruktif |

## 9. Panduan Mengubah Kode

| Permintaan | Mulai dari | Verifikasi relevan |
| --- | --- | --- |
| Sidebar/layout | `components/app-shell.tsx` (server), `components/app-shell-frame.tsx` (client), `app/globals.css`, `DESIGN.md` | Desktop/mobile, collapse, localStorage, drawer (fokus, Escape), overlap |
| Tampilan/komponen | `DESIGN.md`, token di `app/globals.css` + `tailwind.config.ts`, `components/card.tsx`, `components/paper/*` | Kontras, 390 px tanpa scroll horizontal, satu tombol cyan per tampilan |
| Login/role | Auth service, guards, middleware, sesi | Kedua auth mode, role cookie/DB, akses API |
| Tugas/kuis/poin | Service terkait, Zod, schema | Submission ulang, gagal/lulus, progress, poin |
| Room builder | Form, instructor action/service | Draft/publish, validasi tugas, scope akses |
| Schema | Prisma schema dan migration | Generate client, migration pada DB development |
| Lab nyata | Lab service dan API sebagai integrasi awal | Desain provider, ownership, expiry dan failure handling terlebih dahulu |

Gunakan pola lokal dan ubah fitur yang diminta. Pertahankan guard di server, jangan membocorkan kunci jawaban atau secret ke komponen client. Jangan mengubah seed untuk memperbaiki database pengguna secara diam-diam. Rekomendasi lab provider atau deployment bukan komponen yang sudah tersedia.

## 10. Pengujian dan Serah Terima Berikutnya

Perintah tersedia: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Smoke test membutuhkan PostgreSQL bermigrasi, membuat data sementara, dan membersihkannya. Test memeriksa role dasar, task, quiz, progress, dan poin pada alur sequential; tidak membuktikan concurrency, browser, Supabase end-to-end, atau ownership semua endpoint.

Hentikan dev server sebelum build agar tidak berbagi output `.next`. Jangan menyalakan atau mematikan layanan hanya untuk membaca dokumentasi. Catat pengujian yang benar-benar dijalankan, bukan menyalin hasil historis.

Saat menyerahkan perubahan ke AI berikutnya, sertakan: tujuan pengguna, file berubah, perilaku sebelum/sesudah, migration/env baru, hasil test aktual, pekerjaan tersisa, dan status proses bila memang diperiksa. Jangan sertakan isi `.env` atau token.

Prompt awal yang bisa dipakai:

> Baca handover.md dan docs/ARCHITECTURE-HANDOVER.md, lalu verifikasi file kode terkait sebelum mengubah fitur. Bedakan perilaku yang sudah diimplementasikan dari rekomendasi. Periksa git status, pertahankan perubahan pengguna, gunakan guard server dan pola service yang ada. Kerjakan permintaan saat ini, uji sesuai risiko, dan laporkan hasil aktual serta batasan yang belum diselesaikan.

## 11. Authoring Konten, Media, dan Rekam Jejak (ditambahkan 16 September 2026)

### Alur authoring

```text
/instructor/paths            -> LearningPathForm -> createLearningPathAction / updateLearningPathAction
/instructor/paths/[id]       -> daftar room di path, PublishToggleForm (toggleLearningPathPublishAction)
/instructor/rooms/new        -> RoomBuilderForm -> createInstructorRoomAction (createdById = actor) -> redirect editor
/instructor/rooms/[id]       -> RoomMetadataForm | MaterialEditor | TaskEditor | QuizEditor | PublishToggleForm
                                 -> lib/actions/content-actions.ts -> lib/services/content-service.ts -> Prisma
```

- Semua action memanggil `requireRole(["INSTRUCTOR"])` lalu meneruskan profil sebagai `actor`. Service memeriksa `canManageContent(actor, createdById)` sebelum menulis; pelanggaran melempar `ContentAccessError` yang ditampilkan sebagai pesan form.
- `getRoomForEditor()` mengembalikan `expectedAnswer` dan `QuizOption.isCorrect` karena hanya dipakai halaman instruktur. Jalur student (`getRoomBySlug`, `getQuizByRoomSlug`) tetap menyembunyikan kunci jawaban.
- Task dan pertanyaan quiz dinomori ulang (`orderIndex` 1..n) setiap kali dipindah atau dihapus. `QuizOption.orderIndex` menjaga urutan opsi; `updateQuizQuestion()` mengganti seluruh opsi dalam satu transaksi.
- `Room.content` disimpan bersama `Room.contentFormat` (`MARKDOWN` untuk data lama/seed, `HTML` untuk hasil editor visual). Sejak 21 Oktober 2026 editor materi adalah TipTap (lihat bagian 14); rendering ke student memakai `components/content/room-material.tsx`.

### Media

- `POST /api/media` (multipart, field `file`) menerima PNG/JPEG/GIF/WebP hingga 5 MB. Tipe ditentukan dari magic bytes, bukan header client. Hanya INSTRUCTOR/ADMIN; respons 401/403 dalam JSON, bukan redirect.
- Berkas disimpan oleh provider `lib/storage/local-storage.ts` di `storage/uploads/<uuid>.<ext>` (override dengan `UPLOAD_DIR`). Metadata disimpan di tabel `MediaAsset`.
- `GET /api/media/[id]` menyajikan berkas untuk user yang sudah login dengan `Cache-Control: private`. URL inilah yang disisipkan ke Markdown (`![alt](/api/media/<id>)`) atau ke `coverImageUrl`.
- Menghapus asset belum ada di UI; berkas yang tidak lagi direferensikan perlu dibersihkan manual.

### Rekam jejak student

- `/profile` menampilkan poin per sumber (`LeaderboardPoint.sourceType`), rank global (`getUserLeaderboardStanding`), streak (`getLearningStreak`), riwayat `UserTaskSubmission`, riwayat `UserQuizAttempt` beserta skor dan status lulus, serta progress room.
- Tidak ada perubahan pada aturan penilaian: task tetap dibandingkan sebagai string, quiz tetap persentase benar terhadap `passingScore`, dan poin tetap check-then-create tanpa unique constraint gabungan.

### Verifikasi yang dijalankan saat penambahan fitur

`npm run typecheck`, `npm run lint`, dan `npm test` lolos. Smoke test kini mencakup pembuatan path/room dengan pemilik, penolakan `ContentAccessError` untuk instruktur lain, override admin, validasi tepat satu opsi benar, dan urutan opsi pada jalur student. Alur browser diuji manual: buat path, buat room, upload gambar, simpan materi, buat quiz dua pertanyaan, publish, lalu dikerjakan sebagai student.

## 12. Jadwal Kemunculan Room dan Cover (ditambahkan 16 September 2026)

- Sumber kebenaran: `lib/learning/availability.ts` (`getRoomAvailability`) yang menghasilkan state `draft | upcoming | open | closed` dari `isPublished`, `availableFrom`, `availableUntil`. Modul ini bebas `server-only` sehingga dipakai halaman server, komponen client, dan service.
- Penegakan di server: `submitTaskAnswer()`, `submitQuizAttempt()`, dan `createLabSessionPlaceholder()` melempar `availabilityErrorMessage()` bila room tidak `open`. Halaman room, quiz, dan lab menampilkan notice untuk student; role INSTRUCTOR ke atas tetap dapat melihat isi room sebagai preview (submit dari akun tersebut tetap ditolak server).
- Form metadata room mengirim `availableFrom`/`availableUntil` sebagai ISO string. Input `datetime-local` dikonversi dengan `dateTimeLocalToIso()` memakai zona waktu tampilan (`NEXT_PUBLIC_TIME_ZONE`, default `Asia/Jakarta`) agar server dan browser sepakat. `roomMetadataSchema` menolak tanggal tutup yang tidak lebih besar dari tanggal buka dan tidak lagi menyertakan `content`, sehingga menyimpan metadata tidak menimpa materi.
- Daftar room untuk student (`listPublishedRooms`) tetap mengembalikan room terjadwal agar peserta melihat kapan room dibuka; penyaringan akses terjadi di halaman detail dan service, bukan di query daftar.
- Cover: `LearningPath.coverImageUrl` dan `Room.coverImageUrl` diisi lewat `ImageUploadField` (upload ke `/api/media`) dan dirender dengan `<img>` biasa karena URL media memerlukan cookie sesi yang tidak dikirim oleh optimizer `next/image`.

## 13. Komposisi Learning Path (ditambahkan 16 September 2026)

- Room selalu berada di tepat satu path (`Room.learningPathId` wajib). "Menambahkan room ke path" berarti memindahkannya dari path asal: `addRoomToLearningPath()` di `content-service.ts` membutuhkan hak kelola atas room **dan** path tujuan, menaruh room di urutan terakhir, lalu merapikan `orderIndex` path asal.
- `moveRoomInPath()` menukar urutan dua room bertetangga dan menomori ulang 1..n. Hak yang diperlukan adalah hak kelola atas path (bukan setiap room), karena penomoran ulang menyentuh semua room di path itu.
- UI: `components/instructor/path-rooms-editor.tsx` di halaman `/instructor/paths/[id]` menampilkan daftar modul dengan tombol Naik/Turun, dropdown room dari path lain (`listRoomsOutsidePath()`; room milik instruktur lain tampil tetapi tidak bisa dipilih), dan tautan ke Room Builder dengan `pathId` terisi.
- Field "Urutan di path" pada form metadata room tetap ada untuk mengatur angka secara manual; penomoran ulang dari editor path akan menimpanya.

## 14. Editor Materi Visual dan Sanitasi HTML (ditambahkan 21 Oktober 2026)

```text
/instructor/rooms/[id]  (server)
  roomMaterialToEditorHtml(content, contentFormat)   -> HTML bersih (Markdown lama dikonversi unified/remark)
  -> MaterialEditor (client form) -> RichTextEditor (TipTap) -> hidden input content + contentFormat=HTML
  -> updateRoomContentAction -> updateRoomContent -> prepareRichHtmlForStorage (sanitize + kosongkan bila hampa)

/rooms/[slug]  (server)
  RoomMaterial -> renderRoomMaterialHtml(content, contentFormat) -> sanitize + bungkus tabel -> dangerouslySetInnerHTML
```

- `lib/content/rich-text.ts` (server-only) adalah satu-satunya tempat sanitasi. Allowlist tag, atribut, kelas, dan gaya mengikuti output TipTap; gaya inline dibatasi ke `color`/`background-color` (hex, rgb, rgba), `font-size` 8-96 px, `font-family` (huruf, angka, spasi, koma, kutip, tanda hubung), `text-align`, serta `width`/`min-width` px untuk tabel. `img` hanya `/api/media/<uuid>` atau `https://`. Link http(s) diberi `target=_blank` dan `rel=noopener noreferrer nofollow`. Checkbox daftar centang selalu `disabled` di tampilan student.
- `lib/content/rich-text-config.ts` berisi konstanta bersama client dan server (font, ukuran, palet, validasi URL). Tambah opsi baru di sini, lalu pastikan polanya lolos allowlist di `rich-text.ts` (tes "Rich text material" di smoke test memeriksa format utama tetap utuh).
- `components/content/room-material.tsx` adalah satu-satunya sink `dangerouslySetInnerHTML` untuk materi. Jangan merender `Room.content` di tempat lain tanpa melewati `renderRoomMaterialHtml`.
- `components/editor/rich-text-editor.tsx` memakai `immediatelyRender: false` untuk SSR Next.js, `useEditorState` untuk status toolbar (TipTap 3 tidak re-render tiap transaksi), dan `handlePaste`/`handleDrop` untuk upload gambar. Item daftar centang di editor dirender lewat node view tanpa atribut `data-type`, sehingga CSS memakai selektor `ul[data-type="taskList"] > li`.
- Isi editor kosong (`<p></p>`) disimpan sebagai string kosong agar indikator "Materi kosong/ada" tetap akurat.
- Satu-satunya jalur aplikasi yang menulis `Room.content` adalah `updateRoomContent()` (kolom `content` dihapus dari `roomDraftSchema`, sehingga Room Builder dan `POST/PATCH /api/instructor/rooms` tidak bisa menulis materi). Seed dan backfill menulis Markdown dengan `contentFormat = MARKDOWN` eksplisit.
- `markdownToHtml()` memakai `remark-rehype` dengan `allowDangerousHtml` lalu plugin `rehypeLegacyMarkdownCompat` yang mengubah node `raw` menjadi teks (perilaku react-markdown lama), mengganti gambar tak diizinkan dengan link, memetakan task list GFM ke markup TipTap, membuka `<p><img></p>`, dan membuang baris baru di akhir blok kode. Sanitizer memetakan `h5/h6` ke `h4`, `align` sel tabel ke `text-align`, dan `font-size` pt ke px; spasi beruntun di luar kode disimpan sebagai `&nbsp;`.
- `prepareRichHtmlForStorage()` membuang paragraf kosong di akhir dokumen (dari TrailingNode) secara linear; jangan ganti dengan regex bertingkat karena berisiko backtracking kuadratik pada input besar.
- `renderRoomMaterialHtml()` menambah penyesuaian khusus tampilan: pembungkus `.table-scroll`, penggandaan `<br>` di akhir blok agar baris kosong terlihat seperti di editor, dan label `sr-only` "Done:/Not done:" untuk checkbox.
- Editor: `transformPastedHTML` memakai `lib/content/paste-normalize.ts`; `handlePaste` hanya mengunggah bila clipboard benar-benar berisi gambar saja (`isPureImagePaste`); `onCreate` mengirim transaksi kosong sebelum mengambil baseline agar paragraf penutup otomatis tidak dianggap perubahan. Setelah simpan, `MaterialEditor` membandingkan struktur dokumen (`generateJSON`) antara yang dikirim dan yang tersimpan, dan hanya menyelaraskan editor bila server benar-benar membuang sesuatu.
- Review terstruktur 21 Oktober 2026 (keamanan, kesetiaan format, integrasi React/TipTap, data, tampilan) menghasilkan 33 temuan: 32 terkonfirmasi verifikator dan sudah diperbaiki, 1 sudah tertutup oleh perubahan sebelumnya. Fuzzing keamanan tidak menemukan bypass XSS pada sanitizer.
- Konfigurasi editor yang disengaja: `enableInputRules` hanya untuk ekstensi blok (daftar, judul, kutipan, blok kode, garis) dan `enablePasteRules: ["link"]`, karena aturan inline TipTap memakan `*`, `_`, `==`, `~~` pada perintah/kode. Link `shouldAutoLink` hanya menerima URL `http(s)://`. Gambar memakai `resize` bawaan TipTap; CSS pegangan ada di `globals.css` (`[data-resize-handle]`).
- `MaterialEditor` melacak status belum-disimpan dengan `editor.state.doc.eq(baseline)` dan membentuk HTML hanya di `onSubmit` (React membentuk FormData setelah `onSubmit`), sehingga mengetik tetap ringan pada materi panjang. Panjang HTML dicek ulang setelah jeda 600 ms.
- `paste-normalize.ts` juga mengubah paragraf daftar Word (`mso-list`) menjadi `ul/ol/li` bersarang dan menerapkan kelas gaya sel Excel (`.xlNN`) ke sel tabel.
- Perubahan ini bersifat forward-only: kode lama tidak mengenal `contentFormat = HTML`. Lihat catatan rollback di handover utama.

## 15. Sistem Desain dan Aturan Tampilan (ditambahkan 21 Oktober 2026)

Sumber kebenaran tampilan adalah `DESIGN.md` (token, tipografi, komponen, aturan bernama) dan `.impeccable/design.json`; kontrak arah ada di `.impeccable/surfaces/app-layout-tsx.md`, kebenaran produk di `PRODUCT.md`.

- **Token**: variabel CSS berformat `R G B` di `:root` (`app/globals.css`) dipetakan di `tailwind.config.ts` dengan `rgb(var(--x) / <alpha-value>)`, sehingga modifier opasitas (`bg-cyan-soft/60`) tetap jalan. Jangan menulis hex langsung di komponen; tambah token bila perlu warna baru.
- **Aturan yang dijaga**: cyan (`.btn-primary`, `bg-cyan`) hanya untuk satu langkah berikutnya/aksi utama per tampilan; tinta stempel hanya untuk state (violet selesai, hijau benar, merah ulangi/tutup/error, amber terjadwal); `.field-label` hanya sebagai label data/kolom, bukan eyebrow di atas judul; tidak ada glow, gradien teks, glass, atau bayangan offset keras; mono hanya untuk kode.
- **AppShell**: `components/app-shell.tsx` adalah server component async yang memanggil `getCurrentProfile()` untuk kartu anggota, lalu merender `AppShellFrame` (client). `getCurrentUser` dan `getCurrentProfile` di `lib/auth/guards.ts` dibungkus `cache()` dari React agar guard halaman dan AppShell berbagi satu pencarian per request. AppShell sudah merender `h1` halaman (judul, subjudul, `actions`); halaman tidak boleh menambah `h1` lain.
- **Emblem dan stempel**: `PathRosette` dibuat deterministik dari slug (FNV-1a), gelombang didefinisikan sekali di `<defs>` lalu diulang dengan `<use>` agar HTML kecil; garis memakai `vector-effect: non-scaling-stroke`. `Stamp` punya animasi `stamp-strike` (dimatikan pada `prefers-reduced-motion`); pakai `strike` hanya untuk penyelesaian yang baru terjadi (dashboard memakai jendela 15 menit). `StateStamp` tanpa efek aus agar teks kecil tetap kontras.
- **Materi**: hanya `RoomMaterial` (`components/content/room-material.tsx`) yang merender HTML materi; opsi `headingOffset` menggeser level heading lewat `aria-level` (`nestRichHtmlHeadings` di `lib/content/rich-text.ts`) tanpa mengubah tag, sehingga tampilan editor dan student tetap identik. Pengaman keterbacaan warna (palet lama → baru, penggelapan warna terang, buang latar terlalu gelap) berjalan di jalur sanitasi untuk render dan muat editor; isi database tidak diubah sampai instruktur menyimpan ulang.
- **Format**: tanggal lewat `lib/format/date.ts` dan `formatScheduleDate` (bulan tiga huruf, zona "WIB/WITA/WIT" dari `NEXT_PUBLIC_TIME_ZONE`); nomor anggota bergaya seri `ACT · XXXX · XXXX` dari `lib/format/member.ts` (turunan id profil). Urutan kesulitan lewat `sortByDifficulty`; poin yang ditampilkan lewat `earnablePoints`; peringkat leaderboard memakai peringkat kompetisi di `lib/services/leaderboard-service.ts`.
- **Tabel di layar sempit**: `.overflow-x-auto` dan `.table-scroll` diberi `position: relative` di `globals.css` agar label `sr-only` di dalam tabel tidak melebarkan halaman. Grid responsif memakai `grid-cols-1` sebagai dasar agar kolom tidak melebar karena konten.
