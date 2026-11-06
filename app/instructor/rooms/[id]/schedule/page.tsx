import type { Metadata } from "next";
import { SectionHeader } from "@/components/card";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { RoomStateMarks } from "@/components/instructor/publish-state";
import { RoomScheduleForm } from "@/components/instructor/room-schedule-form";
import { panelClass } from "@/components/instructor/form-styles";
import { toggleRoomPublishAction } from "@/lib/actions/content-actions";
import { describeAvailability, formatScheduleDate, getRoomAvailability, type RoomAvailability } from "@/lib/learning/availability";
import { loadRoomEditor } from "../editor-data";

export const metadata: Metadata = { title: "Room schedule" };
export const dynamic = "force-dynamic";

/** Kalimat ketersediaan; untuk draft, tampilkan jadwal yang sudah direncanakan (bila ada). */
function availabilityText(availability: RoomAvailability) {
  if (availability.state !== "draft") return describeAvailability(availability);
  if (!availability.isScheduled) return "No schedule set. Once published, the room is open with no end date.";
  const parts = [
    availability.opensAt ? `opens ${formatScheduleDate(availability.opensAt)}` : null,
    availability.closesAt ? `closes ${formatScheduleDate(availability.closesAt)}` : null
  ].filter(Boolean);
  return `Planned: ${parts.join(", ")}.`;
}

/** ready: siap; attention: perlu diisi sebelum terbit; optional: boleh kosong (quiz). Bentuk tanda berbeda, tidak hanya warna. */
type Readiness = "ready" | "attention" | "optional";

function ReadinessMark({ state }: { state: Readiness }) {
  if (state === "ready") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-green" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (state === "optional") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4.5 8h7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-amber" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" strokeDasharray="2.2 2.2" />
    </svg>
  );
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Materi siap bila minimal satu bab berisi; bab kosong disebut agar tidak terlewat sebelum terbit. */
function materialReadiness(chapters: { content: string }[]): { state: Readiness; detail: string } {
  const written = chapters.filter((chapter) => chapter.content.trim().length > 0).length;
  const empty = chapters.length - written;

  if (written === 0) return { state: "attention", detail: chapters.length === 0 ? "No chapters yet" : "Chapters are empty" };
  return {
    state: "ready",
    detail: empty > 0 ? `${plural(written, "chapter", "chapters")}, ${empty} empty` : plural(written, "chapter", "chapters")
  };
}

/**
 * Quiz opsional: tanpa quiz room selesai saat semua task benar. Quiz tanpa pertanyaan tetap perlu perhatian
 * karena tidak bisa diluluskan, sehingga room itu tidak pernah selesai.
 */
function quizReadiness(quiz: { questions: unknown[] } | null): { state: Readiness; detail: string } {
  if (!quiz) return { state: "optional", detail: "Optional, none" };
  if (quiz.questions.length === 0) return { state: "attention", detail: "No questions yet" };
  return { state: "ready", detail: plural(quiz.questions.length, "question", "questions") };
}

export default async function RoomSchedulePage({ params }: { params: { id: string } }) {
  const { room, canManage } = await loadRoomEditor(params.id);
  const availability = getRoomAvailability(room);
  const readiness: { label: string; state: Readiness; detail: string }[] = [
    { label: "Material", ...materialReadiness(room.chapters) },
    {
      label: "Tasks",
      state: room.tasks.length > 0 ? "ready" : "attention",
      detail: room.tasks.length > 0 ? plural(room.tasks.length, "task", "tasks") : "None yet"
    },
    { label: "Quiz", ...quizReadiness(room.quiz) }
  ];

  return (
    <section aria-labelledby="room-schedule-heading" className={panelClass}>
      <SectionHeader
        id="room-schedule-heading"
        title="Schedule & publishing"
        description="Members can open this room once it is published and inside its schedule."
      />
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div>
          <dt className="field-label">Status</dt>
          <dd className="mt-1.5 flex flex-wrap items-center gap-2">
            <RoomStateMarks isPublished={room.isPublished} availability={availability} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="field-label">Availability</dt>
          <dd className="mt-1.5 text-sm text-ink-2">{availabilityText(availability)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="field-label">Owner</dt>
          <dd className="mt-1.5 truncate text-sm text-ink">{room.createdBy ? `@${room.createdBy.username}` : "No owner"}</dd>
        </div>
      </dl>

      {/* Urutan kerja instruktur: atur jadwal, periksa isi, lalu terbitkan. */}
      <div className="mt-5 border-t border-line pt-5">
        <RoomScheduleForm
          roomId={room.id}
          availableFrom={room.availableFrom ? room.availableFrom.toISOString() : null}
          availableUntil={room.availableUntil ? room.availableUntil.toISOString() : null}
          disabled={!canManage}
        />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="text-base font-bold text-ink">Publishing</h3>
        <p className="field-label mt-3">Content checklist</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {readiness.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                <ReadinessMark state={item.state} />
              </span>
              <span className="min-w-0">
                <span className="font-semibold text-ink">{item.label}</span>{" "}
                <span className={item.state === "attention" ? "text-amber" : "text-ink-3"}>{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <PublishToggleForm action={toggleRoomPublishAction} idField="roomId" id={room.id} isPublished={room.isPublished} disabled={!canManage} showState={false} />
        </div>
        {room.isPublished ? null : <p className="mt-3 text-sm text-ink-3">Preview as member becomes available once the room is published.</p>}
      </div>
    </section>
  );
}
