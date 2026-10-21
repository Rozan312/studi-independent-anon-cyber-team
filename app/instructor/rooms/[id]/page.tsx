import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SectionHeader, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { MaterialEditor } from "@/components/instructor/material-editor";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { QuizEditor } from "@/components/instructor/quiz-editor";
import { RoomMetadataForm } from "@/components/instructor/room-metadata-form";
import { TaskEditor } from "@/components/instructor/task-editor";
import { panelClass } from "@/components/instructor/form-styles";
import { PageNotice } from "@/components/ui/page-notice";
import { toggleRoomPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { formatDayMonth } from "@/lib/format/date";
import { getRoomForEditor, listLearningPathsForManagement } from "@/lib/services/content-service";
import { roomMaterialToEditorHtml } from "@/lib/content/rich-text";
import { describeAvailability, formatScheduleDate, getRoomAvailability, type RoomAvailability } from "@/lib/learning/availability";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

const sections = [
  ["#details", "Details"],
  ["#schedule", "Schedule & publishing"],
  ["#material", "Material"],
  ["#tasks", "Tasks"],
  ["#quiz", "Quiz"]
] as const;

// Jarak gulir anchor: di xl ada bilah navigasi seksi yang menempel di atas.
const sectionClass = `${panelClass} scroll-mt-6 xl:scroll-mt-16`;

/** Status terbit + stempel jadwal (terjadwal/ditutup) agar status room tidak pernah hilang dari pandangan. */
function RoomStateMarks({ isPublished, availability }: { isPublished: boolean; availability: RoomAvailability }) {
  if (!isPublished) return <StateTag tone="muted">Draft</StateTag>;
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

function ReadinessMark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-green" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-amber" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" strokeDasharray="2.2 2.2" />
    </svg>
  );
}

