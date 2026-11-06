import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { listPublishedRooms } from "@/lib/services/room-service";
import { getRoomAvailability } from "@/lib/learning/availability";
import { formatDayMonth, formatNumber } from "@/lib/format/date";
import { earnablePoints } from "@/lib/learning/points";
import { EntityLogo } from "@/components/paper/entity-logo";

export const metadata: Metadata = { title: "Rooms" };
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const profile = await requireRole(["STUDENT"]);
  const [publishedRooms, progressRows, roomPointRows] = await Promise.all([
    listPublishedRooms(),
    // Status belajar anggota per room untuk label Passed / progres / Not started.
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      select: { roomId: true, status: true, progressPercentage: true }
    }),
    prisma.room.findMany({
      where: { isPublished: true, learningPath: { isPublished: true } },
      select: { id: true, points: true, quiz: { select: { id: true } }, tasks: { select: { points: true } } }
    })
  ]);

  // Himpunan yang sama dengan dasbor, Progress, dan Learning paths: room terbit di path yang terbit.
  // Room di path draft tidak bisa dibuka lewat path-nya (404), jadi tidak ikut dihitung maupun didaftar.
  const rooms = publishedRooms.filter((room) => room.learningPath.isPublished);
  const progressByRoom = new Map(progressRows.map((row) => [row.roomId, row]));
  const pointsByRoom = new Map(roomPointRows.map((room) => [room.id, earnablePoints(room).total]));

  // Room sudah diurutkan per kategori; kelompokkan berurutan tanpa mengubah urutannya.
  const groups: { category: string; rooms: typeof rooms }[] = [];
  for (const room of rooms) {
    const last = groups[groups.length - 1];
    if (last && last.category === room.category) last.rooms.push(room);
    else groups.push({ category: room.category, rooms: [room] });
  }

  const subtitle =
    rooms.length > 0
      ? `${rooms.length} published ${rooms.length === 1 ? "room" : "rooms"} in ${groups.length} ${groups.length === 1 ? "category" : "categories"}. Open one to read the material, answer its tasks, and take the quiz.`
      : "Rooms appear here once instructors publish them.";

  return (
    <AppShell title="Rooms" subtitle={subtitle} role={profile.role}>
      {groups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group, groupIndex) => (
            <section key={group.category} className="sheet overflow-hidden" aria-labelledby={`room-category-${groupIndex}`}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 pb-3 pt-4 sm:px-6">
                <h2 id={`room-category-${groupIndex}`} className="text-base font-bold leading-snug text-ink">
                  {group.category}
                </h2>
                <span className="figure shrink-0 text-xs text-ink-3">
                  {group.rooms.length} {group.rooms.length === 1 ? "room" : "rooms"}
                </span>
              </div>

              {/* Baris rata selebar panel: sorotan bg-well sampai ke tepi, judul berubah cyan. */}
              <ul className="divide-y divide-line">
                {group.rooms.map((room) => {
                  const availability = getRoomAvailability(room);
                  const progress = progressByRoom.get(room.id);
                  const percentage = progress?.progressPercentage ?? 0;

                  let stateTag: React.ReactNode = null;
                  if (availability.state === "upcoming" && availability.opensAt) {
                    stateTag = <StateTag tone="amber">Opens {formatDayMonth(availability.opensAt)}</StateTag>;
                  } else if (availability.state === "closed") {
                    stateTag = <StateTag tone="red">Closed</StateTag>;
                  } else if (availability.state === "open" && availability.closesAt) {
                    stateTag = <StateTag tone="amber">Closes {formatDayMonth(availability.closesAt)}</StateTag>;
                  }

                  return (
                    <li key={room.id}>
                      <Link
                        href={`/rooms/${room.slug}`}
                        className="group flex gap-4 px-5 py-4 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:items-center sm:px-6"
                      >
                        <EntityLogo name={room.title} src={room.logoUrl} size="lg" />

                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center sm:gap-8">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="font-display font-semibold leading-snug text-ink transition-colors group-hover:text-cyan-ink">{room.title}</span>
                              {stateTag}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-ink-2">{room.learningPath.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-3">
                              <span>{room.difficulty}</span>
                              <span aria-hidden="true">·</span>
                              <span className="figure">{room.estimatedMinutes} min</span>
                              <span aria-hidden="true">·</span>
                              <span className="figure">{formatNumber(pointsByRoom.get(room.id) ?? 0)} pts</span>
                              <span aria-hidden="true">·</span>
                              <span className="figure">
                                {room._count.tasks} {room._count.tasks === 1 ? "task" : "tasks"}
                              </span>
                            </p>
                          </div>

                          {/* Status: centang violet untuk room lulus, bilah cyan untuk room yang sedang dikerjakan. */}
                          <div className="min-w-0">
                            {progress?.status === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-violet">
                                <span className="grid h-6 w-6 place-items-center rounded-full border border-violet/45 bg-violet-soft" aria-hidden="true">
                                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                                Passed
                              </span>
                            ) : progress && progress.status !== "NOT_STARTED" ? (
                              <div>
                                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                                  <span className="text-ink-2">In progress</span>
                                  <span className="figure font-semibold text-ink-2">{percentage}%</span>
                                </div>
                                <ProgressBar value={percentage} label={`${room.title} progress`} />
                              </div>
                            ) : (
                              <p className="text-sm text-ink-3">Not started</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No rooms are published yet"
          message="Published rooms will be listed here by category."
          action={
            <Link href="/learning-paths" className="btn-secondary">
              Browse learning paths
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
