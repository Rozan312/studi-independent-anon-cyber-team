import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/card";
import { MaterialEditor } from "@/components/instructor/material-editor";
import { panelClass } from "@/components/instructor/form-styles";
import { roomMaterialToEditorHtml } from "@/lib/content/rich-text";
import { taskChapterId } from "@/lib/learning/chapters";
import { loadRoomEditor, roomEditorHref } from "../../editor-data";

export const metadata: Metadata = { title: "Edit chapter" };
export const dynamic = "force-dynamic";

function BackArrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12.5 8h-9m4-4-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ForwardArrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 8h9m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tautan bab sebelumnya/berikutnya: arah di baris atas, judul bab di bawahnya agar tujuan terbaca sebelum diklik. */
const neighbourLinkClass = "tap-target group flex min-w-0 max-w-full flex-col gap-0.5 py-1 sm:max-w-[48%]";

const neighbourLabelClass = "flex items-center gap-1.5 font-display text-sm font-semibold text-ink transition-colors group-hover:text-cyan-ink";

type ChapterTask = { id: string; title: string; points: number; expectedAnswer: string | null };

/**
 * Task yang tampil di bawah bab ini (baca saja), dengan nomor urut di dalam bab seperti di halaman Tasks.
 * Mengubah atau menambah task tetap di halaman Tasks; tautannya menuju kelompok bab ini.
 */
function ChapterTasks({ tasks, tasksHref, chapterId }: { tasks: ChapterTask[]; tasksHref: string; chapterId: string }) {
  return (
    <section aria-labelledby="chapter-tasks-heading" className="mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="chapter-tasks-heading" className="text-base font-bold text-ink">
          Tasks in this chapter <span className="figure font-semibold text-ink-3">({tasks.length})</span>
        </h3>
        <Link href={tasks.length > 0 ? `${tasksHref}#chapter-${chapterId}` : tasksHref} className="text-link text-sm font-semibold">
          Manage tasks
        </Link>
      </div>
      {tasks.length > 0 ? (
        <ol className="mt-2 divide-y divide-line">
          {tasks.map((task, index) => (
            <li key={task.id} className="flex items-start gap-3 py-2.5">
              <span
                className="figure grid h-7 min-w-7 shrink-0 place-items-center rounded-full border border-line-strong px-1 text-[0.6875rem] font-bold text-ink-3"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="sr-only">Task {index + 1}: </span>
                <span className="font-display font-semibold text-ink [overflow-wrap:anywhere]">{task.title}</span>
                {task.expectedAnswer ? null : <span className="ml-2 text-sm font-semibold text-amber">No answer yet</span>}
              </span>
              <span className="figure shrink-0 pt-0.5 text-sm text-ink-3">
                {task.points} {task.points === 1 ? "pt" : "pts"}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-ink-3">No tasks under this chapter. Tasks are optional for each chapter.</p>
      )}
    </section>
  );
}

export default async function RoomChapterPage({ params }: { params: { id: string; chapterId: string } }) {
  const { room, canManage } = await loadRoomEditor(params.id);

  // Bab dicari di antara bab room ini saja; id bab room lain (atau id yang tidak valid) menjadi 404.
  const index = room.chapters.findIndex((chapter) => chapter.id === params.chapterId);
  if (index === -1) notFound();

  const chapter = room.chapters[index];
  const previous = index > 0 ? room.chapters[index - 1] : null;
  const next = index < room.chapters.length - 1 ? room.chapters[index + 1] : null;
  const materialHref = roomEditorHref(room.id, "material");
  const chapterTasks = room.tasks.filter((task) => taskChapterId(task.chapterId, room.chapters) === chapter.id);

  return (
    <section aria-labelledby="chapter-heading" className={panelClass}>
      <SectionHeader
        id="chapter-heading"
        title={`Chapter ${index + 1} of ${room.chapters.length}`}
        description="Members read this chapter on its own page of the room, with the same formatting as this editor."
        action={
          <Link href={materialHref} className="btn-secondary btn-sm">
            <BackArrow />
            All chapters
          </Link>
        }
      />

      <MaterialEditor
        key={chapter.id}
        chapterId={chapter.id}
        initialTitle={chapter.title}
        initialHtml={roomMaterialToEditorHtml(chapter.content, chapter.contentFormat)}
        legacyMarkdown={chapter.contentFormat === "MARKDOWN" && chapter.content.trim().length > 0}
        disabled={!canManage}
      />

      <ChapterTasks tasks={chapterTasks} tasksHref={roomEditorHref(room.id, "tasks")} chapterId={chapter.id} />

      {previous || next ? (
        <nav aria-label="Chapter navigation" className="mt-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
          {previous ? (
            <Link href={`${materialHref}/${previous.id}`} className={neighbourLinkClass}>
              <span className={neighbourLabelClass}>
                <BackArrow />
                Previous chapter
              </span>
              <span className="max-w-full truncate text-sm text-ink-3">{previous.title}</span>
            </Link>
          ) : null}
          {next ? (
            <Link href={`${materialHref}/${next.id}`} className={`${neighbourLinkClass} ml-auto items-end text-right`}>
              <span className={neighbourLabelClass}>
                Next chapter
                <ForwardArrow />
              </span>
              <span className="max-w-full truncate text-sm text-ink-3">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
