import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { toggleRoomPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { formatDayMonth, formatNumber } from "@/lib/format/date";
import { canManageContent, listRoomsForManagement } from "@/lib/services/content-service";
import { describeAvailability, getRoomAvailability, type RoomAvailability } from "@/lib/learning/availability";

export const dynamic = "force-dynamic";

const headCell = "field-label whitespace-nowrap border-b border-line px-3 py-2.5 text-left first:pl-5 last:pr-5";
const bodyCell = "px-3 py-2.5 align-top first:pl-5 last:pr-5";

/**
 * Jadwal room. Room terbit yang terjadwal/ditutup memakai label status; draft hanya menampilkan tanggal
 * rencananya sebagai teks karena belum terlihat oleh member.
 */
function ScheduleCell({ isPublished, availability }: { isPublished: boolean; availability: RoomAvailability }) {
  const { state, opensAt, closesAt } = availability;

  if (!isPublished) {
    if (opensAt) return <span className="text-ink-3">Opens {formatDayMonth(opensAt)}</span>;
    if (closesAt) return <span className="text-ink-3">Until {formatDayMonth(closesAt)}</span>;
    return <span className="text-ink-3">No schedule</span>;
  }
  if (state === "upcoming" && opensAt) return <StateTag tone="amber">{`Opens ${formatDayMonth(opensAt)}`}</StateTag>;
  if (state === "closed") return <StateTag tone="red">Closed</StateTag>;
  if (closesAt) return <span className="text-ink-2">Until {formatDayMonth(closesAt)}</span>;
  return <span className="text-ink-3">Always open</span>;
}

export default async function InstructorRoomsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const rooms = await listRoomsForManagement();
  const publishedCount = rooms.filter((room) => room.isPublished).length;

  return (
    <AppShell
      title="Room manager"
      subtitle="Create rooms, write their material, tasks, and quiz, then publish them for members."
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
      <section className="sheet overflow-hidden" aria-labelledby="rooms-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <h2 id="rooms-title" className="text-lg font-bold text-ink">
            All rooms
          </h2>
          {rooms.length > 0 ? (
            <p className="text-sm text-ink-3">
              {formatNumber(rooms.length)} {rooms.length === 1 ? "room" : "rooms"} · {formatNumber(publishedCount)} published
            </p>
          ) : null}
        </div>

        {rooms.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <EmptyState title="No rooms yet" message="Create the first room with New room. It stays a draft until you publish it." />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr>
                  <th className={headCell}>Room</th>
                  <th className={headCell}>Path</th>
                  <th className={headCell}>Status</th>
                  <th className={headCell}>Schedule</th>
                  <th className={`${headCell} text-right`}>Tasks</th>
                  <th className={`${headCell} text-right`}>Quiz</th>
                  <th className={`${headCell} text-right`}>Points</th>
                  <th className={`${headCell} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {rooms.map((room) => {
                  const manageable = canManageContent(profile, room.createdById);
                  const hasContent = room.content.trim().length > 0;
                  const questionCount = room.quiz?._count.questions ?? 0;
                  const availability = getRoomAvailability(room);

                  return (
                    <tr key={room.id} className="hover:bg-well">
                      <td className={`${bodyCell} max-w-[18rem]`}>
                        <Link
                          href={`/instructor/rooms/${room.id}`}
                          className="font-semibold text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
                        >
                          {room.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-3">
                          {room.category} · {room.createdBy ? `@${room.createdBy.username}` : "No owner"}
                          {hasContent ? null : <span className="text-amber"> · No material yet</span>}
                        </p>
                      </td>
                      <td className={`${bodyCell} max-w-[14rem]`}>
                        <p className="text-ink-2">{room.learningPath.title}</p>
                        {room.learningPath.isPublished ? null : <p className="mt-0.5 text-xs text-ink-3">Path is a draft</p>}
                      </td>
                      <td className={bodyCell}>
                        {room.isPublished ? <StatusPill tone="success">Published</StatusPill> : <StateTag tone="muted">Draft</StateTag>}
                      </td>
                      <td className={`${bodyCell} whitespace-nowrap`} title={room.isPublished ? describeAvailability(availability) : undefined}>
                        <ScheduleCell isPublished={room.isPublished} availability={availability} />
                      </td>
                      <td className={`${bodyCell} figure text-right ${room._count.tasks > 0 ? "text-ink" : "text-amber"}`}>{room._count.tasks}</td>
                      <td className={`${bodyCell} figure whitespace-nowrap text-right ${questionCount > 0 ? "text-ink" : "text-amber"}`}>
                        {questionCount} {questionCount === 1 ? "question" : "questions"}
                      </td>
                      <td className={`${bodyCell} figure text-right font-semibold text-ink`}>{formatNumber(room.points)}</td>
                      <td className={bodyCell}>
                        <div className="flex items-start justify-end gap-2">
                          <PublishToggleForm
                            action={toggleRoomPublishAction}
                            idField="roomId"
                            id={room.id}
                            isPublished={room.isPublished}
                            disabled={!manageable}
                            compact
                            showState={false}
                          />
                          <Link href={`/instructor/rooms/${room.id}`} className="btn-secondary btn-sm">
                            {manageable ? "Edit" : "View"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
