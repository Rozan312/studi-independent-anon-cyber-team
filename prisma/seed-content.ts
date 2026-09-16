/**
 * Materi Markdown dan hint untuk room seed. Dipakai oleh prisma/seed.ts dan oleh
 * script backfill agar database yang sudah ada ikut terisi tanpa menghapus data.
 * Semua materi bersifat konseptual dan defensif; contoh perintah hanya bersifat baca.
 */

export const roomContentBySlug: Record<string, string> = {
  "introduction-to-http": `# Introduction to HTTP

HTTP adalah protokol yang dipakai browser dan server web untuk saling bertukar data. Memahami alurnya membantu Anda membaca log web, meninjau konfigurasi, dan mengenali perilaku yang tidak normal.

## Request dan response

- **Request** dikirim oleh browser (client) ke server. Isinya: method (misalnya \`GET\` atau \`POST\`), path yang diminta, header, dan kadang body.
- **Response** dikirim balik oleh server. Isinya: status code, header, dan body seperti HTML atau JSON.
- **Headers** membawa metadata, misalnya \`Content-Type\` yang memberi tahu format body.

## Kelompok status code

| Kelompok | Arti | Contoh |
| --- | --- | --- |
| 2xx | Permintaan berhasil | 200 OK, 201 Created |
| 3xx | Pengalihan | 301, 302 |
| 4xx | Kesalahan di sisi client | 404 Not Found, 403 Forbidden |
| 5xx | Kesalahan di sisi server | 500, 503 |

## Latihan aman

Perintah berikut hanya membaca header dari situs latihan Anda sendiri, tanpa mengubah apa pun:

\`\`\`bash
curl -I http://localhost:3000/login
\`\`\`

Perhatikan baris pertama (status code) dan header \`content-type\`.

> Kerjakan task di bawah dengan istilah bahasa Inggris seperti yang dipakai di materi ini.`,

  "linux-command-line-basics": `# Linux Command Line Basics

Shell adalah pintu utama untuk mengoperasikan server Linux. Kebiasaan yang baik di shell adalah fondasi keamanan operasional.

## Prinsip least privilege

**Least privilege** berarti setiap akun dan proses hanya mendapat hak akses yang benar-benar dibutuhkan untuk tugasnya. Akun **administrator** (di Linux disebut \`root\`) sebaiknya tidak dipakai untuk pekerjaan harian karena satu kesalahan ketik bisa berdampak ke seluruh sistem.

## Membaca izin file

\`\`\`bash
ls -la /etc/passwd
# -rw-r--r-- 1 root root 2847 Jan 10 09:12 /etc/passwd
\`\`\`

Tiga kelompok huruf \`rwx\` menunjukkan izin untuk pemilik, grup, dan pengguna lain. File di atas bisa dibaca semua orang, tetapi hanya \`root\` yang bisa mengubahnya.

## Kebiasaan lab yang aman

1. Kerjakan latihan hanya di mesin latihan, bukan sistem produksi.
2. Catat perintah dan perubahan yang Anda buat.
3. Gunakan \`sudo\` hanya untuk perintah yang memang butuh hak lebih tinggi, bukan login sebagai root.
4. Hormati batas scope yang diberikan instruktur.`,

  "authentication-concepts": `# Authentication Concepts

Sebelum sistem memutuskan apa yang boleh Anda lakukan, sistem harus tahu **siapa Anda**. Proses itulah **authentication**.

## Authentication vs authorization

- **Authentication**: membuktikan identitas, misalnya dengan password, kode OTP, atau kunci perangkat.
- **Authorization**: menentukan hak akses setelah identitas terbukti. Dibahas di room Broken Access Control Basics.

## Faktor verifikasi

| Faktor | Contoh |
| --- | --- |
| Sesuatu yang Anda tahu | password, PIN |
| Sesuatu yang Anda punya | ponsel dengan aplikasi OTP, security key |
| Sesuatu yang melekat pada Anda | sidik jari, wajah |

**Multi-factor authentication (MFA)** menggabungkan minimal dua faktor berbeda. Jika password bocor, penyerang tetap butuh faktor kedua.

## Sesi yang aman

Setelah login, server memberi **session** (cookie atau token). Praktik defensif: masa berlaku terbatas, cookie bertanda \`HttpOnly\` dan \`Secure\`, serta logout yang benar-benar mencabut sesi.

> Hindari password yang sama di banyak layanan dan jangan berbagi akun. Keduanya melemahkan authentication.`,

  "broken-access-control-basics": `# Broken Access Control Basics

**Authorization** adalah keputusan tentang apa yang boleh diakses oleh pengguna yang sudah terautentikasi. Kesalahan di sini disebut *broken access control*, salah satu kategori risiko paling umum pada aplikasi web.

## Contoh skenario mainan

Aplikasi SafeShop menampilkan profil lewat URL \`/profile?id=1001\`. Jika server hanya memeriksa "apakah pengguna sudah login" lalu mengembalikan profil \`id=1002\` saat diminta, berarti pemeriksaan kepemilikan tidak ada. Ini kesalahan authorization, bukan authentication.

## Prinsip defensif

1. Keputusan akses dibuat di **server**, bukan dengan menyembunyikan tombol di browser.
2. Setiap permintaan ke objek privat harus melewati **server-side authorization**: apakah pengguna ini pemilik atau berhak atas resource ini?
3. Gunakan *deny by default*: yang tidak diizinkan secara eksplisit berarti ditolak.
4. Catat penolakan akses agar bisa ditinjau.

## Checklist review

- Apakah setiap endpoint memeriksa identitas **dan** kepemilikan?
- Apakah ID resource bisa ditebak dan diganti?
- Apakah peran (role) diperiksa ulang di server untuk aksi admin?`,

  "log-analysis-fundamentals": `# Log Analysis Fundamentals

Log adalah catatan kejadian yang dihasilkan sistem, aplikasi, dan perangkat jaringan. Analis SOC membaca log untuk membedakan aktivitas normal dari anomali.

## Field yang hampir selalu ada

- **Timestamp**: waktu kejadian. Tanpa ini, event tidak bisa diurutkan menjadi timeline.
- Sumber: host, aplikasi, atau alamat asal.
- Aktor: pengguna atau proses yang melakukan aksi.
- Aksi dan hasil: login berhasil, login gagal, file dibuka, dan seterusnya.

## Contoh log tersanitasi

\`\`\`text
2026-09-16T08:01:12Z auth  user=alice  action=login  result=success  src=10.0.0.15
2026-09-16T08:01:40Z auth  user=alice  action=login  result=failure src=10.0.0.15
2026-09-16T08:01:41Z auth  user=alice  action=login  result=failure src=10.0.0.15
\`\`\`

Dua kegagalan berurutan setelah login sukses dari alamat yang sama belum tentu serangan, tetapi patut dicek.

## Label triase

| Label | Arti |
| --- | --- |
| Normal | Sesuai pola yang diharapkan |
| **Suspicious** | Perlu ditinjau, belum terbukti berbahaya |
| Malicious | Terkonfirmasi berbahaya |

> Event yang tidak pasti didokumentasikan dan ditriase, bukan dihapus atau diabaikan.`,

  "network-traffic-basics": `# Network Traffic Basics

Untuk membaca lalu lintas jaringan, Anda cukup memahami tiga konsep: alamat, port, dan protokol.

## Protokol

**Protocol** adalah aturan yang disepakati agar dua sistem bisa berkomunikasi. HTTP mengatur percakapan web, DNS mengatur penerjemahan nama ke alamat, TCP mengatur pengiriman data yang andal.

## Port

Satu host bisa menjalankan banyak layanan. **Port** adalah nomor yang membedakan layanan tersebut.

| Port | Layanan umum |
| --- | --- |
| 22 | SSH |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |

## Membaca metadata koneksi secara aman

Perintah berikut hanya menampilkan koneksi pada mesin Anda sendiri:

\`\`\`bash
ss -tulpn
\`\`\`

Kolom *Local Address:Port* menunjukkan layanan yang mendengarkan. Layanan yang tidak Anda kenal patut ditinjau.

> Menganalisis metadata (siapa berbicara ke siapa, lewat port apa) sering kali cukup untuk menemukan anomali tanpa membaca isi paket.`,

  "security-monitoring-basics": `# Security Monitoring Basics

Tim monitoring menerima banyak alert setiap hari. Tanpa proses yang rapi, alert penting bisa tenggelam.

## Triage

**Triage** adalah proses memilah dan memprioritaskan alert: mana yang harus ditangani sekarang, mana yang bisa menunggu, mana yang ternyata false positive. Istilah ini dipinjam dari dunia medis.

## Severity

Severity (rendah, sedang, tinggi, kritis) membantu memutuskan urutan penanganan. Severity bukan kebenaran mutlak; analis tetap memeriksa konteksnya.

## Escalation

Jika alert membutuhkan keahlian atau wewenang lebih, analis melakukan **escalation**: meneruskannya ke responder yang lebih senior atau tim spesialis, lengkap dengan catatan yang sudah dikumpulkan.

## Kualitas sinyal

- Alert yang terlalu sering berbunyi tanpa alasan (noise) perlu ditune.
- Setiap alert idealnya punya *runbook*: langkah pertama yang harus dilakukan.
- Dokumentasikan keputusan triase agar bisa dipelajari kembali.`,

  "incident-response-basics": `# Incident Response Basics

Respons insiden adalah siklus, bukan reaksi sesaat. Kerangka yang umum dipakai memiliki fase berikut.

## Fase siklus

1. **Preparation**: kesiapan sebelum insiden. Menyusun playbook, daftar kontak, tooling, dan latihan.
2. Detection and analysis: mengenali dan memahami insiden.
3. Containment: membatasi dampak.
4. Eradication and recovery: menghilangkan penyebab dan memulihkan layanan.
5. Lessons learned: mengevaluasi apa yang berjalan baik dan apa yang perlu diperbaiki.

## Dokumentasi

**Documentation** menjaga keputusan, observasi, dan timeline tetap tercatat. Manfaatnya: koordinasi tim lebih jelas, laporan akhir lebih akurat, dan pembelajaran bisa diulang.

## Komunikasi

Tentukan sejak awal siapa yang berhak berbicara ke manajemen, pengguna, atau pihak luar. Informasi yang tidak terkoordinasi memperburuk insiden.

> Fase preparation sering diabaikan padahal menentukan seberapa tenang tim saat insiden benar-benar terjadi.`,

  "secure-password-policy": `# Secure Password Policy

Kebijakan password yang baik melindungi pengguna tanpa membuat mereka frustrasi.

## Penyimpanan password

Password tidak boleh disimpan sebagai teks biasa. Gunakan **hashing** satu arah dengan algoritma yang dirancang untuk password, misalnya bcrypt atau Argon2, ditambah *salt* unik per pengguna. Jika database bocor, penyerang tidak langsung mendapat password asli.

## Aturan kebijakan yang masuk akal

- Panjang minimal lebih penting daripada aturan karakter yang rumit.
- Tolak password yang sudah pernah bocor.
- Dorong penggunaan password manager dan MFA.
- Jangan paksa ganti password berkala tanpa indikasi kompromi.

## Pemulihan akun

Fitur "lupa password" adalah jalur serangan favorit. Sebelum kredensial diubah, sistem wajib melakukan **identity verification**: memastikan pemohon memang pemilik akun, misalnya lewat tautan berbatas waktu ke email terdaftar atau faktor kedua.

> Kebijakan yang aman adalah kebijakan yang benar-benar diikuti pengguna.`,

  "web-application-security-review": `# Web Application Security Review

Review keamanan aplikasi web bisa dimulai dengan checklist sederhana. Room ini merangkum empat area yang paling sering bermasalah.

## 1. Validation

**Validation** memeriksa tipe, panjang, dan format data sebelum data dipakai. Lakukan di server; validasi di browser hanya untuk kenyamanan pengguna.

\`\`\`text
username: huruf, angka, garis bawah; 3-32 karakter
email   : format email yang valid
jumlah  : bilangan bulat 1-100
\`\`\`

## 2. Authentication

Password di-hash, MFA tersedia, sesi berbatas waktu, dan pembatasan percobaan login.

## 3. Authorization

Setiap aksi memeriksa hak akses di server, termasuk kepemilikan resource.

## 4. Logging

**Audit log** mencatat siapa melakukan apa dan kapan untuk aksi penting: login, perubahan role, perubahan data sensitif. Catatan ini mendukung akuntabilitas dan investigasi. Jangan mencatat password atau token di log.

> Simpan checklist ini dan pakai ulang setiap kali meninjau fitur baru.`
};

