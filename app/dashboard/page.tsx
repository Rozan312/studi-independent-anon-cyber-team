import Link from "next/link";
import { AnnouncementAudience } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { ProgressRing } from "@/components/paper/progress-ring";
import { StateTag } from "@/components/paper/state-tag";
import { CircuitStrip } from "@/components/paper/circuit";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { PageNotice } from "@/components/ui/page-notice";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { DISPLAY_TIME_ZONE, getRoomAvailability } from "@/lib/learning/availability";
import { formatDayMonth, formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";
import { getGlobalLeaderboard, getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";
import { getLearningStreak } from "@/lib/services/activity-service";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { earnablePoints } from "@/lib/learning/points";
import { EntityLogo } from "@/components/paper/entity-logo";

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

  const [recentProgress, leaderboard, announcements, completedRooms, quizAttempts, publishedPathRows, standing, streak] =
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
      getUserLeaderboardStanding(profile.id),
      getLearningStreak(profile.id, now)
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

  return (
    <AppShell title={`${greeting(now)}, ${firstName}`} subtitle={subtitle} role={profile.role}>
      {notice ? <PageNotice tone={notice.tone} title={notice.title} message={notice.message} className="mb-6" /> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Langkah berikutnya */}
        <section className="sheet flex flex-col overflow-hidden" aria-labelledby="next-step-title">
          {activePath ? <CircuitStrip className="border-b border-line-soft bg-paper/60" /> : null}
          <div className="flex flex-1 flex-col gap-6 p-5 sm:flex-row sm:items-start sm:p-7">
          {activePath ? (
            <>
              <ProgressRing
                segments={pathRooms.map((room) =>
                  room.userProgress[0]?.status === "COMPLETED" ? "done" : room.id === nextRoom?.id ? "next" : "todo"
                )}
                size={200}
                label={`${activePath.completedRooms}/${activePath.totalRooms}`}
                sublabel={activePath.totalRooms === 1 ? "room" : "rooms"}
                title={`${activePath.path.title}: ${activePath.completedRooms} of ${plural(activePath.totalRooms, "room")} completed`}
                className="mx-auto h-40 w-40 sm:mx-0 sm:h-[200px] sm:w-[200px]"
              />
              <div className="min-w-0 flex-1 sm:pt-3">
                {nextRoom ? (
                  <>
                    <h2 id="next-step-title" className="text-2xl font-bold leading-tight tracking-[-0.015em] text-ink [text-wrap:balance]">
                      {nextRoom.title}
                    </h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2">
                      <span>
                        Room {nextRoomPosition} of {activePath.totalRooms}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{nextRoom.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatNumber(nextRoomPoints)} pts</span>
                      <span aria-hidden="true">·</span>
                      <span>{nextRoom.estimatedMinutes} min</span>
                      {nextRoomAvailability && !nextRoomAvailability.isOpen ? (
                        <StateTag tone={nextRoomAvailability.state === "upcoming" ? "amber" : "red"} className="ml-1">
                          {nextRoomAvailability.state === "upcoming" && nextRoomAvailability.opensAt
                            ? `Opens ${formatDayMonth(nextRoomAvailability.opensAt)}`
                            : "Closed"}
                        </StateTag>
                      ) : null}
                    </p>

                    {nextTask || quizWaiting ? (
                      <div className="mt-4 rounded-lg border border-dashed border-cyan-ink/40 bg-cyan-soft/50 px-4 py-3">
                        <p className="text-sm font-semibold text-cyan-ink">
                          {nextTask ? `Task ${nextTaskIndex + 1} of ${tasks.length}` : "Quiz"}
                        </p>
                        <p className="mt-0.5 text-[0.9375rem] text-ink">{nextTask ? nextTask.title : "All tasks answered. Pass the quiz to complete this room."}</p>
                      </div>
                    ) : null}

                    {nextRoomProgress && nextRoomProgress.progressPercentage > 0 ? (
                      <div className="mt-4 max-w-sm">
                        <div className="mb-1.5 flex justify-between text-xs text-ink-3">
                          <span>Room progress</span>
                          <span className="figure font-semibold text-ink-2">{nextRoomProgress.progressPercentage}%</span>
                        </div>
                        <ProgressBar value={nextRoomProgress.progressPercentage} label={`${nextRoom.title} progress`} />
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {nextRoomAvailability?.isOpen ? (
                        <Link href={`/rooms/${nextRoom.slug}`} className="btn-primary min-h-11 px-5 text-[0.9375rem]">
                          {nextRoomProgress && nextRoomProgress.status !== "NOT_STARTED" ? "Resume room" : "Start room"}
                          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      ) : (
                        <Link href={`/rooms/${nextRoom.slug}`} className="btn-secondary">
                          View room
                        </Link>
                      )}
                      <Link href={`/learning-paths/${activePath.path.slug}`} className="text-link text-sm">
                        View {activePath.path.title}
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id="next-step-title" className="text-2xl font-bold leading-tight text-ink">
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
            </>
          ) : (
            <div className="w-full">
              <h2 id="next-step-title" className="sr-only">
                Next step
              </h2>
              <EmptyState
                title="No learning paths are published yet"
                message="Instructors are still preparing material. Check back soon."
              />
            </div>
          )}
          </div>
          {activePath && pathRooms.length > 1 ? (
            // Itinerary path aktif: setiap room bernomor seri dengan statusnya, agar posisi member selalu terlihat.
            <ol className="mt-auto flex gap-1.5 overflow-x-auto border-t border-line-soft bg-paper/50 px-5 py-3 sm:px-7" aria-label={`${activePath.path.title} rooms`}>
              {pathRooms.map((room, index) => {
                const done = room.userProgress[0]?.status === "COMPLETED";
                const isNext = room.id === nextRoom?.id;
                const open = getRoomAvailability(room, now).isOpen;
                const state = done ? "passed" : isNext ? "next" : open ? "not started" : "not open";
                return (
                  <li key={room.id} className="shrink-0">
                    <Link
                      href={`/rooms/${room.slug}`}
                      aria-label={`Room ${index + 1}: ${room.title}, ${state}`}
                      title={room.title}
                      aria-current={isNext ? "step" : undefined}
                      className={`figure inline-flex h-8 min-w-[2.75rem] items-center justify-center gap-1 rounded-md px-2 text-xs font-bold transition-colors ${
                        done
                          ? "bg-violet-soft text-violet hover:bg-violet/15"
                          : isNext
                            ? "bg-cyan-soft text-ink ring-1 ring-inset ring-cyan-ink/50"
                            : open
                              ? "border border-line bg-sheet text-ink-2 hover:border-line-strong"
                              : "border border-dashed border-line-strong text-ink-3"
                      }`}
                    >
                      {done ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                      {String(index + 1).padStart(2, "0")}
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </section>

        {/* Angka utama dan papan peringkat */}
        <div className="flex flex-col gap-5">
          <section className="sheet overflow-hidden" aria-label="Your numbers">
            <div className="grid grid-cols-2">
              <Figure className="border-b border-r border-line-soft p-4" label="Points" value={formatNumber(standing.points)} />
              <Figure
                className="border-b border-line-soft p-4"
                label="Streak"
                value={streak.streakDays}
                unit={streak.streakDays === 1 ? "day" : "days"}
                note={`${plural(streak.activeDays, "active day")} in the last 120 days`}
              />
              <Figure
                className="border-r border-line-soft p-4"
                label="Rooms completed"
                value={completedPublishedCount}
                note={`of ${publishedRoomIds.size} published`}
              />
              <Figure
                className="p-4"
                label="Rank"
                value={standing.rank ? `#${standing.rank}` : "–"}
                note={standing.rank ? `of ${plural(standing.totalRanked, "member")}` : "Earn points to rank"}
              />
            </div>
          </section>

          <section className="sheet p-4" aria-labelledby="top-members-title">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="top-members-title" className="font-semibold text-ink">
                Top members
              </h2>
              <Link href="/leaderboard" className="text-link text-sm">
                Leaderboard
              </Link>
            </div>
            {leaderboard.length > 0 ? (
              <ol className="divide-y divide-line-soft">
                {leaderboard.map((row) => {
                  const isYou = row.user?.id === profile.id;
                  return (
                    <li key={row.user?.id ?? `rank-${row.rank}`} className={`flex items-center gap-3 py-2 ${isYou ? "font-semibold" : ""}`}>
                      <span className="figure w-6 text-sm font-bold text-ink-3">{row.rank}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {row.user?.username ?? "unknown"}
                        {isYou ? <span className="ml-1.5 text-ink-3">(you)</span> : null}
                      </span>
                      <span className="figure text-sm text-ink-2">{formatNumber(row.points)} pts</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="py-2 text-sm text-ink-3">No points recorded yet. The first correct answer takes the top spot.</p>
            )}
          </section>
        </div>
      </div>

      {/* Riwayat selesai */}
      <section className="sheet mt-5 p-5 sm:p-6" aria-labelledby="completed-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="completed-title" className="text-lg font-bold text-ink">
              Completed
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">Rooms you&apos;ve passed and your latest quiz scores.</p>
          </div>
          <Link href="/progress" className="text-link text-sm">
            Full record
          </Link>
        </div>
        <div className="mt-4">
          <CompletionList entries={completionRows} next={nextRoom?.title} />
          {completionRows.length === 0 ? (
            <p className="mt-3 text-sm text-ink-3">Finished rooms and quiz scores show up here.</p>
          ) : null}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
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
                      <span className="block truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                        {path.title}
                      </span>
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

        <section className="sheet p-5" aria-labelledby="announcements-title">
          <h2 id="announcements-title" className="font-semibold text-ink">
            Announcements
          </h2>
          {announcements.length > 0 ? (
            <ul className="mt-3 space-y-4">
              {announcements.map((item) => (
                <li key={item.id}>
                  <p className="text-xs text-ink-3">{formatRelativeTime(item.createdAt, now)}</p>
                  <p className="mt-0.5 font-semibold leading-snug text-ink">{item.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-ink-2">{item.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-3">No announcements right now.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
