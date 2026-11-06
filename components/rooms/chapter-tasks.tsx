import Link from "next/link";
import type { AnswerType } from "@prisma/client";
import { StateTag } from "@/components/paper/state-tag";
import { TaskSubmitForm } from "@/components/rooms/task-submit-form";
import { getAnswerFormat } from "@/lib/learning/answer-format";
import type { ChapterTaskStatus } from "@/lib/learning/chapters";
import { HINT_UNLOCK_AFTER_WRONG_ATTEMPTS, isHintUnlocked } from "@/lib/learning/hints";

/**
 * Penanda nomor task, sama dengan daftar room di dashboard: centang hijau untuk jawaban benar,
 * lingkaran putus-putus cyan untuk task yang sedang dikerjakan, garis netral untuk task terkunci.
 */
function TaskMark({ status, serial }: { status: ChapterTaskStatus; serial: string }) {
  return (
    <span
      aria-hidden="true"
      className={`figure mt-px grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold ${
        status === "completed"
          ? "border border-green/45 bg-green-soft text-green"
          : status === "active"
            ? "border-[1.5px] border-dashed border-cyan-ink text-cyan-ink"
            : "border border-line-strong text-ink-3"
      }`}
    >
      {status === "completed" ? (
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        serial
      )}
    </span>
  );
}

/**
 * Task satu bab di halaman materi member, di bawah isi bab. Di dalam satu bab task terbuka berurutan
 * (status dari chapterTaskStatuses); task di bab lain tidak ikut terkunci. Nomor task dihitung per bab.
 *
 * Level heading mengikuti halaman: di dalam panel bab "Tasks" adalah h3 di bawah judul bab (h2) dan judul task
 * h4; room tanpa bab tidak punya judul bab, jadi "Tasks" naik menjadi h2.
 */
export function ChapterTasks({
  roomSlug,
  tasks,
  wrongAttemptsByTask,
  headingLevel,
  quizNext,
  className = ""
}: {
  roomSlug: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    answerType: AnswerType;
    hint: string | null;
    points: number;
    answerPattern: string | null;
    status: ChapterTaskStatus;
  }[];
  wrongAttemptsByTask: Record<string, number>;
  headingLevel: 2 | 3;
  /** Diisi bila task terakhir room sudah benar dan quiz menjadi langkah berikutnya. */
  quizNext?: { href: string; passingScore: number } | null;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const TaskHeading = headingLevel === 2 ? "h3" : "h4";
  const solved = tasks.filter((task) => task.status === "completed").length;

  return (
    <section id="tasks" className={`scroll-mt-28 ${className}`} aria-labelledby="tasks-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
        <Heading id="tasks-title" className="text-base font-bold text-ink">
          Tasks
        </Heading>
        {/* Satu task sudah cukup jelas dari tandanya; hitungan baru berguna mulai dua task. */}
        {tasks.length > 1 ? (
          <p className="figure text-sm text-ink-3">
            {solved} of {tasks.length} solved
          </p>
        ) : null}
      </div>

      <ol className="divide-y divide-line">
        {tasks.map((task, index) => {
          const isCompleted = task.status === "completed";
          const isActive = task.status === "active";
          const isLocked = task.status === "locked";
          const position = index + 1;
          const format = getAnswerFormat(task.answerType);
          const wrongAttempts = wrongAttemptsByTask[task.id] ?? 0;

          return (
            <li key={task.id} className={`px-5 sm:px-6 ${isActive ? "py-5" : "py-4"}`}>
              <div className="flex items-start gap-3.5">
                <TaskMark status={task.status} serial={String(position).padStart(2, "0")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <TaskHeading className={`min-w-0 pt-0.5 font-semibold leading-snug ${isLocked ? "text-ink-2" : "text-ink"}`}>
                      <span className="sr-only">Task {position}: </span>
                      {task.title}
                    </TaskHeading>
                    {isCompleted ? (
                      <StateTag tone="green" icon="check">
                        Solved
                      </StateTag>
                    ) : isLocked ? (
                      <StateTag tone="muted" icon="lock">
                        Locked
                      </StateTag>
                    ) : (
                      <span className="figure pt-0.5 text-sm text-ink-3">{task.points} pts</span>
                    )}
                  </div>

                  {isActive ? (
                    <p className="mt-1.5 max-w-[68ch] leading-relaxed text-ink-2">{task.description}</p>
                  ) : isLocked ? (
                    <p className="mt-0.5 text-sm text-ink-3">Opens when you solve the task before it.</p>
                  ) : null}

                  {isActive ? (
                    <p className="mt-2 text-sm text-ink-3">
                      Answer format: <span className="font-medium text-ink-2">{format.label}</span>
                    </p>
                  ) : null}

                  {/* Form tetap di posisi yang sama saat task berubah jadi solved agar pesan "Correct" terlihat. */}
                  {isActive || isCompleted ? (
                    <TaskSubmitForm
                      taskId={task.id}
                      roomSlug={roomSlug}
                      answerType={task.answerType}
                      answerPattern={task.answerPattern}
                      hasHint={Boolean(task.hint)}
                      hint={task.hint && isHintUnlocked(wrongAttempts) ? task.hint : null}
                      wrongAttempts={wrongAttempts}
                      hintUnlockAfter={HINT_UNLOCK_AFTER_WRONG_ATTEMPTS}
                      solved={isCompleted}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Semua task room benar dan quiz belum lulus: quiz menjadi satu-satunya aksi cyan di halaman. */}
      {quizNext ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line px-5 py-4 sm:px-6">
          <p className="max-w-[60ch] text-sm text-ink-2">
            Every task in this room is solved. Pass the quiz with {quizNext.passingScore}% or higher to complete the room.
          </p>
          <Link href={quizNext.href} className="btn-primary">
            Take the quiz
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
