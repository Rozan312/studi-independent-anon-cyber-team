import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { PathRosette } from "@/components/paper/rosette";
import { StateStamp } from "@/components/paper/stamp";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDayMonth, formatNumber, formatShortDate } from "@/lib/format/date";
import { getRoomAvailability } from "@/lib/learning/availability";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";
import { earnablePoints } from "@/lib/learning/points";

export const dynamic = "force-dynamic";

export default async function LearningPathDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const [progress, roomPointRows] = await Promise.all([
    getLearningPathProgressForCurrentUser(profile.id, params.slug),
    prisma.room.findMany({
      where: { isPublished: true, learningPath: { slug: params.slug, isPublished: true } },
      select: { id: true, points: true, quiz: { select: { id: true } }, tasks: { select: { points: true } } }
    })
  ]);
  if (!progress) notFound();

  const pointsByRoom = new Map(roomPointRows.map((room) => [room.id, earnablePoints(room).total]));

  const { path } = progress;
  const now = new Date();

  const rooms = path.rooms.map((room) => ({
    room,
    availability: getRoomAvailability(room, now),
    userProgress: room.userProgress[0] ?? null
  }));

  // Langkah berikutnya: room pertama yang belum selesai dan sedang terbuka.
  const nextRoomId = rooms.find((row) => row.userProgress?.status !== "COMPLETED" && row.availability.isOpen)?.room.id ?? null;
  const nextRow = rooms.find((row) => row.room.id === nextRoomId) ?? null;
  const totalPoints = path.rooms.reduce((sum, room) => sum + (pointsByRoom.get(room.id) ?? 0), 0);
  const { completedRooms: done, totalRooms: total } = progress;
  const roomNoun = total === 1 ? "room" : "rooms";

  const summary =
    total === 0
      ? "No rooms are published in this path yet."
      : done === total
        ? "Every room in this path carries your stamp."
        : `${done} of ${total} ${roomNoun} passed. Work through them in order so each idea builds on the last.`;

  return (
    <AppShell
      title={path.title}
      subtitle={path.description}
      role={profile.role}
      actions={
        nextRow ? (
          <Link href={`/rooms/${nextRow.room.slug}`} className="btn-primary">
            {nextRow.userProgress && nextRow.userProgress.status !== "NOT_STARTED" ? "Resume room" : "Start next room"}
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null
      }
    >
      <section className="sheet overflow-hidden" aria-label="Path overview">
        {path.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={path.coverImageUrl} alt="" className="h-32 w-full border-b border-line object-cover sm:h-44" />
        ) : null}
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-7">
          <PathRosette
            seed={path.slug}
            size={184}
            progress={total > 0 ? done / total : 0}
            label={`${done}/${total}`}
            sublabel={roomNoun}
            title={`${path.title}: ${done} of ${total} ${roomNoun} completed`}
            animate
            className="mx-auto h-36 w-36 sm:mx-0 sm:h-[184px] sm:w-[184px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-ink-2">{summary}</p>
              {total > 0 && done === total ? <StatusPill tone="done">Complete</StatusPill> : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft">
              <Figure
                className="bg-sheet p-4"
                label="Difficulty"
                value={<span className="text-xl sm:text-2xl">{path.difficulty}</span>}
              />
              <Figure
                className="bg-sheet p-4"
                label="Estimated time"
                value={`~${path.estimatedHours}`}
                unit={path.estimatedHours === 1 ? "hour" : "hours"}
              />
              <Figure className="bg-sheet p-4" label="Rooms" value={total} note={`${done} passed`} />
              <Figure className="bg-sheet p-4" label="Total points" value={formatNumber(totalPoints)} unit="pts" note="Tasks plus quiz bonuses" />
            </div>
          </div>
        </div>
      </section>

      <section className="sheet mt-5 p-5 sm:p-6" aria-label="Rooms in this path">
        <SectionHeader title="Rooms in this path" description="Each room combines a walkthrough, practice tasks, and a quiz." />
        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms published yet"
            message="The instructors haven't published a room in this path. Check back soon."
            action={
              <Link href="/learning-paths" className="text-link text-sm">
                Browse other paths
              </Link>
            }
          />
        ) : (
          <ol className="-mx-2 space-y-1">
            {rooms.map(({ room, availability, userProgress }, index) => {
              const isCompleted = userProgress?.status === "COMPLETED";
              const isNext = room.id === nextRoomId;
              const percentage = userProgress?.progressPercentage ?? 0;
              const isInProgress = !isCompleted && (userProgress?.status === "IN_PROGRESS" || percentage > 0);

              return (
                <li key={room.id}>
                  <Link
                    href={`/rooms/${room.slug}`}
                    aria-current={isNext ? "step" : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors sm:gap-4 ${
                      isNext ? "bg-cyan-soft/60 hover:bg-cyan-soft" : "hover:bg-well"
                    }`}
                  >
                    <span className="figure w-7 shrink-0 text-center text-lg font-bold text-ink-3">{index + 1}</span>
                    {room.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={room.coverImageUrl}
                        alt=""
                        className="hidden h-12 w-16 shrink-0 rounded-md border border-line-soft object-cover sm:block"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                        {room.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-3">
                        {room.difficulty} · {room.estimatedMinutes} min · {formatNumber(pointsByRoom.get(room.id) ?? 0)} pts
                        {availability.isOpen && availability.closesAt ? ` · Closes ${formatDayMonth(availability.closesAt)}` : ""}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                      {isCompleted && userProgress ? (
                        <>
                          <StatusPill tone="done">Passed</StatusPill>
                          <span className="text-xs text-ink-3">{formatShortDate(userProgress.completedAt ?? userProgress.updatedAt)}</span>
                        </>
                      ) : !availability.isOpen ? (
                        <>
                          <StateStamp tone={availability.state === "upcoming" ? "amber" : "red"}>
                            {availability.state === "upcoming" && availability.opensAt
                              ? `Opens ${formatDayMonth(availability.opensAt)}`
                              : availability.state === "draft"
                                ? "Draft"
                                : "Closed"}
                          </StateStamp>
                          {percentage > 0 ? <span className="text-xs text-ink-3">{percentage}% done</span> : null}
                        </>
                      ) : (
                        <>
                          {isNext ? <StatusPill tone="primary">Next</StatusPill> : null}
                          {isInProgress ? (
                            <div className="flex items-center gap-2">
                              <ProgressBar value={percentage} label={`${room.title} progress`} className="w-16 sm:w-24" />
                              <span className="figure text-xs font-semibold text-ink-2">{percentage}%</span>
                            </div>
                          ) : !isNext ? (
                            <span className="text-xs text-ink-3">Not started</span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </AppShell>
  );
}