export type SeedTaskHint = { hint: string; acceptedAnswers: string[] };

/** Hint dan jawaban alternatif per room, dipetakan dari judul task. */
export const taskHintsByRoomSlug: Record<string, Record<string, SeedTaskHint>> = {
  "introduction-to-http": {
    "Identify a successful response code": {
      hint: "Kode status dikelompokkan per ratusan. Kelompok yang berarti permintaan berhasil dimulai dengan angka 2. Tulis kelompoknya, bukan satu kode saja.",
      acceptedAnswers: ["2xx family", "200"]
    },
    "Map request and response responsibilities": {
      hint: "Data yang dikirim browser ke server adalah permintaan. Istilah bahasa Inggrisnya ada di tabel materi.",
      acceptedAnswers: ["http request"]
    }
  },
  "linux-command-line-basics": {
    "Recognize least privilege": {
      hint: "Prinsipnya: beri akses sesedikit mungkin yang dibutuhkan. Dua kata bahasa Inggris; kata pertama berarti 'paling sedikit'.",
      acceptedAnswers: ["principle of least privilege", "least-privilege"]
    },
    "Understand permission categories": {
      hint: "Akun dengan hak penuh atas sistem sebaiknya tidak dipakai untuk pekerjaan harian. Di Windows disebut administrator, di Linux root.",
      acceptedAnswers: ["admin", "root", "superuser"]
    }
  },
  "authentication-concepts": {
    "Separate authentication and authorization": {
      hint: "Membuktikan siapa Anda disebut authentication; menentukan apa yang boleh Anda akses disebut authorization. Task ini menanyakan yang pertama.",
      acceptedAnswers: ["authn"]
    },
    "Recognize account protection": {
      hint: "Kontrol ini menambah faktor verifikasi kedua, misalnya kode OTP di ponsel. Singkatannya MFA.",
      acceptedAnswers: ["mfa", "multi factor authentication", "multifactor authentication", "2fa", "two-factor authentication"]
    }
  },
  "broken-access-control-basics": {
    "Identify authorization": {
      hint: "Setelah identitas terbukti, sistem memutuskan apa yang boleh diakses. Itulah authorization.",
      acceptedAnswers: ["authz"]
    },
    "Review safe object access": {
      hint: "Pengecekan kepemilikan harus terjadi di server, bukan di browser. Gabungkan lokasi pengecekan (server-side) dengan istilah authorization.",
      acceptedAnswers: ["server side authorization", "server-side authorization check", "server-side access control"]
    }
  },
  "log-analysis-fundamentals": {
    "Identify a timestamp": {
      hint: "Field yang mencatat waktu kejadian membuat analis bisa mengurutkan event. Satu kata bahasa Inggris.",
      acceptedAnswers: ["time stamp"]
    },
    "Classify an event": {
      hint: "Belum terbukti berbahaya tetapi patut dicurigai dan perlu ditinjau. Lihat tabel label triase di materi.",
      acceptedAnswers: ["suspicious event", "suspicious activity"]
    }
  },
  "network-traffic-basics": {
    "Recognize protocol purpose": {
      hint: "Aturan yang disepakati agar dua sistem bisa berkomunikasi, contohnya HTTP, DNS, dan TCP.",
      acceptedAnswers: ["network protocol", "communication protocol"]
    },
    "Identify network metadata": {
      hint: "Nomor yang membedakan layanan pada satu host, misalnya 80 untuk HTTP dan 443 untuk HTTPS.",
      acceptedAnswers: ["port number", "tcp port"]
    }
  },
  "security-monitoring-basics": {
    "Define alert triage": {
      hint: "Istilah yang dipinjam dari dunia medis: memilah dan memprioritaskan mana yang harus ditangani lebih dulu.",
      acceptedAnswers: ["alert triage"]
    },
    "Identify escalation": {
      hint: "Meneruskan alert ke responder yang lebih senior atau spesialis. Kata bahasa Inggrisnya berakar dari 'menaikkan'.",
      acceptedAnswers: ["escalate", "alert escalation"]
    }
  },
  "incident-response-basics": {
    "Identify preparation": {
      hint: "Fase paling awal siklus respons insiden: menyiapkan playbook, tooling, dan kontak sebelum insiden terjadi.",
      acceptedAnswers: ["preparation phase"]
    },
    "Recognize documentation": {
      hint: "Aktivitas mencatat keputusan, observasi, dan timeline agar bisa ditinjau kembali.",
      acceptedAnswers: ["documenting", "incident documentation"]
    }
  },
  "secure-password-policy": {
    "Recognize password storage": {
      hint: "Transformasi satu arah yang mengubah password menjadi nilai yang tidak bisa dibalik. Contoh algoritmanya bcrypt dan Argon2.",
      acceptedAnswers: ["hash", "password hashing", "salted hashing"]
    },
    "Identify recovery safety": {
      hint: "Sebelum kredensial diganti, sistem harus memastikan pemohon memang pemilik akun. Dua kata: identity dan ...",
      acceptedAnswers: ["verify identity", "identity check", "verification of identity"]
    }
  },
  "web-application-security-review": {
    "Identify validation": {
      hint: "Memeriksa tipe, panjang, dan format data sebelum dipakai. Area nomor satu di checklist materi.",
      acceptedAnswers: ["input validation", "data validation"]
    },
    "Recognize audit logging": {
      hint: "Catatan siapa melakukan apa dan kapan, dipakai untuk akuntabilitas dan investigasi.",
      acceptedAnswers: ["audit logs", "audit logging", "audit trail"]
    }
  }
};
