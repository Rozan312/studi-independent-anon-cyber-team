import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { CompletionMark } from "@/components/paper/completion";
import { TaskSubmitForm } from "@/components/rooms/task-submit-form";
import { RoomSectionNav } from "@/components/rooms/room-section-nav";
import { requireRole } from "@/lib/auth/guards";
import { getRoomBySlug } from "@/lib/services/room-service";
import { prisma } from "@/lib/db/prisma";
import { getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";
import { getAnswerFormat } from "@/lib/learning/answer-format";
import { HINT_UNLOCK_AFTER_WRONG_ATTEMPTS, isHintUnlocked } from "@/lib/learning/hints";
import { getRoomCompletionSnapshot } from "@/lib/services/progress-service";
import { getWrongAttemptCounts } from "@/lib/services/task-service";
import { RoomMaterial } from "@/components/content/room-material";
import { PageNotice } from "@/components/ui/page-notice";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { describeAvailability, formatScheduleDate, getRoomAvailability, type RoomAvailability } from "@/lib/learning/availability";
import { formatDayMonth, formatNumber, formatShortDate } from "@/lib/format/date";
import { earnablePoints } from "@/lib/learning/points";
import { EntityLogo } from "@/components/paper/entity-logo";
import { FallbackImage } from "@/components/paper/fallback-image";
import { publishedRoomTitle } from "@/lib/services/page-title-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: (await publishedRoomTitle(params.slug)) ?? "Room" };
}

/** Room yang baru selesai (15 menit terakhir): tanda centangnya digambar sekali. */
const FRESH_COMPLETION_MS = 15 * 60 * 1000;

/** Label status ketersediaan; null bila room terbuka tanpa batas akhir. */
function availabilityTag(availability: RoomAvailability) {
  if (availability.state === "upcoming" && availability.opensAt) {
    return <StateTag tone="amber">Opens {formatDayMonth(availability.opensAt)}</StateTag>;
  }
  if (availability.state === "closed") return <StateTag tone="red">Closed</StateTag>;
  if (availability.state === "draft") return <StateTag tone="muted">Draft</StateTag>;
  if (availability.closesAt) return <StateTag tone="amber">Closes {formatDayMonth(availability.closesAt)}</StateTag>;
  return null;
}

function BackArrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Penanda nomor task, sama dengan daftar room di dashboard: centang hijau untuk jawaban benar,
 * lingkaran putus-putus cyan untuk task yang sedang dikerjakan, garis netral untuk task terkunci.
 */
