import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EntityLogo } from "@/components/paper/entity-logo";
import { AvailabilityTag } from "@/components/rooms/availability-tag";
import { PageNotice } from "@/components/ui/page-notice";
import { formatScheduleDate, type RoomAvailability } from "@/lib/learning/availability";
import { formatNumber } from "@/lib/format/date";

type ScheduledRoom = {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  logoUrl: string | null;
  tasks: unknown[];
  quiz: unknown | null;
  learningPath: { slug: string; title: string };
};

/**
 * Halaman room untuk member saat room belum dibuka atau sudah ditutup: hanya ringkasan dan jadwal,
 * tanpa materi, task, atau quiz. Dipakai tab Material dan Tasks.
 */
export function RoomScheduleView({
  room,
  availability,
  totalPoints,
  role
}: {
  room: ScheduledRoom;
  availability: RoomAvailability;
  totalPoints: number;
  role: string;
}) {
  const isUpcoming = availability.state === "upcoming";

  return (
    <AppShell title={room.title} subtitle={room.description} role={role}>
      <PageNotice
        tone={isUpcoming ? "info" : "warning"}
        title={isUpcoming ? "This room isn't open yet" : "This room is closed"}
        message={
          isUpcoming
            ? `It opens on ${formatScheduleDate(availability.opensAt as Date)}. The material, tasks, and quiz become available then.`
            : `It closed on ${formatScheduleDate(availability.closesAt as Date)}. New answers aren't accepted, but the progress you recorded is kept.`
        }
        className="mb-6"
      />

      <section className="sheet overflow-hidden" aria-labelledby="room-schedule-title">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <EntityLogo name={room.title} src={room.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 id="room-schedule-title" className="text-lg font-bold text-ink">
                Schedule
              </h2>
              <AvailabilityTag availability={availability} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-2">
              <span>{room.learningPath.title}</span>
              <span aria-hidden="true">·</span>
              <span>{room.category}</span>
              <span aria-hidden="true">·</span>
              <span>{room.difficulty}</span>
            </p>
          </div>
        </div>

        {/* Tiga fakta jadwal dalam satu strip bersambungan tipis, seperti strip angka di dashboard. */}
        <dl className="grid gap-px border-y border-line bg-line sm:grid-cols-3">
          <div className="bg-sheet px-5 py-4 sm:px-6">
            <dt className="field-label">Opens</dt>
            <dd className="mt-1.5 font-display font-semibold text-ink">{availability.opensAt ? formatScheduleDate(availability.opensAt) : "When published"}</dd>
          </div>
          <div className="bg-sheet px-5 py-4 sm:px-6">
            <dt className="field-label">Closes</dt>
            <dd className="mt-1.5 font-display font-semibold text-ink">{availability.closesAt ? formatScheduleDate(availability.closesAt) : "No end date"}</dd>
          </div>
          <div className="bg-sheet px-5 py-4 sm:px-6">
            <dt className="field-label">In this room</dt>
            <dd className="figure mt-1.5 font-semibold text-ink">
              {room.tasks.length} {room.tasks.length === 1 ? "task" : "tasks"}
              {room.quiz ? " · 1 quiz" : ""} · {formatNumber(totalPoints)} pts
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3 p-5 sm:p-6">
          <Link href={`/learning-paths/${room.learningPath.slug}`} className="btn-primary">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to learning path
          </Link>
          <Link href="/rooms" className="btn-secondary">
            Browse other rooms
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
