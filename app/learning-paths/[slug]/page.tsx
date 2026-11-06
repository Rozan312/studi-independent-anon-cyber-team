import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDayMonth, formatNumber, formatShortDate } from "@/lib/format/date";
import { getRoomAvailability } from "@/lib/learning/availability";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";
import { earnablePoints } from "@/lib/learning/points";
import { EntityLogo } from "@/components/paper/entity-logo";
import { FallbackImage } from "@/components/paper/fallback-image";
import { publishedPathTitle } from "@/lib/services/page-title-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: (await publishedPathTitle(params.slug)) ?? "Learning path" };
}

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
  const { completedRooms: done, totalRooms: total, percentage } = progress;
  const roomNoun = total === 1 ? "room" : "rooms";
  const complete = total > 0 && done === total;

  // Waktu path = jumlah menit room yang terbit, sama dengan daftar room di dasbor.
  const pathMinutes = path.rooms.reduce((sum, room) => sum + room.estimatedMinutes, 0);
  const minutesLeft = rooms.reduce((sum, row) => (row.userProgress?.status === "COMPLETED" ? sum : sum + row.room.estimatedMinutes), 0);
  const timeLine = complete || done === 0 ? `${pathMinutes} min across ${total} ${roomNoun}` : `${minutesLeft} min left of ${pathMinutes} min`;

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
          <FallbackImage src={path.coverImageUrl} alt="" fetchPriority="high" className="h-32 w-full border-b border-line object-cover sm:h-44" fallback={null} />
        ) : null}

        <div className="grid md:grid-cols-[minmax(0,1fr)_17rem]">
          {/* Ringkasan progres path: room lulus dari total, menit tersisa, bilah cyan (violet saat path selesai). */}
          <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
            <EntityLogo name={path.title} src={path.logoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              {total > 0 ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                    <p className="text-ink-2">
                      <span className="figure mr-1.5 text-[1.75rem] font-bold leading-none text-ink">{done}</span>
                      of {total} {roomNoun} passed
                    </p>
                    {complete ? (
                      <StatusPill tone="done">Complete</StatusPill>
                    ) : (
                      <span className="figure text-sm font-semibold text-ink-2">{percentage}%</span>
                    )}
                  </div>
                  <ProgressBar
                    value={percentage}
                    tone={complete ? "violet" : "cyan"}
                    label={`${path.title}: ${done} of ${total} ${roomNoun} passed`}
                    className="mt-3"
                  />
                  <p className="mt-2.5 text-sm text-ink-3">
                    {timeLine}
                    {complete ? <span className="text-ink-2"> · You passed every room in this path.</span> : null}
                  </p>
                </>
              ) : (
                <p className="pt-1 text-ink-2">No rooms are published in this path yet.</p>
              )}
            </div>
          </div>

          <dl className="divide-y divide-line border-t border-line px-5 sm:px-6 md:border-l md:border-t-0 md:py-2">
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="field-label">Difficulty</dt>
              <dd className="font-display font-semibold text-ink">{path.difficulty}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="field-label">Path estimate</dt>
              <dd className="figure font-semibold text-ink">
                ~{path.estimatedHours} {path.estimatedHours === 1 ? "hour" : "hours"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <dt className="field-label">Points</dt>
              <dd className="figure font-semibold text-ink">{formatNumber(totalPoints)} pts</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="sheet mt-5 overflow-hidden" aria-labelledby="path-rooms-title">
        <div className="border-b border-line px-5 pb-3.5 pt-4 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="path-rooms-title" className="text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
              Rooms in this path
            </h2>
            {total > 0 ? <span className="figure shrink-0 text-sm text-ink-3">{pathMinutes} min</span> : null}
          </div>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-2">Each room has a walkthrough, practice tasks, and a quiz. Work through them in order so each idea builds on the last.</p>
        </div>

        {rooms.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              title="No rooms published yet"
              message="The instructors haven't published a room in this path. Check back soon."
              action={
                <Link href="/learning-paths" className="text-link text-sm">
                  Browse other paths
                </Link>
              }
            />
          </div>
        ) : (
          // Daftar perhentian, sama dengan panel Continue di dasbor: centang violet untuk room lulus,
          // nomor putus-putus cyan untuk room berikutnya, nomor netral untuk sisanya, menit rata kanan.
          <ol className="divide-y divide-line">
            {rooms.map(({ room, availability, userProgress }, index) => {
              const isCompleted = userProgress?.status === "COMPLETED";
              const isNext = room.id === nextRoomId;
              const percentage = userProgress?.progressPercentage ?? 0;
              const isInProgress = !isCompleted && (userProgress?.status === "IN_PROGRESS" || percentage > 0);
              const serial = String(index + 1).padStart(2, "0");

              let stateTag: React.ReactNode = null;
              if (!availability.isOpen) {
                stateTag = (
                  <StateTag tone={availability.state === "upcoming" ? "amber" : availability.state === "draft" ? "muted" : "red"}>
                    {availability.state === "upcoming" && availability.opensAt
                      ? `Opens ${formatDayMonth(availability.opensAt)}`
                      : availability.state === "draft"
                        ? "Draft"
                        : "Closed"}
                  </StateTag>
                );
              } else if (availability.closesAt) {
                stateTag = <StateTag tone="amber">Closes {formatDayMonth(availability.closesAt)}</StateTag>;
              }

              const status = isCompleted
                ? `Passed · ${formatShortDate(userProgress?.completedAt ?? userProgress?.updatedAt ?? now)}`
                : isNext
                  ? "Up next"
                  : isInProgress
                    ? "In progress"
                    : "Not started";

              return (
                <li key={room.id}>
                  <Link
                    href={`/rooms/${room.slug}`}
                    aria-current={isNext ? "step" : undefined}
                    className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3.5 px-5 py-3.5 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:gap-x-4 sm:px-6"
                  >
                    <span
                      className={`figure grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? "border border-violet/45 bg-violet-soft text-violet"
                          : isNext
                            ? "border-[1.5px] border-dashed border-cyan-ink text-cyan-ink"
                            : "border border-line-strong text-ink-3"
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? (
                        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        serial
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="font-display font-semibold leading-snug text-ink transition-colors group-hover:text-cyan-ink">{room.title}</span>
                        {stateTag}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-3">
                        <span className={isNext ? "font-medium text-cyan-ink" : ""}>{status}</span>
                        {/* Tingkat room disembunyikan di ponsel agar baris meta muat satu baris; tingkat path ada di ringkasan. */}
                        <span className="hidden sm:inline">
                          <span aria-hidden="true"> · </span>
                          {room.difficulty}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="figure">{formatNumber(pointsByRoom.get(room.id) ?? 0)} pts</span>
                      </p>
                      {isInProgress ? (
                        <div className="mt-2 flex max-w-xs items-center gap-2.5">
                          <ProgressBar value={percentage} label={`${room.title} progress`} className="flex-1" />
                          <span className="figure text-xs font-semibold text-ink-2">{percentage}%</span>
                        </div>
                      ) : null}
                    </div>

                    <span className="figure text-sm text-ink-3">{room.estimatedMinutes} min</span>
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