function TaskMark({ status, serial }: { status: "completed" | "active" | "locked"; serial: string }) {
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

export default async function RoomDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  const availability = getRoomAvailability(room);
  const canPreviewClosedRoom = hasRoleAccess(profile.role, ["INSTRUCTOR"]);
  const points = earnablePoints(room);

  // Peserta hanya melihat ringkasan dan jadwal saat room belum dibuka atau sudah ditutup.
  if (!availability.isOpen && !canPreviewClosedRoom) {
    const isUpcoming = availability.state === "upcoming";

    return (
      <AppShell title={room.title} subtitle={room.description} role={profile.role}>
        <PageNotice
          tone={isUpcoming ? "info" : "warning"}
          title={isUpcoming ? "This room isn't open yet" : "This room is closed"}
          message={
            isUpcoming
              ? `It opens on ${formatScheduleDate(availability.opensAt as Date)}. The material, tasks, and quiz become available then.`
              : `It closed on ${formatScheduleDate(availability.closesAt as Date)}. New answers aren't accepted, but the progress you recorded is kept.`
          }
          className="mb-6"
        />

        <section className="sheet overflow-hidden" aria-labelledby="room-schedule-title">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <EntityLogo name={room.title} src={room.logoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 id="room-schedule-title" className="text-lg font-bold text-ink">
                  Schedule
                </h2>
                {availabilityTag(availability)}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-2">
                <span>{room.learningPath.title}</span>
                <span aria-hidden="true">·</span>
                <span>{room.category}</span>
                <span aria-hidden="true">·</span>
                <span>{room.difficulty}</span>
              </p>
            </div>
          </div>

          {/* Tiga fakta jadwal dalam satu strip bersambungan tipis, seperti strip angka di dashboard. */}
          <dl className="grid gap-px border-y border-line bg-line sm:grid-cols-3">
            <div className="bg-sheet px-5 py-4 sm:px-6">
              <dt className="field-label">Opens</dt>
              <dd className="mt-1.5 font-display font-semibold text-ink">{availability.opensAt ? formatScheduleDate(availability.opensAt) : "When published"}</dd>
            </div>
            <div className="bg-sheet px-5 py-4 sm:px-6">
              <dt className="field-label">Closes</dt>
              <dd className="mt-1.5 font-display font-semibold text-ink">{availability.closesAt ? formatScheduleDate(availability.closesAt) : "No end date"}</dd>
            </div>
            <div className="bg-sheet px-5 py-4 sm:px-6">
              <dt className="field-label">In this room</dt>
              <dd className="figure mt-1.5 font-semibold text-ink">
                {room.tasks.length} {room.tasks.length === 1 ? "task" : "tasks"}
                {room.quiz ? " · 1 quiz" : ""} · {formatNumber(points.total)} pts
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 p-5 sm:p-6">
            <Link href={`/learning-paths/${room.learningPath.slug}`} className="btn-primary">
              <BackArrow />
              Back to learning path
            </Link>
            <Link href="/rooms" className="btn-secondary">
              Browse other rooms
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  const [submissions, wrongAttemptsByTask, snapshot, session, roomProgress] = await Promise.all([
    prisma.userTaskSubmission.findMany({
      where: {
        userId: profile.id,
        task: { roomId: room.id },
        isCorrect: true
      },
      select: { taskId: true }
    }),
    getWrongAttemptCounts(profile.id, room.id),
    getRoomCompletionSnapshot(profile.id, room.id),
    getLatestLabSessionForRoom(profile.id, room.id),
    // Tanggal selesai untuk penanda "Room passed".
    prisma.userRoomProgress.findUnique({
      where: { userId_roomId: { userId: profile.id, roomId: room.id } },
      select: { completedAt: true }
    })
  ]);

  const completedTaskIds = new Set(submissions.map((s) => s.taskId));
  const totalTasks = room.tasks.length;
  const completedTasksCount = room.tasks.filter((t) => completedTaskIds.has(t.id)).length;

  // Satu aturan penyelesaian untuk seluruh aplikasi: semua task benar + quiz lulus (jika ada).
  const completionPercentage = snapshot.percentage;
  const allTasksSolved = completedTasksCount >= totalTasks;
  const quizIsNextStep = Boolean(room.quiz) && allTasksSolved && !snapshot.quizPassed;

  const now = new Date();
  const completedAt = snapshot.isComplete ? roomProgress?.completedAt ?? null : null;
  const freshCompletion = completedAt ? now.getTime() - completedAt.getTime() < FRESH_COMPLETION_MS : false;

  let foundActive = false;
  const tasksWithStatus = room.tasks.map((task) => {
    const isCompleted = completedTaskIds.has(task.id);
    let status: "completed" | "active" | "locked" = "locked";

    if (isCompleted) {
      status = "completed";
    } else if (!foundActive) {
      status = "active";
      foundActive = true;
    } else {
      status = "locked";
    }

    return { ...task, status };
  });

  const scheduleTag = availabilityTag(availability);

  return (
    <AppShell title={room.title} subtitle={room.description} role={profile.role}>
      {!availability.isOpen ? (
        <PageNotice
          tone="warning"
          title="Instructor preview"
          message={`${describeAvailability(availability)}. Members can't open this room right now; you can see it because you have the instructor or admin role.`}
          className="mb-6"
        />
      ) : null}

      {/*
        Rasio kolom sengaja tetap 8/12 + gap-6. Aturan lebar editor di app/globals.css
        (.rich-editor .ProseMirror { max-width: calc(66.6667% + 21.5px) } pada lg ke atas) diturunkan dari grid ini:
        kolom materi = 8 dari 12 kolom dengan gap-6, di dalam .sheet ber-padding p-6 (md ke atas) dan border 1px,
        dicocokkan dengan padding horizontal editor 1.4rem. Bila span kolom, gap, atau padding lembar materi
        diubah, hitung ulang aturan itu agar editor dan tampilan member tetap sama lebar.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom utama: materi lalu task */}
        <div className="space-y-6 lg:col-span-8">
          {/* Tab seksi: yang sedang dibaca bertanda cyan; di desktop menempel di bawah bar atas (scroll-mt-28 seksi memperhitungkannya). */}
          <RoomSectionNav completedTasks={completedTasksCount} totalTasks={totalTasks} hasQuiz={Boolean(room.quiz)} />

          <section id="material" className="sheet scroll-mt-28 p-5 md:p-6" aria-labelledby="material-title">
            {/* Tab di atas sudah bertuliskan Material; judul seksi tetap ada untuk kerangka heading pembaca layar. */}
            <h2 id="material-title" className="sr-only">
              Material
            </h2>
            {/* Heading materi digeser dua level agar berada di bawah h1 halaman dan h2 "Material". */}
            <RoomMaterial content={room.content} format={room.contentFormat} headingOffset={2} />
          </section>

          <section id="tasks" className="sheet scroll-mt-28 overflow-hidden" aria-labelledby="tasks-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
              <h2 id="tasks-title" className="text-base font-bold text-ink">
                Tasks
              </h2>
              <p className="figure text-sm text-ink-3">
                {completedTasksCount} of {totalTasks} solved
              </p>
            </div>

            {tasksWithStatus.length > 0 ? (
              <ol className="divide-y divide-line">
                {tasksWithStatus.map((task, index) => {
                  const isCompleted = task.status === "completed";
                  const isActive = task.status === "active";
                  const isLocked = task.status === "locked";
                  const position = index + 1;
                  const format = getAnswerFormat(task.answerType);

                  return (
                    <li key={task.id} className={`px-5 sm:px-6 ${isActive ? "py-5" : "py-4"}`}>
                      <div className="flex items-start gap-3.5">
                        <TaskMark status={task.status} serial={String(position).padStart(2, "0")} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                            <h3 className={`min-w-0 pt-0.5 font-semibold leading-snug ${isLocked ? "text-ink-2" : "text-ink"}`}>
                              <span className="sr-only">Task {position}: </span>
                              {task.title}
                            </h3>
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
                              roomSlug={room.slug}
                              answerType={task.answerType}
                              hasHint={Boolean(task.hint)}
                              hint={task.hint && isHintUnlocked(wrongAttemptsByTask[task.id] ?? 0) ? task.hint : null}
                              wrongAttempts={wrongAttemptsByTask[task.id] ?? 0}
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
            ) : (
              <p className="px-5 py-5 text-sm text-ink-3 sm:px-6">
                This room has no tasks yet.{room.quiz ? " Read the material, then take the quiz." : ""}
              </p>
            )}
          </section>
        </div>

        {/* Kolom samping: progres, fakta room, lab */}
        <aside className="space-y-5 lg:col-span-4" aria-label="Room details">
          <section className="sheet overflow-hidden" aria-labelledby="room-progress-title">
            {/* Room lulus: centang violet di baris teratas panel; digambar sekali bila baru saja lulus. */}
            {snapshot.isComplete ? (
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <CompletionMark kind="room" fresh={freshCompletion} />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink">Room passed</p>
                  {completedAt ? <p className="text-sm text-ink-3">{formatShortDate(completedAt)}</p> : null}
                </div>
              </div>
            ) : null}

            <div className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="room-progress-title" className="text-base font-bold text-ink">
                  Your progress
                </h2>
                <p className="figure text-2xl font-bold leading-none text-ink">
                  {completionPercentage}
                  <span className="ml-0.5 text-sm font-semibold text-ink-2">%</span>
                </p>
              </div>
              <ProgressBar className="mt-3" value={completionPercentage} label={`${room.title} progress`} />

              <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Tasks</dt>
                  <dd className="figure font-semibold text-ink">
                    {completedTasksCount} of {totalTasks} solved
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Quiz</dt>
                  <dd>
                    {snapshot.hasQuiz ? (
                      snapshot.quizPassed ? (
                        <StateTag tone="green" icon="check">
                          Passed
                        </StateTag>
                      ) : (
                        <span className="font-semibold text-ink">Not passed yet</span>
                      )
                    ) : (
                      <span className="text-ink-3">No quiz</span>
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-3">
                A room is complete when every task is solved
                {room.quiz ? ` and the quiz is passed with ${room.quiz.passingScore}% or higher` : ""}.
              </p>

              {/* Tombol quiz menjadi aksi cyan hanya saat quiz adalah langkah berikutnya. */}
              {room.quiz ? (
                <Link
                  id="quiz"
                  href={`/rooms/${room.slug}/quiz`}
                  className={`${quizIsNextStep ? "btn-primary" : "btn-secondary"} mt-4 w-full scroll-mt-28`}
                >
                  {snapshot.quizPassed ? "Open the quiz" : "Take the quiz"}
                </Link>
              ) : null}
            </div>
          </section>

          <section className="sheet overflow-hidden" aria-labelledby="room-facts-title">
            <h2 id="room-facts-title" className="sr-only">
              Room facts
            </h2>
            {room.coverImageUrl ? (
              <FallbackImage src={room.coverImageUrl} alt="" className="h-36 w-full border-b border-line object-cover" fallback={null} />
            ) : null}
            {/* Fakta room sebagai baris bergaris label kiri, nilai kanan; strip angka besar hanya ada di dashboard. */}
            <dl className="divide-y divide-line text-sm">
              <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="text-ink-2">Points</dt>
                <dd className="min-w-0 text-right">
                  <span className="figure font-semibold text-ink">{formatNumber(points.total)} pts</span>
                  {points.quizBonus > 0 ? (
                    <span className="figure mt-0.5 block text-xs text-ink-3">Quiz bonus {formatNumber(points.quizBonus)}</span>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="text-ink-2">Time</dt>
                <dd className="figure font-semibold text-ink">{room.estimatedMinutes} min</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="text-ink-2">Difficulty</dt>
                <dd className="min-w-0 break-words text-right font-display font-semibold text-ink">{room.difficulty}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="text-ink-2">Tasks</dt>
                <dd className="figure text-right font-semibold text-ink">
                  {totalTasks}
                  {room.quiz ? " plus 1 quiz" : ", no quiz"}
                </dd>
              </div>
            </dl>
            {/* Baris path: seluruh baris tautan; outline fokus digambar ke dalam karena panel memotong luapan. */}
            <Link
              href={`/learning-paths/${room.learningPath.slug}`}
              className="group flex items-center gap-3 border-t border-line px-5 py-3.5 transition-colors hover:bg-well focus-visible:outline-offset-[-2px]"
            >
              <EntityLogo name={room.learningPath.title} src={room.learningPath.logoUrl} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display font-semibold text-ink group-hover:text-cyan-ink">{room.learningPath.title}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-3">Learning path · {room.category}</span>
              </span>
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-3 group-hover:text-cyan-ink" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {scheduleTag ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-5 py-4">
                {scheduleTag}
                <span className="text-xs text-ink-3">{describeAvailability(availability)}</span>
              </div>
            ) : null}
          </section>

          <section className="sheet p-5" aria-labelledby="room-lab-title">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h2 id="room-lab-title" className="text-base font-bold text-ink">
                Lab
              </h2>
              <StateTag tone="muted">Not connected</StateTag>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
              No virtual machines or VPN sit behind this room yet. The lab page shows what is planned.
            </p>
            {session?.targetIp ? (
              <dl className="mt-3 border-t border-line pt-3">
                <dt className="field-label">Target IP (placeholder record)</dt>
                <dd className="mt-1 font-mono text-sm text-ink">{session.targetIp}</dd>
              </dl>
            ) : null}
            <Link href={`/rooms/${room.slug}/lab`} className="btn-secondary mt-4 w-full">
              Open lab page
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
