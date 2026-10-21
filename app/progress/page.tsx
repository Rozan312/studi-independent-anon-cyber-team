import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { getLearningStreak } from "@/lib/services/activity-service";
import { getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const dynamic = "force-dynamic";

/** Dinding stempel dan tabel attempt memuat maksimal 100 attempt terbaru; angka ringkasan memakai agregat. */
const ATTEMPT_LIMIT = 100;

/** Jendela yang dipakai getLearningStreak (lib/services/activity-service.ts) untuk menghitung hari aktif. */
const ACTIVITY_WINDOW_DAYS = 120;

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

type CompletionRow = CompletionEntry & { at: Date };

export default async function ProgressPage() {
  const profile = await requireRole(["STUDENT"]);
  const now = new Date();

  const [rows, standing, streak, quizAttempts, publishedPathRows, attemptTotal, passedQuizGroups] = await Promise.all([
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: { room: true },
      orderBy: { updatedAt: "desc" }
    }),
    getUserLeaderboardStanding(profile.id),
    getLearningStreak(profile.id, now),
    prisma.userQuizAttempt.findMany({
      where: { userId: profile.id, completedAt: { not: null } },
      select: {
        id: true,
        quizId: true,
        score: true,
        passed: true,
        completedAt: true,
        quiz: { select: { passingScore: true, room: { select: { title: true, slug: true } } } }
      },
      orderBy: { completedAt: "desc" },
      take: ATTEMPT_LIMIT
    }),
    prisma.learningPath.findMany({
      where: { isPublished: true },
      select: { id: true, slug: true, title: true, difficulty: true, logoUrl: true, rooms: { where: { isPublished: true }, select: { id: true } } }
    }),
    // Agregat seluruh riwayat agar angka tidak terpotong oleh batas 100 attempt di atas.
    prisma.userQuizAttempt.count({ where: { userId: profile.id, completedAt: { not: null } } }),
    prisma.userQuizAttempt.groupBy({
      by: ["quizId"],
      where: { userId: profile.id, passed: true }
    })
  ]);

  // Beginner → Intermediate → Advanced, lalu judul (urutan abjad menaruh "Advanced" lebih dulu).
  const publishedPaths = sortByDifficulty(publishedPathRows);

  const completedRows = rows.filter((row) => row.status === "COMPLETED");
  const inProgressRows = rows.filter((row) => row.status === "IN_PROGRESS");
  const completedRoomIds = new Set(completedRows.map((row) => row.roomId));
  const passedAttempts = quizAttempts.filter((attempt) => attempt.passed);
  // Quiz berbeda yang pernah lulus, dari seluruh riwayat (sama dengan halaman Profile).
  const quizzesPassed = passedQuizGroups.length;
  const attemptsCapped = attemptTotal > quizAttempts.length;
  // Pembilang dan penyebut memakai himpunan yang sama: room terbit di path yang terbit.
  const publishedRoomIds = new Set(publishedPaths.flatMap((path) => path.rooms.map((room) => room.id)));
  const publishedRoomTotal = publishedRoomIds.size;
  const completedPublishedRooms = completedRows.filter((row) => publishedRoomIds.has(row.roomId)).length;

  // Riwayat selesai: room lulus (centang) dan quiz lulus (skor), terbaru dulu.
  const completions: CompletionRow[] = [
    ...completedRows.map((row) => {
      const at = row.completedAt ?? row.updatedAt;
      return { id: `room-${row.id}`, at, kind: "room" as const, title: row.room.title, date: formatShortDate(at) };
    }),
    ...passedAttempts.map((attempt) => {
      const at = attempt.completedAt as Date;
      return {
        id: `quiz-${attempt.id}`,
        at,
        kind: "quiz-pass" as const,
        title: attempt.quiz.room.title,
        score: attempt.score,
        date: formatShortDate(at)
      };
    })
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const pathRows = publishedPaths
    .map((path) => {
      const total = path.rooms.length;
      const done = path.rooms.filter((room) => completedRoomIds.has(room.id)).length;
      return { path, total, done };
    })
    // Path yang sedang berjalan di atas, lalu yang sudah selesai, lalu yang belum dimulai (sort stabil: urutan kesulitan tetap).
    .sort((a, b) => {
      const rank = (row: { total: number; done: number }) => (row.done > 0 && row.done < row.total ? 0 : row.total > 0 && row.done === row.total ? 1 : 2);
      return rank(a) - rank(b);
    });

  return (
    <AppShell title="Progress" subtitle="Every room you've passed, every quiz score, and where each path stands." role={profile.role}>
      <section className="sheet overflow-hidden" aria-label="Your numbers">
        <div className="grid grid-cols-2 gap-px bg-line-soft lg:grid-cols-4">
          <Figure className="bg-sheet p-4 sm:p-5" label="Points" value={formatNumber(standing.points)} note={standing.rank ? `Rank #${standing.rank}` : "Earn points to rank"} />
          <Figure
            className="bg-sheet p-4 sm:p-5"
            label="Rooms completed"
            value={formatNumber(completedPublishedRooms)}
            note={`of ${formatNumber(publishedRoomTotal)} published`}
          />
          <Figure
            className="bg-sheet p-4 sm:p-5"
            label="Quizzes passed"
            value={formatNumber(quizzesPassed)}
            note={attemptTotal === 0 ? "No attempts yet" : plural(attemptTotal, "attempt")}
          />
          <Figure
            className="bg-sheet p-4 sm:p-5"
            label="Streak"
            value={streak.streakDays}
            unit={streak.streakDays === 1 ? "day" : "days"}
            note={`${plural(streak.activeDays, "active day")} in the last ${ACTIVITY_WINDOW_DAYS} days`}
          />
        </div>
      </section>

      <section className="sheet mt-5 p-4 sm:p-6" aria-label="Completed">
        <SectionHeader
          title="Completed"
          description={
            attemptsCapped
              ? `Every passed room, plus the quizzes passed in your latest ${ATTEMPT_LIMIT} attempts, most recent first.`
              : "Every passed room and quiz, most recent first."
          }
        />
        {completions.length > 0 ? (
          <CompletionList entries={completions} />
        ) : (
          <EmptyState
            title="Nothing completed yet"
            message="Finished rooms and passed quizzes show up here."
            action={
              <Link href="/learning-paths" className="text-link text-sm">
                Choose a learning path
              </Link>
            }
          />
        )}
      </section>

      <div className={`mt-5 grid grid-cols-1 gap-5 ${inProgressRows.length > 0 ? "xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
        <>
          {inProgressRows.length > 0 ? (
            <section className="sheet p-5 sm:p-6" aria-label="Rooms in progress">
              <SectionHeader title="Rooms in progress" />
              <ul className="-mx-2 space-y-1">
                {inProgressRows.map((row) => (
                  <li key={row.id}>
                    <Link href={`/rooms/${row.room.slug}`} className="group flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-well">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                          {row.room.title}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-3">
                          {row.room.difficulty} · {formatRelativeTime(row.updatedAt, now)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ProgressBar value={row.progressPercentage} label={`${row.room.title} progress`} className="w-16 sm:w-28" />
                        <span className="figure w-9 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="sheet p-5 sm:p-6" aria-label="Quiz attempts">
            <SectionHeader
              title="Quiz attempts"
              description={`${
                attemptsCapped ? `Your latest ${quizAttempts.length} of ${plural(attemptTotal, "attempt")}. ` : ""
              }Pass mark is set per quiz by its instructor.`}
            />
            {quizAttempts.length === 0 ? (
              <EmptyState title="No quiz attempts yet" message="Finish a room's tasks, then take its quiz to see your scores here." />
            ) : (
              <div className="-mx-5 overflow-x-auto sm:-mx-6">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="field-label border-b border-line px-3 py-2.5 pl-5 text-left sm:pl-6">
                        Room
                      </th>
                      <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-right">
                        Score
                      </th>
                      <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-left">
                        Result
                      </th>
                      <th scope="col" className="field-label border-b border-line px-3 py-2.5 pr-5 text-right sm:pr-6">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {quizAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-well">
                        <td className="px-3 py-2.5 pl-5 sm:pl-6">
                          <Link href={`/rooms/${attempt.quiz.room.slug}/quiz`} className="font-semibold text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4">
                            {attempt.quiz.room.title}
                          </Link>
                        </td>
                        <td className="figure px-3 py-2.5 text-right">
                          <span className="font-semibold text-ink">{attempt.score}%</span>
                          <span className="block text-xs text-ink-3">pass {attempt.quiz.passingScore}%</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Passed" : "Retry"}</StatusPill>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-ink-2 sm:pr-6">
                          {formatShortDate(attempt.completedAt as Date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      </div>

      <section className="sheet mt-5 p-5 sm:p-6" aria-label="Learning paths">
        <SectionHeader
          title="Learning paths"
          action={
            <Link href="/learning-paths" className="text-link text-sm">
              All paths
            </Link>
          }
        />
        {pathRows.length > 0 ? (
          <ul className="-mx-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
            {pathRows.map(({ path, total, done }) => (
              <li key={path.id}>
                <Link href={`/learning-paths/${path.slug}`} className="group flex items-center gap-3.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-well">
                  <EntityLogo name={path.title} src={path.logoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                      {path.title}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-3">
                      {total === 0 ? "No rooms yet" : `${done} of ${total} ${total === 1 ? "room" : "rooms"}`} · {path.difficulty}
                    </p>
                  </div>
                  {total > 0 && done === total ? <StatusPill tone="done">Complete</StatusPill> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No learning paths yet" message="Published paths will appear here." />
        )}
      </section>
    </AppShell>
  );
}
