import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { MaterialEditor } from "@/components/instructor/material-editor";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { QuizEditor } from "@/components/instructor/quiz-editor";
import { RoomMetadataForm } from "@/components/instructor/room-metadata-form";
import { TaskEditor } from "@/components/instructor/task-editor";
import { panelClass } from "@/components/instructor/form-styles";
import { PageNotice } from "@/components/ui/page-notice";
import { toggleRoomPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { getRoomForEditor, listLearningPathsForManagement } from "@/lib/services/content-service";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

const sections = [
  ["#info", "Informasi"],
  ["#materi", "Materi"],
  ["#tasks", "Tasks"],
  ["#quiz", "Quiz"]
] as const;

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
  const readiness = [
    { label: "Materi", ok: room.content.trim().length > 0 },
    { label: "Task", ok: room.tasks.length > 0 },
    { label: "Quiz", ok: Boolean(room.quiz && room.quiz.questions.length > 0) }
  ];

  return (
    <AppShell title={room.title} subtitle={`Editor room · /rooms/${room.slug} · path ${room.learningPath.title}`} role={profile.role}>
      {justCreated ? (
        <PageNotice
          tone="success"
          title="Room dibuat"
          message="Lengkapi materi walkthrough, task, dan quiz di bawah. Publish saat semuanya siap dibuka student."
          className="mb-6"
        />
      ) : null}
      {!canManage ? (
        <PageNotice
          tone="warning"
          title="Mode baca saja"
          message={`Room ini dibuat oleh ${room.createdBy?.username ?? "instruktur lain"}. Hanya pembuatnya atau admin yang dapat mengubahnya.`}
          className="mb-6"
        />
      ) : null}

      {/* Header status bar */}
      <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={room.isPublished ? "success" : "neutral"}>{room.isPublished ? "Published" : "Draft"}</StatusPill>
          {room.isPublished && (availability.isScheduled || !availability.isOpen) ? (
            <StatusPill tone={availability.state === "open" ? "primary" : availability.state === "upcoming" ? "warning" : "danger"}>
              {describeAvailability(availability)}
            </StatusPill>
          ) : null}
          {readiness.map((item) => (
            <StatusPill key={item.label} tone={item.ok ? "primary" : "warning"}>
              {item.label} {item.ok ? "siap" : "kosong"}
            </StatusPill>
          ))}
          <span className="text-xs text-slate-500">Pemilik: {room.createdBy?.username ?? "seed / tanpa pemilik"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="hidden items-center gap-3 md:flex">
            {sections.map(([href, label]) => (
              <a key={href} href={href} className="text-xs font-bold text-slate-400 transition hover:text-primary">
                {label}
              </a>
            ))}
          </nav>
          <Link href={`/instructor/paths/${room.learningPath.id}`} className="text-xs font-bold text-slate-400 hover:text-primary">
            Path
          </Link>
          {room.isPublished ? (
            <Link href={`/rooms/${room.slug}`} className="text-xs font-bold text-primary hover:underline">
              Lihat sebagai student
            </Link>
          ) : null}
          <PublishToggleForm action={toggleRoomPublishAction} idField="roomId" id={room.id} isPublished={room.isPublished} disabled={!canManage} compact />
        </div>
      </div>

      <div className="space-y-6">
        <section id="info" className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Informasi</p>
          <h3 className="mb-5 mt-1 text-lg font-semibold text-slate-100">Metadata room</h3>
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
              availableFrom: room.availableFrom ? room.availableFrom.toISOString() : null,
              availableUntil: room.availableUntil ? room.availableUntil.toISOString() : null
            }}
          />
        </section>

        <section id="materi" className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Materi</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Walkthrough dan bahan belajar</h3>
          <p className="mb-5 mt-2 text-xs leading-relaxed text-slate-400">
            Materi ditampilkan di halaman room student sebelum daftar task. Tulis dalam Markdown dan sisipkan screenshot dengan tombol Upload gambar.
          </p>
          <MaterialEditor roomId={room.id} initialContent={room.content} disabled={!canManage} />
        </section>

        <section id="tasks" className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Tasks</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Soal praktik ({room.tasks.length})</h3>
          <p className="mb-5 mt-2 text-xs leading-relaxed text-slate-400">
            Jawaban benar memberi poin task dan menaikkan progress room. Urutan task menentukan task mana yang aktif untuk peserta.
          </p>
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

        <section id="quiz" className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Quiz</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Assessment quiz</h3>
          <p className="mb-5 mt-2 text-xs leading-relaxed text-slate-400">
            Satu quiz per room. Lulus quiz memberi poin room ({room.points} pts) dan menandai room selesai. Skor setiap attempt tercatat di profil
            peserta.
          </p>
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