export default async function InstructorRoomEditorPage({
  params,
  searchParams = {}
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireRole(["INSTRUCTOR"]);
  if (!UUID_PATTERN.test(params.id)) notFound();

  const [result, paths] = await Promise.all([getRoomForEditor(profile, params.id), listLearningPathsForManagement()]);
  if (!result) notFound();

  const { room, canManage } = result;
  const justCreated = searchParams.created === "1";
  const availability = getRoomAvailability(room);
  const questionCount = room.quiz?.questions.length ?? 0;
  const readiness = [
    { label: "Material", ok: room.content.trim().length > 0, detail: room.content.trim().length > 0 ? "Written" : "Empty" },
    {
      label: "Tasks",
      ok: room.tasks.length > 0,
      detail: room.tasks.length > 0 ? `${room.tasks.length} ${room.tasks.length === 1 ? "task" : "tasks"}` : "None yet"
    },
    {
      label: "Quiz",
      ok: questionCount > 0,
      detail: questionCount > 0 ? `${questionCount} ${questionCount === 1 ? "question" : "questions"}` : "No questions yet"
    }
  ];

  return (
    <AppShell
      title={room.title}
      subtitle={
        <>
          Room in{" "}
          <Link href={`/instructor/paths/${room.learningPath.id}`} className="text-link">
            {room.learningPath.title}
          </Link>{" "}
          · <span className="font-mono text-sm">/rooms/{room.slug}</span>
        </>
      }
      role={profile.role}
      actions={
        <>
          <Link href="/instructor/rooms" className="btn-secondary">
            All rooms
          </Link>
          {room.isPublished ? (
            <Link href={`/rooms/${room.slug}`} className="btn-secondary">
              Preview as member
            </Link>
          ) : null}
        </>
      }
    >
      {justCreated ? (
        <PageNotice
          tone="success"
          title="Room created"
          message="Add the walkthrough material, tasks, and quiz below. Publish the room when everything is ready for members."
          className="mb-5"
        />
      ) : null}
      {!canManage ? (
        <PageNotice
          tone="warning"
          title="Read-only"
          message={`This room belongs to ${room.createdBy?.username ?? "another instructor"}. Only its owner or an admin can change it.`}
          className="mb-5"
        />
      ) : null}

      {/* Navigasi seksi: baris biasa di layar kecil, menempel di atas pada xl. Lebar seksi Material tidak berubah. */}
      <nav
        aria-label="Room editor sections"
        className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-2.5 xl:sticky xl:top-0 xl:z-10 xl:-mt-2 xl:bg-paper xl:pt-3"
      >
        {sections.map(([href, label]) => (
          <a key={href} href={href} className="text-sm font-medium text-ink-2 transition-colors hover:text-ink">
            {label}
          </a>
        ))}
        <span className="ml-auto hidden items-center gap-2 xl:flex">
          <RoomStateMarks isPublished={room.isPublished} availability={availability} />
        </span>
      </nav>

      <div className="space-y-5">
        <section id="details" className={sectionClass} aria-label="Details">
          <SectionHeader title="Details" description="Title, URL, learning path, level, points, cover image, and the open and close dates." />
          <RoomMetadataForm
            disabled={!canManage}
            paths={paths.map((path) => ({ id: path.id, title: path.title, isPublished: path.isPublished }))}
            room={{
              id: room.id,
              learningPathId: room.learningPathId,
              title: room.title,
              slug: room.slug,
              description: room.description,
              category: room.category,
              difficulty: room.difficulty,
              estimatedMinutes: room.estimatedMinutes,
              points: room.points,
              orderIndex: room.orderIndex,
              coverImageUrl: room.coverImageUrl,
              logoUrl: room.logoUrl,
              availableFrom: room.availableFrom ? room.availableFrom.toISOString() : null,
              availableUntil: room.availableUntil ? room.availableUntil.toISOString() : null
            }}
          />
        </section>

        <section id="schedule" className={sectionClass} aria-label="Schedule & publishing">
          <SectionHeader
            title="Schedule & publishing"
            description="Members can open this room once it is published and inside its schedule. Change the open and close dates under Details."
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
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
            <div className="lg:justify-self-end">
              <PublishToggleForm action={toggleRoomPublishAction} idField="roomId" id={room.id} isPublished={room.isPublished} disabled={!canManage} compact showState={false} />
            </div>
          </div>

          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="field-label">Content checklist</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {readiness.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  <ReadinessMark ok={item.ok} />
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className={item.ok ? "text-ink-3" : "text-amber"}>{item.detail}</span>
                </li>
              ))}
            </ul>
            {room.isPublished ? null : <p className="mt-3 text-sm text-ink-3">Preview as member becomes available once the room is published.</p>}
          </div>
        </section>

        <section id="material" className={sectionClass} aria-label="Material">
          <SectionHeader
            title="Material"
            description="The walkthrough members read on the room page before the tasks, with the same formatting and column width as this editor. Format text from the toolbar as in a word processor: font and size, colour, highlight, alignment, lists, tables, links, and images."
          />
          <MaterialEditor
            roomId={room.id}
            initialHtml={roomMaterialToEditorHtml(room.content, room.contentFormat)}
            legacyMarkdown={room.contentFormat === "MARKDOWN" && room.content.trim().length > 0}
            disabled={!canManage}
          />
        </section>

        <section id="tasks" className={sectionClass} aria-label="Tasks">
          <SectionHeader
            title={`Tasks (${room.tasks.length})`}
            description="A correct answer awards the task's points and moves the member's room progress forward. Members solve tasks in this order: each task opens once the one before it is solved."
          />
          <TaskEditor
            roomId={room.id}
            disabled={!canManage}
            tasks={room.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              expectedAnswer: task.expectedAnswer,
              acceptedAnswers: task.acceptedAnswers,
              hint: task.hint,
              points: task.points,
              orderIndex: task.orderIndex
            }))}
          />
        </section>

        <section id="quiz" className={sectionClass} aria-label="Quiz">
          <SectionHeader
            title="Quiz"
            description={`One quiz per room. Passing it the first time adds the room's ${room.points} ${room.points === 1 ? "point" : "points"}. The room is complete once every task is solved and the quiz is passed. Every attempt's score is recorded on the member's profile.`}
          />
          <QuizEditor
            roomId={room.id}
            disabled={!canManage}
            quiz={
              room.quiz
                ? {
                    id: room.quiz.id,
                    title: room.quiz.title,
                    description: room.quiz.description,
                    passingScore: room.quiz.passingScore,
                    attemptsCount: room.quiz._count.attempts,
                    questions: room.quiz.questions.map((question) => ({
                      id: question.id,
                      question: question.question,
                      explanation: question.explanation,
                      orderIndex: question.orderIndex,
                      options: question.options.map((option) => ({ id: option.id, label: option.label, isCorrect: option.isCorrect }))
                    }))
                  }
                : null
            }
          />
        </section>
      </div>
    </AppShell>
  );
}
