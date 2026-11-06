import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusPill } from "@/components/card";
import { PublishPill, RoomStateMarks } from "@/components/instructor/publish-state";
import {
  bodyCellClass,
  headCellClass,
  listPanelClass,
  panelHeadClass,
  panelMetaClass,
  panelTitleClass,
  rowLinkClass,
  rowTitleClass,
  tableRowClass
} from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime } from "@/lib/format/date";
import { getRoomAvailability } from "@/lib/learning/availability";
import { getInstructorClasses, getStudentProgress } from "@/lib/services/instructor-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const metadata: Metadata = { title: "Teaching overview" };
export const dynamic = "force-dynamic";

const PROGRESS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed"
};

/** "Edited 3h ago", "Edited yesterday", "Edited 14 Oct 2026". */
function editedLabel(date: Date, now: Date) {
  const relative = formatRelativeTime(date, now);
  return `Edited ${relative === "Just now" || relative === "Yesterday" ? relative.toLowerCase() : relative}`;
}

export default async function InstructorPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const now = new Date();

  const [classes, progress, paths, recentRooms, roomCount, publishedRoomCount] = await Promise.all([
    getInstructorClasses(profile.id),
    getStudentProgress(profile.id),
    // Ringkasan konten: semua path, room yang terakhir diubah, dan jumlah room.
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

  // Jumlah baris genap agar dua kolom ringkasan sama panjang.
  const summaryRows: { label: string; value: string; note?: string; muted?: boolean }[] = [
    { label: "Learning paths", value: formatNumber(paths.length), note: `${formatNumber(publishedPathCount)} published` },
    { label: "Rooms", value: formatNumber(roomCount), note: `${formatNumber(publishedRoomCount)} published` },
    { label: "Your classes", value: formatNumber(classes.length) },
    { label: "Active members", value: formatNumber(activeMembersCount) },
    { label: "Rooms completed", value: formatNumber(completedRows) },
    progress.length > 0
      ? { label: "Average room progress", value: `${avgCompletion}%` }
      : { label: "Average room progress", value: "None yet", muted: true }
  ];

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
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/*
            Ringkasan bergaris (label kiri, nilai kanan) dalam dua kolom; strip angka besar hanya ada di dasbor member.
            -mt-px menyembunyikan garis atas baris pertama tiap kolom di balik tepi panel (panel memotong luapan).
          */}
          <section className="sheet overflow-hidden px-5 sm:px-6" aria-label="Teaching numbers">
            <dl className="-mt-px grid text-sm md:grid-cols-2 md:gap-x-10">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
                  <dt className="shrink-0 text-ink-2">{row.label}</dt>
                  <dd className="min-w-0 text-right">
                    <span className={`figure font-semibold ${row.muted ? "text-ink-3" : "text-ink"}`}>{row.value}</span>
                    {row.note ? <span className="text-ink-3"> · {row.note}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={listPanelClass} aria-labelledby="recent-rooms-title">
            <div className={panelHeadClass}>
              <h2 id="recent-rooms-title" className={panelTitleClass}>
                Recently edited rooms
              </h2>
              <Link href="/instructor/rooms" className="text-link text-sm">
                All rooms
              </Link>
            </div>
            {recentRooms.length > 0 ? (
              <ul className="divide-y divide-line">
                {recentRooms.map((room) => {
                  const availability = getRoomAvailability(room, now);
                  return (
                    <li key={room.id}>
                      <Link href={`/instructor/rooms/${room.id}`} className={rowLinkClass}>
                        <EntityLogo name={room.title} src={room.logoUrl} size="sm" className="!h-10 !w-10" />
                        <span className="min-w-0 flex-1">
                          <span className={rowTitleClass}>{room.title}</span>
                          <span className="mt-0.5 block truncate text-sm text-ink-3">
                            {room.learningPath.title} · {room._count.tasks} {room._count.tasks === 1 ? "task" : "tasks"} · {editedLabel(room.updatedAt, now)}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                            <RoomStateMarks isPublished={room.isPublished} availability={availability} />
                          </span>
                        </span>
                        <span className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
                          <RoomStateMarks isPublished={room.isPublished} availability={availability} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-5 sm:p-6">
                <EmptyState title="No rooms yet" message="Create the first room with New room. It stays a draft until you publish it." />
              </div>
            )}
          </section>
        </div>

        <section className={listPanelClass} aria-labelledby="paths-title">
          <div className={panelHeadClass}>
            <h2 id="paths-title" className={panelTitleClass}>
              Learning paths
            </h2>
            <Link href="/instructor/paths" className="text-link text-sm">
              All paths
            </Link>
          </div>
          {paths.length > 0 ? (
            <ul className="divide-y divide-line">
              {paths.slice(0, 6).map((path) => (
                <li key={path.id}>
                  <Link href={`/instructor/paths/${path.id}`} className={rowLinkClass}>
                    <EntityLogo name={path.title} src={path.logoUrl} size="sm" className="!h-10 !w-10" />
                    {/* Kolom samping sempit: status di baris keterangan agar judul path tidak terpotong oleh pill. */}
                    <span className="min-w-0 flex-1">
                      <span className={rowTitleClass}>{path.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
                        <PublishPill published={path.isPublished} />
                        <span>
                          {path._count.rooms} {path._count.rooms === 1 ? "room" : "rooms"}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState title="No learning paths yet" message="Create one in the path manager, then add rooms to it." />
            </div>
          )}
          {paths.length > 6 ? (
            <p className={`border-t border-line px-5 py-3 ${panelMetaClass}`}>Showing the 6 most recently edited of {paths.length} paths.</p>
          ) : null}
        </section>
      </div>

      <section className={`${listPanelClass} mt-5`} aria-labelledby="member-progress-title">
        <div className={panelHeadClass}>
          <div className="min-w-0">
            <h2 id="member-progress-title" className={panelTitleClass}>
              Recent member progress
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">Latest room activity from members of your classes.</p>
          </div>
          <Link href="/instructor/students" className="text-link text-sm">
            All members
          </Link>
        </div>
        {progress.length === 0 ? (
          <div className="p-5 sm:p-6">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Member
                  </th>
                  <th scope="col" className={headCellClass}>
                    Room
                  </th>
                  <th scope="col" className={headCellClass}>
                    Progress
                  </th>
                  <th scope="col" className={headCellClass}>
                    Status
                  </th>
                  <th scope="col" className={`${headCellClass} text-right`}>
                    Last activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {progress.slice(0, 8).map((row) => (
                  <tr key={row.id} className={tableRowClass}>
                    <td className={bodyCellClass}>
                      <p className="font-display font-semibold text-ink">{row.user.fullName}</p>
                      <p className="text-xs text-ink-3">@{row.user.username}</p>
                    </td>
                    <td className={`${bodyCellClass} text-ink-2`}>{row.room.title}</td>
                    <td className={bodyCellClass}>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={row.progressPercentage} label={`${row.user.fullName}: ${row.room.title} progress`} className="w-28" />
                        <span className="figure w-10 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className={bodyCellClass}>
                      <StatusPill tone={row.status === "COMPLETED" ? "done" : "neutral"}>{PROGRESS_LABEL[row.status] ?? row.status}</StatusPill>
                    </td>
                    <td className={`${bodyCellClass} whitespace-nowrap text-right text-ink-3`}>{formatRelativeTime(row.updatedAt, now)}</td>
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
