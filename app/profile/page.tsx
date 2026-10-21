import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
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

export default async function ProfilePage() {
  const profile = await requireRole(["STUDENT"]);

  const [
    standing,
    activity,
    progressRows,
    submissions,
    attempts,
    pointsBySource,
    labSessionCount,
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
    prisma.labSession.count({ where: { userId: profile.id } }),
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

  const identity = [
    { label: "Name", value: profile.fullName },
    { label: "Username", value: profile.username },
    { label: "Email", value: profile.email, className: "break-all font-semibold text-ink" },
    { label: "Role", value: roleLabel[profile.role] ?? profile.role },
    { label: "Member no.", value: memberSerial(profile.id), className: "serial !text-sm" },
    { label: "Joined", value: formatShortDate(profile.createdAt) }
  ];

  return (
    <AppShell title="Profile" subtitle="Your member record: identity, points, and the trail of rooms, tasks, and quizzes behind them." role={profile.role}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Data anggota */}
        <section className="sheet p-5 sm:p-7" aria-label="Member details">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="mx-auto shrink-0 sm:mx-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={`Photo of ${profile.fullName}`} className="h-[140px] w-[140px] rounded-lg border border-line object-cover" />
              ) : (
                <EntityLogo name={profile.fullName} person size="xl" className="!h-[140px] !w-[140px] !rounded-xl !text-4xl" />
              )}
            </div>
            <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-4 border-line-soft sm:grid-cols-2 sm:border-l sm:pl-6">
              {identity.map((field) => (
                <div key={field.label} className="min-w-0 border-b border-line-soft pb-3">
                  <dt className="field-label">{field.label}</dt>
                  <dd className={`mt-1 ${field.className ?? "font-semibold text-ink"}`}>{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="sheet p-5" aria-label="Points by source">
          <h2 className="font-semibold text-ink">Points by source</h2>
          <dl className="mt-3 divide-y divide-line-soft text-sm">
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-ink-2">Task answers</dt>
              <dd className="figure font-semibold text-ink">{formatNumber(taskPoints)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-ink-2">Quizzes</dt>
              <dd className="figure font-semibold text-ink">{formatNumber(quizPoints)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-ink-2">Adjustments</dt>
              <dd className="figure font-semibold text-ink">{formatNumber(adjustmentPoints)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line py-2">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="figure font-bold text-ink">{formatNumber(standing.points)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink-3">
            {labSessionCount} lab {labSessionCount === 1 ? "session" : "sessions"} started
          </p>
        </section>
      </div>

      <section className="sheet mt-5 overflow-hidden" aria-label="Your numbers">
        <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-3 xl:grid-cols-6">
          <Figure className="bg-sheet p-4" label="Points" value={formatNumber(standing.points)} />
          <Figure
            className="bg-sheet p-4"
            label="Rank"
            value={standing.rank ? `#${standing.rank}` : "–"}
            note={standing.rank ? `of ${plural(standing.totalRanked, "member")}` : "Earn points to rank"}
          />
          <Figure className="bg-sheet p-4" label="Streak" value={activity.streakDays} unit={activity.streakDays === 1 ? "day" : "days"} />
          <Figure className="bg-sheet p-4" label="Rooms completed" value={completedRooms} />
          <Figure
            className="bg-sheet p-4"
            label="Correct answers"
            value={formatNumber(correctSubmissions)}
            note={submissionTotal > 0 ? `of ${plural(submissionTotal, "answer")}` : undefined}
          />
          <Figure
            className="bg-sheet p-4"
            label="Quizzes passed"
            value={formatNumber(quizzesPassed)}
            note={attemptTotal === 0 ? "No attempts yet" : plural(attemptTotal, "attempt")}
          />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[auto_minmax(0,1fr)]">
        <section className="sheet p-5 sm:p-6" aria-label="Activity">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Activity</h2>
            <Link href="/progress" className="text-link text-sm">
              Progress
            </Link>
          </div>
          <ActivityHeatmap calendar={activity.calendar} className="mt-4" />
        </section>

        <section className="sheet min-w-0 p-5 sm:p-6" aria-label="Recently completed">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Recently completed</h2>
            <Link href="/progress" className="text-link text-sm">
              Full record
            </Link>
          </div>
          <div className="mt-4">
            <CompletionList entries={recentCompletions} columns={2} />
            {recentCompletions.length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">Finished rooms and passed quizzes show up here.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="sheet min-w-0 p-5 sm:p-6" aria-label="Quiz history">
          <SectionHeader
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
            <EmptyState title="No quizzes taken yet" message="Open a room, finish its tasks, then take the quiz." />
          ) : (
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${thClass} pl-5 text-left sm:pl-6`}>
                      Quiz
                    </th>
                    <th scope="col" className={`${thClass} text-right`}>
                      Score
                    </th>
                    <th scope="col" className={`${thClass} text-left`}>
                      Result
                    </th>
                    <th scope="col" className={`${thClass} pr-5 text-right sm:pr-6`}>
                      Taken
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-well">
                      <td className="px-3 py-2.5 pl-5 sm:pl-6">
                        <Link
                          href={`/rooms/${attempt.quiz.room.slug}/quiz`}
                          className="block font-semibold text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
                        >
                          {attempt.quiz.title}
                        </Link>
                        <span className="block text-xs text-ink-3">{attempt.quiz.room.title}</span>
                      </td>
                      <td className="figure px-3 py-2.5 text-right">
                        <span className={`font-semibold ${attempt.passed ? "text-green" : "text-red"}`}>{attempt.score}%</span>
                        <span className="block text-xs text-ink-3">pass {attempt.quiz.passingScore}%</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Passed" : "Retry"}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-xs text-ink-2 sm:pr-6">{formatDateTime(attempt.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sheet min-w-0 p-5 sm:p-6" aria-label="Task answers">
          <SectionHeader
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
            <EmptyState title="No answers submitted yet" message="Answers you submit to room tasks are listed here." />
          ) : (
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${thClass} pl-5 text-left sm:pl-6`}>
                      Task
                    </th>
                    <th scope="col" className={`${thClass} text-left`}>
                      Answer
                    </th>
                    <th scope="col" className={`${thClass} text-left`}>
                      Result
                    </th>
                    <th scope="col" className={`${thClass} pr-5 text-right sm:pr-6`}>
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-well">
                      <td className="px-3 py-2.5 pl-5 sm:pl-6">
                        <Link
                          href={`/rooms/${submission.task.room.slug}`}
                          className="block font-semibold text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
                        >
                          {submission.task.title}
                        </Link>
                        <span className="block text-xs text-ink-3">{submission.task.room.title}</span>
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 font-mono text-xs text-ink-2" title={submission.answer}>
                        {submission.answer}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={submission.isCorrect ? "success" : "danger"}>
                          {submission.isCorrect ? `+${submission.task.points} pts` : "Wrong"}
                        </StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-xs text-ink-2 sm:pr-6">{formatDateTime(submission.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="sheet mt-5 p-5 sm:p-6" aria-label="Room progress">
        <SectionHeader
          title="Room progress"
          action={
            <Link href="/progress" className="text-link text-sm">
              View progress
            </Link>
          }
        />
        {progressRows.length === 0 ? (
          <EmptyState
            title="No rooms started yet"
            message="Pick a room to start learning."
            action={
              <Link href="/rooms" className="text-link text-sm">
                Browse rooms
              </Link>
            }
          />
        ) : (
          <ul className="-mx-2 grid gap-1 md:grid-cols-2">
            {progressRows.map((row) => {
              const status = roomStatusLabel[row.status] ?? { label: row.status, tone: "neutral" as const };
              return (
                <li key={row.id}>
                  <Link href={`/rooms/${row.room.slug}`} className="group block rounded-lg px-2 py-2.5 transition-colors hover:bg-well">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                          {row.room.title}
                        </p>
                        <p className="truncate text-xs text-ink-3">{row.room.learningPath.title}</p>
                      </div>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar value={row.progressPercentage} label={`${row.room.title} progress`} className="flex-1" />
                      <span className="figure w-9 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-3">
                      {row.completedAt ? `Passed ${formatDateTime(row.completedAt)}` : `Updated ${formatDateTime(row.updatedAt)}`}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
