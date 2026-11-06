import Link from "next/link";
import { StatusPill } from "@/components/card";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { PublicShell } from "@/components/public-shell";

/** Contoh riwayat untuk pengunjung. Diberi label "Example" di halaman; bukan progres siapa pun. */
const EXAMPLE_COMPLETIONS: CompletionEntry[] = [
  // fresh: centang contoh digambar sekali saat halaman dibuka, sama seperti centang baru di dashboard.
  { id: "example-room-1", kind: "room", title: "Introduction to HTTP", date: "3 Oct 2026", fresh: true },
  { id: "example-quiz-1", kind: "quiz-pass", title: "Introduction to HTTP", score: 90, date: "3 Oct 2026" },
  { id: "example-quiz-2", kind: "quiz-retry", title: "Linux Command Line Basics", score: 60, date: "9 Oct 2026" }
];

const ROOM_STEPS = [
  { title: "Read the walkthrough", body: "Each room starts with material written by the community's instructors." },
  { title: "Answer the tasks", body: "Short practice questions. A hint unlocks after two wrong attempts." },
  { title: "Pass the quiz", body: "Check your understanding and review every question afterwards." },
  { title: "Track your progress", body: "Passed rooms get a check mark, quiz scores are saved, and points count toward the leaderboard." }
];

/**
 * Halaman depan publik: bar atas (logo, nama, tombol tema), judul dengan dua pintu masuk di samping panel
 * cara kerja room, lalu contoh daftar progres berlabel. Tanpa gradasi: dasar rata dengan panel bersambungan tipis.
 */
export default function HomePage() {
  return (
    <PublicShell brandHref={null}>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,27.5rem)] lg:gap-16 lg:pt-20">
          <div className="min-w-0">
            <h1 className="text-[2.375rem] font-bold leading-[1.05] tracking-[-0.028em] text-ink [text-wrap:balance] sm:text-5xl lg:text-[3.25rem]">
              Learn cybersecurity at your own pace
            </h1>
            <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-2">
              Learning paths made of rooms, written and run by the Anon Cyber Team community. Read, practise, pass the quiz, and
              see your progress add up.
            </p>
            <nav aria-label="Account" className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary min-h-11 px-6 text-[0.9375rem]">
                Sign in
              </Link>
              <Link href="/register" className="btn-secondary min-h-11 px-6 text-[0.9375rem]">
                Create account
              </Link>
            </nav>
          </div>

          {/* Urutan satu room sebagai daftar berhenti, kosakata yang sama dengan daftar room path di dashboard. */}
          <section className="sheet px-5 pb-1 pt-4 sm:px-6" aria-labelledby="how-title">
            <h2 id="how-title" className="border-b border-line pb-3 text-lg font-bold leading-snug text-ink">
              How a room works
            </h2>
            <ol className="divide-y divide-line">
              {ROOM_STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3.5">
                  <span
                    className="figure mt-px grid h-7 w-7 place-items-center rounded-full border border-line-strong text-[0.6875rem] font-bold text-ink-3"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display font-semibold leading-snug text-ink">{step.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="sheet mt-14 px-5 pb-2 pt-4 sm:px-6 lg:mt-16" aria-labelledby="progress-example-title">
          <div className="border-b border-line pb-3">
            <div className="flex items-start justify-between gap-3">
              <h2 id="progress-example-title" className="min-w-0 text-lg font-bold leading-snug text-ink">
                Your progress, at a glance
              </h2>
              {/* Label wajib: daftar di bawah ini contoh, bukan data anggota. */}
              <StatusPill className="mt-0.5 shrink-0">Example</StatusPill>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-ink-2">
              Passed rooms get a check, quizzes show your score, and anything to retry is marked. Your own list starts empty.
            </p>
          </div>
          <div className="pt-1">
            <CompletionList entries={EXAMPLE_COMPLETIONS} next="Authentication Concepts" />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
