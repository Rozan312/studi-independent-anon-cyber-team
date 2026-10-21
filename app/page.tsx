import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { CircuitField, CircuitStrip } from "@/components/paper/circuit";

/** Contoh riwayat untuk pengunjung. Diberi label "Example" di halaman; bukan progres siapa pun. */
const EXAMPLE_COMPLETIONS: CompletionEntry[] = [
  { id: "example-room-1", kind: "room", title: "Introduction to HTTP", date: "3 Oct 2026" },
  { id: "example-quiz-1", kind: "quiz-pass", title: "Introduction to HTTP", score: 90, date: "3 Oct 2026" },
  { id: "example-quiz-2", kind: "quiz-retry", title: "Linux Command Line Basics", score: 60, date: "9 Oct 2026" }
];

const ROOM_STEPS = [
  { title: "Read the walkthrough", body: "Each room starts with material written by the community's instructors." },
  { title: "Answer the tasks", body: "Short practice questions. A hint unlocks after two wrong attempts." },
  { title: "Pass the quiz", body: "Check your understanding and review every question afterwards." },
  { title: "Track your progress", body: "Passed rooms get a check mark, quiz scores are saved, and points count toward the leaderboard." }
];

/** Halaman depan publik: identitas komunitas, cara kerja room, contoh daftar progres, dan dua pintu masuk. */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="digital-surface relative overflow-hidden border-b border-line">
        {/* Jalur sirkuit di sisi kanan hero, memudar ke arah teks. */}
        <CircuitField className="pointer-events-none absolute inset-y-0 right-0 h-full w-[70%] opacity-60 [mask-image:linear-gradient(to_left,black_35%,transparent)] sm:opacity-100 lg:w-[55%]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pb-20">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <span className="text-base font-bold tracking-[-0.01em] text-ink">Anon Cyber Team</span>
          </div>

          <div className="mt-12 max-w-xl lg:mt-20">
            <h1 className="text-[2.25rem] font-bold leading-[1.08] tracking-[-0.025em] text-ink [text-wrap:balance] sm:text-5xl">
              Learn cybersecurity at your own pace
            </h1>
            <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-ink-2">
              Learning paths made of rooms, written and run by the Anon Cyber Team community. Read, practise, pass the quiz, and
              see your progress add up.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary min-h-11 px-6 text-[0.9375rem]">
                Sign in
              </Link>
              <Link href="/register" className="btn-secondary min-h-11 px-6 text-[0.9375rem]">
                Create account
              </Link>
            </div>
          </div>
        </div>
        <CircuitStrip className="relative border-t border-line-soft bg-paper/40" />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pt-14">
        <section aria-labelledby="how-title">
          <h2 id="how-title" className="text-xl font-bold tracking-[-0.012em] text-ink">
            How a room works
          </h2>
          <ol className="sheet mt-4 grid grid-cols-1 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
            {ROOM_STEPS.map((step, index) => (
              <li key={step.title} className="border-b border-line-soft p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
                <p className="flex items-baseline gap-2.5 font-semibold text-ink">
                  <span className="figure w-5 shrink-0 text-sm font-bold text-ink-3" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1 pl-[1.875rem] text-sm leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12" aria-labelledby="progress-example-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="progress-example-title" className="text-xl font-bold tracking-[-0.012em] text-ink">
              Your progress, at a glance
            </h2>
            <span className="field-label rounded border border-line-strong px-1.5 py-0.5">Example</span>
          </div>
          <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-2">
            Passed rooms get a check, quizzes show your score, and anything to retry is marked. Your own list starts empty.
          </p>
          <div className="sheet mt-4 p-3 sm:p-4">
            <CompletionList entries={EXAMPLE_COMPLETIONS} next="Authentication Concepts" />
          </div>
        </section>

        <footer className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Anon Cyber Team community learning platform</span>
          <span>Safe, defensive practice only: placeholder labs, no real targets.</span>
        </footer>
      </main>
    </div>
  );
}
