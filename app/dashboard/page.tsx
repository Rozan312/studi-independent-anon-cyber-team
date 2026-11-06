import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementAudience } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { PageNotice } from "@/components/ui/page-notice";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { DISPLAY_TIME_ZONE, getRoomAvailability } from "@/lib/learning/availability";
import { formatDayMonth, formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";
import { getGlobalLeaderboard } from "@/lib/services/leaderboard-service";
import { getLearningStreak } from "@/lib/services/activity-service";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { earnablePoints } from "@/lib/learning/points";
import { EntityLogo } from "@/components/paper/entity-logo";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/** Penyelesaian dalam 15 menit terakhir: centangnya digambar sekali saat dashboard dibuka. */
const FRESH_COMPLETION_MS = 15 * 60 * 1000;

function firstValue(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildDashboardNotice(params: SearchParams) {
  if (firstValue(params, "error") === "forbidden") {
    return {
      tone: "warning" as const,
      title: "Access denied",
      message: "That page needs a higher role, so you were sent to your dashboard."
    };
  }
  return null;
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: DISPLAY_TIME_ZONE }).format(now));
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

type CompletionRow = CompletionEntry & { at: Date };

export default async function DashboardPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const profile = await requireRole(["STUDENT"]);
  const notice = buildDashboardNotice(searchParams);
  const now = new Date();

  const [recentProgress, leaderboard, announcements, completedRooms, quizAttempts, publishedPathRows, streak, passedQuizGroups] =
    await Promise.all([
      prisma.userRoomProgress.findMany({
        where: { userId: profile.id },
        include: { room: { include: { learningPath: { select: { slug: true, isPublished: true } } } } },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      getGlobalLeaderboard(3),
      prisma.announcement.findMany({
        where: { isPublished: true, audience: { in: [AnnouncementAudience.ALL, profile.role as AnnouncementAudience] } },
        orderBy: { createdAt: "desc" },
        take: 3
      }),
      prisma.userRoomProgress.findMany({
        where: { userId: profile.id, status: "COMPLETED" },
        select: { id: true, roomId: true, completedAt: true, updatedAt: true, room: { select: { title: true } } },
        orderBy: { completedAt: "desc" }
      }),
      prisma.userQuizAttempt.findMany({
        where: { userId: profile.id, completedAt: { not: null } },
        select: { id: true, score: true, passed: true, completedAt: true, quiz: { select: { room: { select: { title: true } } } } },
        orderBy: { completedAt: "desc" },
        take: 6
      }),
      prisma.learningPath.findMany({
        where: { isPublished: true },
        include: { rooms: { where: { isPublished: true }, select: { id: true } } },
        orderBy: [{ difficulty: "asc" }, { title: "asc" }]
      }),
      getLearningStreak(profile.id, now),
      // Quiz berbeda yang pernah lulus (sama dengan halaman Progress dan Profile).
      prisma.userQuizAttempt.groupBy({ by: ["quizId"], where: { userId: profile.id, passed: true } })
    ]);

  const completedRoomIds = new Set(completedRooms.map((row) => row.roomId));
  const publishedPaths = sortByDifficulty(publishedPathRows);
  // "Rooms completed" dihitung atas himpunan yang sama dengan penyebutnya: room terbit di path terbit.
  const publishedRoomIds = new Set(publishedPaths.flatMap((path) => path.rooms.map((room) => room.id)));
  const completedPublishedCount = [...completedRoomIds].filter((roomId) => publishedRoomIds.has(roomId)).length;

  // Path aktif: path dari room yang terakhir disentuh; bila belum ada, path pertama yang terbit.
  const activeProgressRow = recentProgress.find((row) => row.room.learningPath.isPublished && row.room.isPublished);
  const activePathSlug = activeProgressRow?.room.learningPath.slug ?? publishedPaths.find((path) => path.rooms.length > 0)?.slug;
  const activePath = activePathSlug ? await getLearningPathProgressForCurrentUser(profile.id, activePathSlug) : null;

  // Langkah berikutnya: room yang sedang dikerjakan bila belum selesai dan masih terbuka, lalu room pertama yang
  // belum selesai dan terbuka. Room tertutup/terjadwal hanya dipilih bila tidak ada lagi room terbuka yang tersisa.
  const pathRooms = activePath?.path.rooms ?? [];
  const isUnfinished = (room: (typeof pathRooms)[number]) => room.userProgress[0]?.status !== "COMPLETED";
  const isOpen = (room: (typeof pathRooms)[number]) => getRoomAvailability(room, now).isOpen;
  const lastTouched = pathRooms.find((room) => room.id === activeProgressRow?.roomId && isUnfinished(room) && isOpen(room));
  const nextRoom =
    lastTouched ??
    pathRooms.find((room) => isUnfinished(room) && isOpen(room)) ??
    pathRooms.find((room) => isUnfinished(room)) ??
    null;
  const nextRoomPosition = nextRoom ? pathRooms.findIndex((room) => room.id === nextRoom.id) + 1 : 0;
  const nextRoomProgress = nextRoom?.userProgress[0];
  const nextRoomAvailability = nextRoom ? getRoomAvailability(nextRoom, now) : null;

  const nextRoomDetail = nextRoom
    ? await prisma.room.findUnique({
        where: { id: nextRoom.id },
        select: {
          tasks: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              points: true,
              userSubmissions: { where: { userId: profile.id, isCorrect: true }, take: 1, select: { id: true } }
            }
          },
          quiz: { select: { id: true, attempts: { where: { userId: profile.id, passed: true }, take: 1, select: { id: true } } } }
        }
      })
    : null;

  const tasks = nextRoomDetail?.tasks ?? [];
  const nextTaskIndex = tasks.findIndex((task) => task.userSubmissions.length === 0);
  const nextTask = nextTaskIndex >= 0 ? tasks[nextTaskIndex] : null;
  const quizWaiting = !nextTask && Boolean(nextRoomDetail?.quiz) && !nextRoomDetail?.quiz?.attempts.length;
  const nextRoomPoints = nextRoom && nextRoomDetail ? earnablePoints({ points: nextRoom.points, quiz: nextRoomDetail.quiz, tasks }).total : 0;

  // Riwayat selesai: room lulus dan attempt quiz, terbaru dulu.
  const completionRows: CompletionRow[] = [
    ...completedRooms.slice(0, 6).map((row) => {
      const at = row.completedAt ?? row.updatedAt;
      return { id: `room-${row.id}`, at, kind: "room" as const, title: row.room.title, date: formatShortDate(at) };
    }),
    ...quizAttempts.map((attempt) => {
      const at = attempt.completedAt as Date;
      return {
        id: `quiz-${attempt.id}`,
        at,
        kind: attempt.passed ? ("quiz-pass" as const) : ("quiz-retry" as const),
        title: attempt.quiz.room.title,
        score: attempt.score,
        date: formatShortDate(at)
      };
    })
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5)
    .map((row) => ({ ...row, fresh: now.getTime() - row.at.getTime() < FRESH_COMPLETION_MS }));

  const pathRows = publishedPaths
    .map((path) => {
      const total = path.rooms.length;
      const done = path.rooms.filter((room) => completedRoomIds.has(room.id)).length;
      return { path, total, done };
    })
    // Path yang sedang berjalan di atas, lalu yang belum dimulai, lalu yang sudah selesai.
    .sort((a, b) => {
      const rank = (row: { total: number; done: number }) => (row.done > 0 && row.done < row.total ? 0 : row.done === 0 ? 1 : 2);
      return rank(a) - rank(b);
    })
    .slice(0, 6);

  const firstName = profile.fullName.split(" ")[0] || profile.username;
  const subtitle = activePath
    ? `${activePath.path.title} · ${activePath.completedRooms} of ${activePath.totalRooms} ${activePath.totalRooms === 1 ? "room" : "rooms"} completed`
    : "Pick a learning path to start your first room.";
  const pathMinutes = pathRooms.reduce((sum, room) => sum + room.estimatedMinutes, 0);

  return (
    <AppShell
      title={
        <>
          {greeting(now)}, <span className="text-cyan-ink">{firstName}</span>
        </>
      }
      subtitle={subtitle}
      role={profile.role}
    >
      {notice ? <PageNotice tone={notice.tone} title={notice.title} message={notice.message} className="mb-6" /> : null}

      {/* Kolom samping 340px baru dibuka di xl: di lg rail 256px masih terbuka, kolom utama tinggal di bawah 330px. */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Panel Continue: satu-satunya panel bertepi cyan, karena di sinilah langkah berikutnya. */}
          <section
            className={`sheet grid overflow-hidden md:grid-cols-2 ${activePath ? "border-cyan-ink/35" : ""}`}
            aria-labelledby="next-step-title"
          >
            {activePath ? (
              <>
                <div className="flex flex-col p-5 sm:p-6 md:border-r md:border-line">
                  {nextRoom ? (
                    <>
                      <h2 id="next-step-title" className="text-[1.375rem] font-bold leading-tight tracking-[-0.015em] text-ink [text-wrap:balance]">
                        {nextRoom.title}
                      </h2>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
                        <span>
                          Room {nextRoomPosition} of {activePath.totalRooms}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{nextRoom.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="figure">{formatNumber(nextRoomPoints)} pts</span>
                        <span aria-hidden="true">·</span>
                        <span className="figure">{nextRoom.estimatedMinutes} min</span>
                        {nextRoomAvailability && !nextRoomAvailability.isOpen ? (
                          <StateTag tone={nextRoomAvailability.state === "upcoming" ? "amber" : "red"} className="ml-1">
                            {nextRoomAvailability.state === "upcoming" && nextRoomAvailability.opensAt
                              ? `Opens ${formatDayMonth(nextRoomAvailability.opensAt)}`
                              : "Closed"}
                          </StateTag>
                        ) : null}
                      </p>

                      {nextTask || quizWaiting ? (
                        <p className="mt-4 rounded-lg border border-line-strong bg-well px-3.5 py-2.5 text-[0.9375rem] text-ink">
                          {/* Label dan hitungan dijaga satu potong (whitespace-nowrap) agar "2 of 2" tidak terbelah di ujung baris. */}
                          <span className="whitespace-nowrap font-display font-semibold text-cyan-ink">
                            {nextTask ? (
                              <>
                                Next task <span className="figure">{nextTaskIndex + 1} of {tasks.length}</span>
                              </>
                            ) : (
                              "Next: quiz"
                            )}
                          </span>
                          <span className="text-ink-3"> · </span>
                          {nextTask ? nextTask.title : "All tasks answered. Pass the quiz to complete this room."}
                        </p>
                      ) : null}

                      {nextRoomProgress && nextRoomProgress.progressPercentage > 0 ? (
                        <div className="mt-4">
                          <div className="mb-1.5 flex justify-between text-xs text-ink-3">
                            <span>Room progress</span>
                            <span className="figure font-semibold text-ink-2">{nextRoomProgress.progressPercentage}%</span>
                          </div>
                          <ProgressBar value={nextRoomProgress.progressPercentage} tone="cyan" label={`${nextRoom.title} progress`} />
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-auto md:pt-5">
                        {nextRoomAvailability?.isOpen ? (
                          <Link href={`/rooms/${nextRoom.slug}`} className="btn-primary min-h-11 px-5 text-[0.9375rem]">
                            {nextRoomProgress && nextRoomProgress.status !== "NOT_STARTED" ? "Resume room" : "Start room"}
                            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Link>
                        ) : (
                          <Link href={`/rooms/${nextRoom.slug}`} className="btn-secondary min-h-11">
                            View room
                          </Link>
                        )}
                        <Link href={`/learning-paths/${activePath.path.slug}`} className="btn-secondary min-h-11">
                          View path
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 id="next-step-title" className="text-[1.375rem] font-bold leading-tight text-ink">
                        {activePath.path.title} is complete
                      </h2>
                      <p className="mt-1.5 text-ink-2">You passed every room in this path. Choose the next path to keep your streak going.</p>
                      <div className="mt-5">
                        <Link href="/learning-paths" className="btn-primary">
                          Choose next path
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Daftar room path aktif: posisi member, status tiap room, dan perkiraan menitnya. */}
                <div className="border-t border-line p-5 sm:p-6 md:border-t-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold text-ink">{activePath.path.title}</h3>
                    <span className="figure shrink-0 text-xs text-ink-3">{pathMinutes} min</span>
                  </div>
                  <ol className="mt-2 divide-y divide-line" aria-label={`${activePath.path.title} rooms`}>
                    {pathRooms.map((room, index) => {
                      const progress = room.userProgress[0];
                      const done = progress?.status === "COMPLETED";
                      const isNext = room.id === nextRoom?.id;
                      const availability = getRoomAvailability(room, now);
                      const serial = String(index + 1).padStart(2, "0");
                      const detail = done
                        ? `Passed${progress?.completedAt ? ` · ${formatDayMonth(progress.completedAt)}` : ""}`
                        : isNext
                          ? "Up next"
                          : availability.isOpen
                            ? "Not started"
                            : availability.state === "upcoming" && availability.opensAt
                              ? `Opens ${formatDayMonth(availability.opensAt)}`
                              : "Closed";
                      return (
                        <li key={room.id}>
                          <Link
                            href={`/rooms/${room.slug}`}
                            aria-label={`Room ${serial}: ${room.title}, ${detail.toLowerCase()}`}
                            aria-current={isNext ? "step" : undefined}
                            className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 coarse:min-h-11"
                          >
                            <span
                              className={`figure grid h-7 w-7 place-items-center rounded-full text-[0.6875rem] font-bold ${
                                done
                                  ? "border border-violet/45 bg-violet-soft text-violet"
                                  : isNext
                                    ? "border-[1.5px] border-dashed border-cyan-ink text-cyan-ink"
                                    : "border border-line-strong text-ink-3"
                              }`}
                              aria-hidden="true"
                            >
                              {done ? (
                                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                serial
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-display font-semibold text-ink group-hover:text-cyan-ink">{room.title}</span>
                              <span className={`block text-xs ${isNext ? "text-cyan-ink" : "text-ink-3"}`}>{detail}</span>
                            </span>
                            <span className="figure text-xs text-ink-3">{room.estimatedMinutes} min</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </>
            ) : (
              <div className="p-5 sm:p-6 md:col-span-2">
                <h2 id="next-step-title" className="sr-only">
                  Next step
                </h2>
                <EmptyState
                  title="No learning paths are published yet"
                  message="Your next room shows up here once instructors publish a learning path."
                />
              </div>
            )}
          </section>

          {/* Strip angka dasbor (satu dari dua di aplikasi, bersama hasil quiz). Poin dan peringkat tidak diulang di sini: sudah ada di pil bar atas dan Top members. */}
          <section className="sheet overflow-hidden" aria-label="Your numbers">
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
              <Figure
                className="bg-sheet p-4 sm:p-5"
                label="Streak"
                value={streak.streakDays}
                unit={streak.streakDays === 1 ? "day" : "days"}
                note={`${plural(streak.activeDays, "active day")} in the last 120 days`}
              />
              <Figure className="bg-sheet p-4 sm:p-5" label="Rooms completed" value={completedPublishedCount} note={`of ${publishedRoomIds.size} published`} />
              <Figure className="bg-sheet p-4 sm:p-5" label="Quizzes passed" value={passedQuizGroups.length} note="Each quiz counted once" />
            </div>
          </section>

          {/* Riwayat terbaru (lulus dan perlu diulang); room berikutnya sudah ada di panel Continue, jadi tidak diulang. */}
          <section className="sheet px-5 pb-1 pt-4 sm:px-6" aria-labelledby="activity-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <h2 id="activity-title" className="text-base font-bold text-ink">
                Recent activity
              </h2>
              <Link href="/progress" className="text-link text-sm">
                Full record
              </Link>
            </div>
            <CompletionList entries={completionRows} />
            {completionRows.length === 0 ? <p className="py-3 text-sm text-ink-3">Passed rooms and quiz scores show up here.</p> : null}
          </section>

          <section className="sheet p-5 sm:p-6" aria-labelledby="paths-title">
            <SectionHeader
              id="paths-title"
              title="Learning paths"
              action={
                <Link href="/learning-paths" className="text-link text-sm">
                  All paths
                </Link>
              }
            />
            {pathRows.length > 0 ? (
              <ul className="-mx-2 grid gap-1 sm:grid-cols-2">
                {pathRows.map(({ path, total, done }) => (
                  <li key={path.id}>
                    <Link href={`/learning-paths/${path.slug}`} className="group flex items-center gap-3.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-well">
                      <EntityLogo name={path.title} src={path.logoUrl} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display font-semibold text-ink group-hover:text-cyan-ink">{path.title}</span>
                        <span className="mt-0.5 block text-sm text-ink-3">
                          {total === 0 ? "No rooms yet" : `${done} of ${plural(total, "room")}`} · {path.difficulty}
                        </span>
                      </span>
                      {total > 0 && done === total ? <StatusPill tone="done">Complete</StatusPill> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No learning paths yet" message="Published paths will appear here." />
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="sheet px-5 pb-2 pt-4" aria-labelledby="top-members-title">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 id="top-members-title" className="text-base font-bold text-ink">
                Top members
              </h2>
              <Link href="/leaderboard" className="text-link text-sm">
                Leaderboard
              </Link>
            </div>
            {leaderboard.length > 0 ? (
              <ol className="divide-y divide-line">
                {leaderboard.map((row) => {
                  const isYou = row.user?.id === profile.id;
                  return (
                    <li key={row.user?.id ?? `rank-${row.rank}`} className={`flex items-center gap-3 py-2.5 text-sm ${isYou ? "font-semibold text-cyan-ink" : "text-ink"}`}>
                      <span className={`figure w-6 font-bold ${isYou ? "" : "text-ink-3"}`}>{row.rank}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {row.user?.username ?? "unknown"}
                        {isYou ? <span className="ml-1.5 font-normal">(you)</span> : null}
                      </span>
                      <span className={`figure ${isYou ? "" : "text-ink-2"}`}>{formatNumber(row.points)}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="py-3 text-sm text-ink-3">No points recorded yet. The first correct answer takes the top spot.</p>
            )}
          </section>

          <section className="sheet p-5" aria-labelledby="announcements-title">
            <h2 id="announcements-title" className="text-base font-bold text-ink">
              Announcements
            </h2>
            {announcements.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {announcements.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-xs text-ink-3">{formatRelativeTime(item.createdAt, now)}</p>
                    <p className="mt-0.5 font-display font-semibold leading-snug text-ink">{item.title}</p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-ink-2">{item.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-3">No announcements right now.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
