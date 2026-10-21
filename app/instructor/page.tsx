import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatDayMonth, formatNumber, formatRelativeTime } from "@/lib/format/date";
import { getRoomAvailability, type RoomScheduleFields } from "@/lib/learning/availability";
import { getInstructorClasses, getStudentProgress } from "@/lib/services/instructor-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const dynamic = "force-dynamic";

const PROGRESS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed"
};

const headCell = "field-label border-b border-line px-3 py-2.5 text-left first:pl-5 last:pr-5";
const bodyCell = "px-3 py-2.5 first:pl-5 last:pr-5";

/** "Edited 3h ago", "Edited yesterday", "Edited 14 Oct 2026". */
function editedLabel(date: Date, now: Date) {
  const relative = formatRelativeTime(date, now);
  return `Edited ${relative === "Just now" || relative === "Yesterday" ? relative.toLowerCase() : relative}`;
}

/** Status terbit dan jadwal sebuah room: Draft tetap terlihat, room terjadwal/ditutup memakai stempel. */
function RoomStateMarks({ room, now }: { room: RoomScheduleFields; now: Date }) {
  if (!room.isPublished) return <StateTag tone="muted">Draft</StateTag>;

  const availability = getRoomAvailability(room, now);
  return (
    <>
      <StatusPill tone="success">Published</StatusPill>
      {availability.state === "upcoming" && availability.opensAt ? (
        <StateTag tone="amber">{`Opens ${formatDayMonth(availability.opensAt)}`}</StateTag>
      ) : null}
      {availability.state === "closed" ? <StateTag tone="red">Closed</StateTag> : null}
    </>
  );
}

