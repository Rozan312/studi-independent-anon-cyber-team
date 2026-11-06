import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { formatScheduleDate } from "@/lib/learning/availability";
import { getLearningActivity } from "@/lib/services/activity-service";
import { ActivityHeatmap } from "@/components/paper/activity-heatmap";
import { getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";
import { memberSerial } from "@/lib/format/member";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { EntityLogo } from "@/components/paper/entity-logo";
import { FallbackImage } from "@/components/paper/fallback-image";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return formatScheduleDate(date);
}

const roleLabel: Record<string, string> = {
  STUDENT: "Member",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin"
};

const roomStatusLabel: Record<string, { label: string; tone: "done" | "neutral" }> = {
  COMPLETED: { label: "Passed", tone: "done" },
  IN_PROGRESS: { label: "In progress", tone: "neutral" },
  NOT_STARTED: { label: "Not started", tone: "neutral" }
};

type RecentCompletion = CompletionEntry & { at: Date };

const thClass = "field-label border-b border-line px-3 py-2.5";

/** Tabel riwayat task dan quiz memuat maksimal 25 baris; angka ringkasan dihitung dari agregat seluruh riwayat. */
const HISTORY_LIMIT = 25;

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Kepala panel bergaris: judul, keterangan pendek, aksi di kanan; isi panel di bawahnya rata ke tepi. */
function PanelHeader({ id, title, description, action }: { id: string; title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-ink">
          {title}
        </h2>
        {description ? <p className="mt-0.5 max-w-2xl text-sm text-ink-3">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default async function ProfilePage() {
  const profile = await requireRole(["STUDENT"]);

  const [
    standing,
    activity,
    progressRows,
    submissions,
    attempts,
    pointsBySource,
    submissionTotal,
    correctSubmissions,
    attemptStats,
    passedQuizGroups
  ] = await Promise.all([
    getUserLeaderboardStanding(profile.id),
    getLearningActivity(profile.id),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: {
        room: {
          select: { title: true, slug: true, points: true, isPublished: true, learningPath: { select: { title: true, isPublished: true } } }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userTaskSubmission.findMany({
      where: { userId: profile.id },
      include: { task: { select: { title: true, points: true, room: { select: { title: true, slug: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: HISTORY_LIMIT
    }),
    prisma.userQuizAttempt.findMany({
      where: { userId: profile.id },
      include: { quiz: { select: { title: true, passingScore: true, room: { select: { title: true, slug: true, points: true } } } } },
      orderBy: { startedAt: "desc" },
      take: HISTORY_LIMIT
    }),
    prisma.leaderboardPoint.groupBy({
      by: ["sourceType"],
      where: { userId: profile.id },
      _sum: { points: true }
    }),
    // Agregat seluruh riwayat (bukan hanya 25 baris tabel), sama seperti halaman Progress.
    prisma.userTaskSubmission.count({ where: { userId: profile.id } }),
    prisma.userTaskSubmission.count({ where: { userId: profile.id, isCorrect: true } }),
    prisma.userQuizAttempt.aggregate({
      where: { userId: profile.id, completedAt: { not: null } },
      _count: { _all: true },
      _avg: { score: true },
      _max: { score: true }
    }),
    prisma.userQuizAttempt.groupBy({
      by: ["quizId"],
      where: { userId: profile.id, passed: true }
    })
  ]);

  // Hanya room yang masih terbit di path yang terbit, sama dengan dasbor dan halaman Progress.
  const completedRooms = progressRows.filter(
    (row) => row.status === "COMPLETED" && row.room.isPublished && row.room.learningPath.isPublished
  ).length;
  // Quiz berbeda yang pernah lulus; lulus ulang quiz yang sama tidak dihitung dua kali.
  const quizzesPassed = passedQuizGroups.length;
  const attemptTotal = attemptStats._count._all;
  const averageScore = Math.round(attemptStats._avg.score ?? 0);
  const bestScore = attemptStats._max.score ?? 0;
  const pointsMap = new Map(pointsBySource.map((row) => [row.sourceType, row._sum.points ?? 0]));
  const taskPoints = pointsMap.get("TASK_COMPLETION") ?? 0;
  const quizPoints = pointsMap.get("QUIZ_COMPLETION") ?? 0;
  const adjustmentPoints = pointsMap.get("MANUAL_ADJUSTMENT") ?? 0;

  // Riwayat selesai terbaru: room lulus dan quiz lulus dari data yang sudah dimuat.
  const recentCompletions: RecentCompletion[] = [
    ...progressRows
      .filter((row) => row.status === "COMPLETED")
      .map((row) => {
        const at = row.completedAt ?? row.updatedAt;
        return { id: `room-${row.id}`, at, kind: "room" as const, title: row.room.title, date: formatShortDate(at) };
      }),
    ...attempts
      .filter((row) => row.passed)
      .map((row) => {
        const at = row.completedAt ?? row.startedAt;
        return {
          id: `quiz-${row.id}`,
          at,
          kind: "quiz-pass" as const,
          title: row.quiz.room.title,
          score: row.score,
          date: formatShortDate(at)
        };
      })
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  // Nama dan peran tampil di sebelah avatar; identitas lalu catatan belajar menjadi baris bergaris di satu daftar definisi
  // (pengganti strip angka besar: strip itu hanya ada di dasbor). Poin dan peringkat ada di panel Points and rank.
  const details: { label: string; value: string; note?: string; className: string }[] = [
    { label: "Username", value: profile.username, className: "font-semibold text-ink" },
    { label: "Email", value: profile.email, className: "break-all text-ink" },
    { label: "Member no.", value: memberSerial(profile.id), className: "serial text-sm" },
    { label: "Joined", value: formatShortDate(profile.createdAt), className: "text-ink" },
    { label: "Streak", value: plural(activity.streakDays, "day"), className: "figure font-semibold text-ink" },
    { label: "Rooms completed", value: formatNumber(completedRooms), className: "figure font-semibold text-ink" },
    {
      label: "Correct answers",
      value: formatNumber(correctSubmissions),
      note: submissionTotal > 0 ? `of ${plural(submissionTotal, "answer")}` : undefined,
      className: "figure font-semibold text-ink"
    },
    {
      label: "Quizzes passed",
      value: formatNumber(quizzesPassed),
      note: attemptTotal === 0 ? "· no attempts yet" : `in ${plural(attemptTotal, "attempt")}`,
      className: "figure font-semibold text-ink"
    }
  ];

  const avatarTile = <EntityLogo name={profile.fullName} person size="lg" className="sm:!h-24 sm:!w-24 sm:!text-2xl" />;

  return (
    <AppShell title="Profile" subtitle="Your member record: identity, points, and the trail of rooms, tasks, and quizzes behind them." role={profile.role}>
      <div className="flex flex-col gap-5">
        {/* Kolom samping 340px baru dibuka di xl: di lg rail 256px masih terbuka dan kolom identitas jadi terlalu sempit. */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="sheet flex flex-col overflow-hidden sm:flex-row" aria-label="Member details">
            <div className="flex items-center gap-4 border-b border-line p-5 sm:w-52 sm:shrink-0 sm:flex-col sm:items-start sm:border-b-0 sm:border-r sm:p-6">
              {/* URL foto yang mati diganti kotak inisial yang sama dengan member tanpa foto. */}
              {profile.avatarUrl ? (
                <FallbackImage
                  src={profile.avatarUrl}
                  alt={`Photo of ${profile.fullName}`}
                  width={96}
                  height={96}
                  className="h-14 w-14 shrink-0 rounded-sheet border border-line-strong object-cover sm:h-24 sm:w-24"
                  fallback={avatarTile}
                />
              ) : (
                avatarTile
              )}
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold leading-tight text-ink [text-wrap:balance]">{profile.fullName}</h2>
                <p className="field-label mt-1">{roleLabel[profile.role] ?? profile.role}</p>
              </div>
            </div>
            <dl className="min-w-0 flex-1 divide-y divide-line">
              {details.map((field) => (
                <div key={field.label} className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-3 px-5 py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:px-6">
                  <dt className="field-label">{field.label}</dt>
                  <dd className={field.className}>
                    {field.value}
                    {field.note ? <span className="ml-1.5 font-normal text-ink-3">{field.note}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="sheet px-5 pb-2 pt-4" aria-labelledby="points-source-title">
            <h2 id="points-source-title" className="border-b border-line pb-3 text-base font-bold text-ink">
              Points and rank
            </h2>
            <dl className="divide-y divide-line text-sm">
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-ink-2">Task answers</dt>
                <dd className="figure font-semibold text-ink">{formatNumber(taskPoints)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-ink-2">Quizzes</dt>
                <dd className="figure font-semibold text-ink">{formatNumber(quizPoints)}</dd>
              </div>
              {adjustmentPoints !== 0 ? (
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Adjustments</dt>
                  <dd className="figure font-semibold text-ink">{formatNumber(adjustmentPoints)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="font-display font-semibold text-ink">Total</dt>
                <dd className="figure text-base font-bold text-ink">{formatNumber(standing.points)}</dd>
              </div>
              {/* Peringkat dihitung dari total poin, jadi ditaruh tepat di bawah Total. */}
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-ink-2">Rank</dt>
                {standing.rank ? (
                  <dd className="figure font-semibold text-ink">
                    #{standing.rank}
                    <span className="ml-1.5 font-normal text-ink-3">of {plural(standing.totalRanked, "member")}</span>
                  </dd>
                ) : (
                  <dd className="text-ink-3">Earn points to rank</dd>
                )}
              </div>
            </dl>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[auto_minmax(0,1fr)]">
          <section className="sheet overflow-hidden" aria-labelledby="activity-title">
            <PanelHeader
              id="activity-title"
              title="Activity"
              action={
                <Link href="/progress" className="text-link text-sm">
                  Progress
                </Link>
              }
            />
            <div className="p-5 sm:p-6">
              <ActivityHeatmap calendar={activity.calendar} />
            </div>
          </section>

          <section className="sheet min-w-0 overflow-hidden" aria-labelledby="recent-title">
            <PanelHeader
              id="recent-title"
              title="Recently completed"
              action={
                <Link href="/progress" className="text-link text-sm">
                  Full record
                </Link>
              }
            />
            {recentCompletions.length > 0 ? (
              // -mb-px menyembunyikan garis baris terakhir di bawah tepi panel, jadi tidak ada garis ganda.
              <div className="-mb-px px-5 sm:px-6">
                <CompletionList entries={recentCompletions} />
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-ink-3 sm:px-6">Passed rooms and quizzes show up here.</p>
            )}
          </section>
        </div>

        {/* Dua tabel riwayat ditumpuk selebar penuh: berdampingan, kolom judul task terlalu sempit dan tanggal terpotong. */}
        <div className="grid grid-cols-1 gap-5">
          <section className="sheet min-w-0 overflow-hidden" aria-labelledby="quiz-history-title">
            <PanelHeader
              id="quiz-history-title"
              title="Quiz history"
              description={
                attempts.length > 0
                  ? `Average ${averageScore}% · Best ${bestScore}% over ${plural(attemptTotal, "attempt")}.${
                      attemptTotal > attempts.length ? ` Showing the latest ${attempts.length}.` : ""
                    }`
                  : undefined
              }
            />
            {attempts.length === 0 ? (
              <div className="p-5 sm:p-6">
                <EmptyState title="No quizzes taken yet" message="Open a room, finish its tasks, then take the quiz." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Di bawah sm kolom Taken disembunyikan dan tanggalnya pindah ke sel pertama, agar Result tetap terlihat tanpa gulir. */}
                <table className="w-full text-sm sm:min-w-[520px]">
                  <thead>
                    <tr>
                      <th scope="col" className={`${thClass} pl-5 text-left sm:pl-6`}>
                        Quiz
                      </th>
                      <th scope="col" className={`${thClass} text-right`}>
                        Score
                      </th>
                      <th scope="col" className={`${thClass} pr-5 text-left sm:pr-3`}>
                        Result
                      </th>
                      <th scope="col" className={`${thClass} hidden pr-5 text-right sm:table-cell sm:pr-6`}>
                        Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="group transition-colors hover:bg-well">
                        <td className="px-3 py-2.5 pl-5 sm:pl-6">
                          <Link
                            href={`/rooms/${attempt.quiz.room.slug}/quiz`}
                            className="tap-target block font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink"
                          >
                            {attempt.quiz.title}
                          </Link>
                          <span className="block text-xs text-ink-3">{attempt.quiz.room.title}</span>
                          <span className="block text-xs text-ink-3 sm:hidden">{formatDateTime(attempt.startedAt)}</span>
                        </td>
                        <td className="figure px-3 py-2.5 text-right">
                          <span className="font-semibold text-ink">{attempt.score}%</span>
                          <span className="block whitespace-nowrap text-xs text-ink-3">pass {attempt.quiz.passingScore}%</span>
                        </td>
                        <td className="px-3 py-2.5 pr-5 sm:pr-3">
                          <StatusPill tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Passed" : "Retry"}</StatusPill>
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 pr-5 text-right text-xs text-ink-2 sm:table-cell sm:pr-6">{formatDateTime(attempt.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="sheet min-w-0 overflow-hidden" aria-labelledby="task-answers-title">
            <PanelHeader
              id="task-answers-title"
              title="Task answers"
              description={
                submissions.length === 0
                  ? undefined
                  : submissionTotal > submissions.length
                    ? `Your latest ${submissions.length} of ${plural(submissionTotal, "submission")}`
                    : `Your ${plural(submissions.length, "submission")}`
              }
            />
            {submissions.length === 0 ? (
              <div className="p-5 sm:p-6">
                <EmptyState title="No answers submitted yet" message="Answers you submit to room tasks are listed here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Di bawah sm kolom Answer dan Submitted disembunyikan; isinya pindah ke sel pertama agar Result tetap terlihat. */}
                <table className="w-full text-sm sm:min-w-[520px]">
                  <thead>
                    <tr>
                      <th scope="col" className={`${thClass} pl-5 text-left sm:pl-6`}>
                        Task
                      </th>
                      <th scope="col" className={`${thClass} hidden text-left sm:table-cell`}>
                        Answer
                      </th>
                      <th scope="col" className={`${thClass} pr-5 text-left sm:pr-3`}>
                        Result
                      </th>
                      <th scope="col" className={`${thClass} hidden pr-5 text-right sm:table-cell sm:pr-6`}>
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="group transition-colors hover:bg-well">
                        <td className="px-3 py-2.5 pl-5 sm:pl-6">
                          <Link
                            href={`/rooms/${submission.task.room.slug}`}
                            className="tap-target block font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink"
                          >
                            {submission.task.title}
                          </Link>
                          <span className="block text-xs text-ink-3">{submission.task.room.title}</span>
                          {/* max-w perlu agar truncate berlaku di sel tabel; lebarnya sama dengan kolom Answer di layar lebar. */}
                          <span className="block max-w-[12rem] truncate font-mono text-xs text-ink-2 sm:hidden">{submission.answer}</span>
                          <span className="block text-xs text-ink-3 sm:hidden">{formatDateTime(submission.submittedAt)}</span>
                        </td>
                        <td className="hidden max-w-[12rem] truncate px-3 py-2.5 font-mono text-xs text-ink-2 sm:table-cell" title={submission.answer}>
                          {submission.answer}
                        </td>
                        <td className="px-3 py-2.5 pr-5 sm:pr-3">
                          <StatusPill tone={submission.isCorrect ? "success" : "danger"}>
                            {submission.isCorrect ? `+${submission.task.points} pts` : "Wrong"}
                          </StatusPill>
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 pr-5 text-right text-xs text-ink-2 sm:table-cell sm:pr-6">{formatDateTime(submission.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section className="sheet overflow-hidden" aria-labelledby="room-progress-title">
          <PanelHeader
            id="room-progress-title"
            title="Room progress"
            action={
              <Link href="/progress" className="text-link text-sm">
                View progress
              </Link>
            }
          />
          {progressRows.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="No rooms started yet"
                message="Pick a room to start learning."
                action={
                  <Link href="/rooms" className="text-link text-sm">
                    Browse rooms
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {progressRows.map((row) => {
                const status = roomStatusLabel[row.status] ?? { label: row.status, tone: "neutral" as const };
                return (
                  <li key={row.id}>
                    {/* Ponsel: judul dan status sebaris, bilah progres di baris kedua. sm ke atas: tiga kolom tetap agar bilah sejajar antarbaris. */}
                    <Link
                      href={`/rooms/${row.room.slug}`}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1fr)_10rem_6.5rem] sm:px-6"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink">{row.room.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-3">
                          {row.room.learningPath.title} · {row.completedAt ? `Passed ${formatDateTime(row.completedAt)}` : `Updated ${formatDateTime(row.updatedAt)}`}
                        </span>
                      </span>
                      <span className="justify-self-end sm:col-start-3 sm:row-start-1">
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </span>
                      <span className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        {/* Bilah hanya visual; persentasenya tertulis di sebelahnya. Room yang lulus memakai violet. */}
                        <span className="min-w-0 flex-1" aria-hidden="true">
                          <ProgressBar value={row.progressPercentage} tone={row.status === "COMPLETED" ? "violet" : "cyan"} label={`${row.room.title} progress`} />
                        </span>
                        <span className="figure w-9 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