export default async function InstructorPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const now = new Date();

  const [classes, progress, paths, recentRooms, roomCount, publishedRoomCount] = await Promise.all([
    getInstructorClasses(profile.id),
    getStudentProgress(profile.id),
    // Ringkasan konten (baca saja): semua path, room yang terakhir diubah, dan jumlah room.
    prisma.learningPath.findMany({
      select: { id: true, title: true, slug: true, logoUrl: true, isPublished: true, updatedAt: true, _count: { select: { rooms: true } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.room.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        availableFrom: true,
        availableUntil: true,
        updatedAt: true,
        logoUrl: true,
        learningPath: { select: { title: true, slug: true } },
        _count: { select: { tasks: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    prisma.room.count(),
    prisma.room.count({ where: { isPublished: true } })
  ]);

  const activeMembersCount = new Set(progress.map((row) => row.userId)).size;
  const avgCompletion = progress.length > 0 ? Math.round(progress.reduce((acc, row) => acc + row.progressPercentage, 0) / progress.length) : 0;
  const completedRows = progress.filter((row) => row.status === "COMPLETED").length;
  const publishedPathCount = paths.filter((path) => path.isPublished).length;

  return (
    <AppShell
      title="Teaching overview"
      subtitle="Learning content on the platform, and how members in your classes are progressing."
      role={profile.role}
      actions={
        <>
          <Link href="/instructor/paths" className="btn-secondary">
            Path manager
          </Link>
          <Link href="/instructor/rooms/new" className="btn-primary">
            New room
          </Link>
        </>
      }
    >
      <section className="sheet overflow-hidden" aria-label="Teaching numbers">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <Figure
            className="border-b border-r border-line-soft p-4 sm:border-b-0"
            label="Learning paths"
            value={formatNumber(paths.length)}
            note={`${formatNumber(publishedPathCount)} published`}
          />
          <Figure
            className="border-b border-line-soft p-4 sm:border-b-0 sm:border-r"
            label="Rooms"
            value={formatNumber(roomCount)}
            note={`${formatNumber(publishedRoomCount)} published`}
          />
          <Figure
            className="border-r border-line-soft p-4"
            label="Active members"
            value={formatNumber(activeMembersCount)}
            note={`In ${classes.length} ${classes.length === 1 ? "class" : "classes"}`}
          />
          <Figure
            className="p-4"
            label="Rooms completed"
            value={formatNumber(completedRows)}
            note={progress.length > 0 ? `Average room progress ${avgCompletion}%` : "No member activity yet"}
          />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="sheet p-5 sm:p-6" aria-labelledby="recent-rooms-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="recent-rooms-title" className="text-lg font-bold text-ink">
              Recently edited rooms
            </h2>
            <Link href="/instructor/rooms" className="text-link text-sm">
              All rooms
            </Link>
          </div>
          {recentRooms.length > 0 ? (
            <ul className="-mx-2 divide-y divide-line-soft">
              {recentRooms.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/instructor/rooms/${room.id}`}
                    className="group flex items-center gap-3.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-well"
                  >
                    <EntityLogo name={room.title} src={room.logoUrl} size="sm" className="!h-10 !w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                        {room.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-3">
                        {room.learningPath.title} · {room._count.tasks} {room._count.tasks === 1 ? "task" : "tasks"} ·{" "}
                        {editedLabel(room.updatedAt, now)}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                        <RoomStateMarks room={room} now={now} />
                      </span>
                    </span>
                    <span className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
                      <RoomStateMarks room={room} now={now} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No rooms yet" message="Create the first room with New room. It stays a draft until you publish it." />
          )}
        </section>

        <section className="sheet p-5" aria-labelledby="paths-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="paths-title" className="text-lg font-bold text-ink">
              Learning paths
            </h2>
            <Link href="/instructor/paths" className="text-link text-sm">
              All paths
            </Link>
          </div>
          {paths.length > 0 ? (
            <ul className="-mx-2 space-y-0.5">
              {paths.slice(0, 6).map((path) => (
                <li key={path.id}>
                  <Link href={`/instructor/paths/${path.id}`} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-well">
                    <EntityLogo name={path.title} src={path.logoUrl} size="sm" className="!h-10 !w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                        {path.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-3">
                        {path._count.rooms} {path._count.rooms === 1 ? "room" : "rooms"}
                      </span>
                    </span>
                    {path.isPublished ? <StatusPill tone="success">Published</StatusPill> : <StateTag tone="muted">Draft</StateTag>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No learning paths yet" message="Create one in the path manager, then add rooms to it." />
          )}
          {paths.length > 6 ? <p className="mt-3 text-sm text-ink-3">Showing the 6 most recently edited of {paths.length} paths.</p> : null}
        </section>
      </div>

      <section className="sheet mt-5 overflow-hidden" aria-labelledby="member-progress-title">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SectionHeader
            id="member-progress-title"
            title="Recent member progress"
            description="Latest room activity from members of your classes."
            action={
              <Link href="/instructor/students" className="text-link text-sm">
                All members
              </Link>
            }
          />
        </div>
        {progress.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <EmptyState
              title="No member activity yet"
              message={
                classes.length === 0
                  ? "You aren't assigned to a class yet, so no members are tracked here."
                  : "Members of your classes show up here once they open a room."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr>
                  <th className={headCell}>Member</th>
                  <th className={headCell}>Room</th>
                  <th className={headCell}>Progress</th>
                  <th className={headCell}>Status</th>
                  <th className={`${headCell} text-right`}>Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {progress.slice(0, 8).map((row) => (
                  <tr key={row.id} className="hover:bg-well">
                    <td className={bodyCell}>
                      <p className="font-semibold text-ink">{row.user.fullName}</p>
                      <p className="text-xs text-ink-3">@{row.user.username}</p>
                    </td>
                    <td className={`${bodyCell} text-ink-2`}>{row.room.title}</td>
                    <td className={bodyCell}>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={row.progressPercentage} label={`${row.user.fullName}: ${row.room.title} progress`} className="w-28" />
                        <span className="figure w-10 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className={bodyCell}>
                      <StatusPill tone={row.status === "COMPLETED" ? "done" : "neutral"}>{PROGRESS_LABEL[row.status] ?? row.status}</StatusPill>
                    </td>
                    <td className={`${bodyCell} whitespace-nowrap text-right text-ink-3`}>{formatRelativeTime(row.updatedAt, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
