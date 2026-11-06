"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState } from "react-dom";
import {
  addRoomTaskAction,
  deleteRoomTaskAction,
  moveRoomTaskAction,
  updateRoomTaskAction
} from "@/lib/actions/content-actions";
import { EmptyState } from "@/components/card";
import { ActionMessage, type ActionMessageState } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { MoveButton } from "@/components/instructor/move-button";
import { dangerButtonClass, helpClass, idleActionState, inputClass, labelClass, secondaryButtonClass } from "@/components/instructor/form-styles";
import { taskChapterId } from "@/lib/learning/chapters";

export type EditorTask = {
  id: string;
  /** Bab pilihan instruktur; null berarti task tampil di bab terakhir. */
  chapterId: string | null;
  title: string;
  description: string;
  expectedAnswer: string | null;
  acceptedAnswers: string[];
  hint: string | null;
  points: number;
  orderIndex: number;
};

/** Bab room, berurutan seperti di halaman member. */
export type EditorChapter = { id: string; title: string };

/** Tombol ikon kecil untuk mengubah urutan task. */
const reorderButtonClass = "btn-ghost btn-sm w-8 px-0";

function taskHeadingId(taskId: string) {
  return `task-${taskId}-heading`;
}

function chapterOptionLabel(chapter: EditorChapter, index: number) {
  return `Chapter ${index + 1} · ${chapter.title}`;
}

/** Nilai awal select bab: bab task bila masih ada di room, selain itu "No chapter". */
function selectedChapter(chapterId: string | null, chapters: EditorChapter[]) {
  return chapterId && chapters.some((chapter) => chapter.id === chapterId) ? chapterId : "";
}

function TaskFields({
  task,
  chapters,
  defaultChapterId,
  disabled
}: {
  task?: EditorTask;
  chapters: EditorChapter[];
  defaultChapterId: string;
  disabled: boolean;
}) {
  const id = useId();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
        <div>
          <label htmlFor={`${id}-title`} className={labelClass}>
            Task title
          </label>
          <input
            id={`${id}-title`}
            name="title"
            defaultValue={task?.title ?? ""}
            placeholder="Identify the response header"
            className={inputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor={`${id}-points`} className={labelClass}>
            Points
          </label>
          <input
            id={`${id}-points`}
            name="points"
            type="number"
            min={0}
            max={10000}
            defaultValue={task?.points ?? 10}
            className={`${inputClass} figure`}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Room tanpa bab: field tetap terkirim kosong agar task disimpan tanpa bab. */}
      {chapters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* min-w-0: judul bab panjang di opsi select tidak boleh melebarkan kolom grid di layar sempit. */}
          <div className="min-w-0">
            <label htmlFor={`${id}-chapter`} className={labelClass}>
              Chapter
            </label>
            <select
              id={`${id}-chapter`}
              name="chapterId"
              defaultValue={defaultChapterId}
              aria-describedby={`${id}-chapter-help`}
              className={inputClass}
              disabled={disabled}
            >
              {chapters.map((chapter, index) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapterOptionLabel(chapter, index)}
                </option>
              ))}
              <option value="">No chapter (shows under the last chapter)</option>
            </select>
            <p id={`${id}-chapter-help`} className={helpClass}>
              Members find this task below the chapter&apos;s material.
            </p>
          </div>
        </div>
      ) : (
        <input type="hidden" name="chapterId" value="" />
      )}

      <div>
        <label htmlFor={`${id}-description`} className={labelClass}>
          Instructions for members
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="Describe what members should look at or do (at least 10 characters)."
          className={inputClass}
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor={`${id}-answer`} className={labelClass}>
          Expected answer
        </label>
        <input
          id={`${id}-answer`}
          name="expectedAnswer"
          defaultValue={task?.expectedAnswer ?? ""}
          placeholder="e.g. least privilege"
          aria-describedby={`${id}-answer-help`}
          className={`${inputClass} font-mono text-sm`}
          disabled={disabled}
        />
        <p id={`${id}-answer-help`} className={helpClass}>
          Members type this answer (or another accepted one) to solve the task; letter case and spaces at either end are ignored. The answer
          box shows its shape as a clue, each letter or digit as * with spaces and punctuation visible. Without an answer the task can&apos;t be
          solved, so the tasks after it in its chapter stay locked and the room can&apos;t be completed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-accepted`} className={labelClass}>
            Other accepted answers <span className="font-normal text-ink-3">(optional, one per line)</span>
          </label>
          <textarea
            id={`${id}-accepted`}
            name="acceptedAnswers"
            rows={3}
            defaultValue={task?.acceptedAnswers?.join("\n") ?? ""}
            placeholder={"principle of least privilege\nleast-privilege"}
            aria-describedby={`${id}-accepted-help`}
            className={`${inputClass} font-mono text-sm`}
            disabled={disabled}
          />
          <p id={`${id}-accepted-help`} className={helpClass}>
            Synonyms, abbreviations, or other spellings that also count as correct. Up to 10 lines.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-hint`} className={labelClass}>
            Hint <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id={`${id}-hint`}
            name="hint"
            rows={3}
            defaultValue={task?.hint ?? ""}
            placeholder="Point members in the right direction without giving the answer away."
            aria-describedby={`${id}-hint-help`}
            className={inputClass}
            disabled={disabled}
          />
          <p id={`${id}-hint-help`} className={helpClass}>
            Shown to members after two wrong attempts on this task.
          </p>
        </div>
      </div>
    </>
  );
}

function TaskRow({
  task,
  chapters,
  groupId,
  chapterLabel,
  position,
  isFirst,
  isLast,
  disabled,
  deleteAction,
  deleteError,
  onDeleteRequest
}: {
  task: EditorTask;
  chapters: EditorChapter[];
  /** Bab tempat task tampil (bab terakhir untuk task tanpa bab); null bila room belum punya bab. */
  groupId: string | null;
  /** "Chapter 2" untuk pembaca layar; null bila daftar tidak dikelompokkan per bab. */
  chapterLabel: string | null;
  /** Posisi di dalam babnya; isFirst/isLast juga per bab karena naik/turun hanya bertukar dengan task di bab yang sama. */
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  /** Hasil hapus dipegang TaskEditor karena baris ini ikut hilang setelah berhasil; gagal tetap tampil di baris. */
  deleteAction: (formData: FormData) => void;
  deleteError: ActionMessageState;
  /** Dipanggil setelah konfirmasi hapus, sebelum form dikirim. */
  onDeleteRequest: () => void;
}) {
  const [state, formAction] = useFormState(updateRoomTaskAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveRoomTaskAction, idleActionState);
  const articleRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousGroup = useRef(groupId);
  const headingId = taskHeadingId(task.id);
  const Heading = chapterLabel ? "h4" : "h3";

  // Task yang disimpan dengan bab lain pindah ke kelompok bab itu. Baris ikut dibawa ke layar (fokus ke judulnya
  // bila fokus tombol Simpan hilang saat baris dipindah) agar pesan simpan tetap terlihat di tempat barunya.
  useEffect(() => {
    if (previousGroup.current === groupId) return;
    previousGroup.current = groupId;

    const article = articleRef.current;
    if (!article) return;
    if (!article.contains(document.activeElement)) headingRef.current?.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    article.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [groupId]);

  return (
    <article
      ref={articleRef}
      aria-labelledby={headingId}
      className={`scroll-mt-24 py-6 ${isFirst ? (chapterLabel ? "pt-5" : "pt-1") : "border-t border-line"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <Heading ref={headingRef} id={headingId} tabIndex={-1} className="text-base font-bold text-ink">
            Task <span className="figure">{position}</span>
            {chapterLabel ? <span className="sr-only">, {chapterLabel}</span> : null}
          </Heading>
          <span className="figure text-sm text-ink-3">
            {task.points} {task.points === 1 ? "pt" : "pts"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="up" />
            <MoveButton direction="up" disabled={disabled || isFirst} describedBy={headingId} className={reorderButtonClass} />
          </form>
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="down" />
            <MoveButton direction="down" disabled={disabled || isLast} describedBy={headingId} className={reorderButtonClass} />
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Delete this task and its answer history?")) {
                event.preventDefault();
                return;
              }
              onDeleteRequest();
            }}
          >
            <input type="hidden" name="taskId" value={task.id} />
            <SubmitButton label="Delete" pendingLabel="Deleting…" className={`${dangerButtonClass} ml-1`} disabled={disabled} />
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="taskId" value={task.id} />
        <TaskFields task={task} chapters={chapters} defaultChapterId={selectedChapter(task.chapterId, chapters)} disabled={disabled} />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteError} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Save task" className={secondaryButtonClass} disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

/** Kepala kelompok bab di daftar task; id-nya menjadi tujuan tautan "Manage tasks" dari editor bab. */
function ChapterGroupHeading({
  chapter,
  position,
  taskCount,
  isFirst
}: {
  chapter: EditorChapter;
  position: number;
  taskCount: number;
  isFirst: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3 ${isFirst ? "" : "mt-8"}`}>
      <h3 id={`chapter-${chapter.id}`} className="min-w-0 scroll-mt-24 text-base font-bold text-ink [overflow-wrap:anywhere]">
        <span className="text-ink-3">
          Chapter <span className="figure">{position}</span> ·
        </span>{" "}
        {chapter.title}
      </h3>
      <span className="shrink-0 text-sm text-ink-3">
        <span className="figure">{taskCount}</span> {taskCount === 1 ? "task" : "tasks"}
      </span>
    </div>
  );
}

function AddTaskForm({ roomId, chapters, disabled }: { roomId: string; chapters: EditorChapter[]; disabled: boolean }) {
  const [state, formAction] = useFormState(addRoomTaskAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const headingId = useId();
  const lastChapterId = chapters.length > 0 ? chapters[chapters.length - 1].id : "";

  // Setelah berhasil, field dikosongkan tetapi bab pilihan dipertahankan: task biasanya ditambahkan bab demi bab.
  useEffect(() => {
    if (state.tone !== "success") return;
    const form = formRef.current;
    if (!form) return;

    const select = form.elements.namedItem("chapterId");
    const chosen = select instanceof HTMLSelectElement ? select.value : null;
    form.reset();
    if (select instanceof HTMLSelectElement && chosen !== null) select.value = chosen;
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-labelledby={headingId}
      className="space-y-4 border-t border-dashed border-line-strong pt-6"
    >
      <div>
        <h3 id={headingId} className="text-base font-bold text-ink">
          Add a task
        </h3>
        {chapters.length === 0 ? (
          <p className={helpClass}>This room has no chapters yet. Tasks you add now show under the last chapter once the material has one.</p>
        ) : null}
      </div>
      <input type="hidden" name="roomId" value={roomId} />
      <TaskFields chapters={chapters} defaultChapterId={lastChapterId} disabled={disabled} />
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <ActionMessage state={state} />
        </div>
        <SubmitButton label="Add task" pendingLabel="Adding…" disabled={disabled} />
      </div>
    </form>
  );
}

/**
 * Task dikelompokkan per bab seperti di halaman member (task tanpa bab ikut bab terakhir); nomor dan tombol naik/turun
 * berlaku di dalam satu bab. Kepala bab dan baris task sengaja satu deret anak dengan key stabil: task yang pindah bab
 * dipindah React, bukan dipasang ulang, sehingga pesan "Task saved." tetap ada. Form tambah dipisah garis putus-putus.
 *
 * Hapus task: baris (dan tombol Delete yang sedang difokus) hilang setelah berhasil, jadi hasilnya dipegang di sini.
 * Pesan sukses tampil di wilayah status yang selalu terpasang di atas daftar, dan fokus pindah ke judul task terdekat
 * (berikutnya lalu sebelumnya di bab yang sama, lalu di bab lain), atau ke judul daftar (headingId) bila tidak ada.
 */
export function TaskEditor({
  roomId,
  tasks,
  chapters,
  headingId,
  disabled = false
}: {
  roomId: string;
  /** Berurutan menurut orderIndex. */
  tasks: EditorTask[];
  chapters: EditorChapter[];
  /** Judul seksi daftar task (harus tabIndex -1); tujuan fokus setelah task terakhir dihapus. */
  headingId?: string;
  disabled?: boolean;
}) {
  const [deleteState, deleteAction] = useFormState(deleteRoomTaskAction, idleActionState);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const focusAfterDelete = useRef<string | null>(null);

  useEffect(() => {
    if (deleteState.tone !== "success") return;
    const targetId = focusAfterDelete.current;
    focusAfterDelete.current = null;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    target.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [deleteState]);

  const grouped = chapters.length > 0;
  const groups = grouped
    ? chapters
        .map((chapter, index) => ({
          chapter,
          position: index + 1,
          tasks: tasks.filter((task) => taskChapterId(task.chapterId, chapters) === chapter.id)
        }))
        .filter((group) => group.tasks.length > 0)
    : [{ chapter: null, position: 0, tasks }];

  // Urutan tampil seluruh task, untuk memilih tujuan fokus setelah sebuah task dihapus.
  const shown = groups.flatMap((group) => group.tasks.map((task) => ({ id: task.id, groupId: group.chapter?.id ?? null })));
  function focusTargetAfterDeleting(taskId: string) {
    const index = shown.findIndex((entry) => entry.id === taskId);
    const current = shown[index];
    const next = shown[index + 1];
    const previous = index > 0 ? shown[index - 1] : undefined;
    const nearest =
      (next && next.groupId === current?.groupId ? next : undefined) ??
      (previous && previous.groupId === current?.groupId ? previous : undefined) ??
      next ??
      previous;
    return nearest ? taskHeadingId(nearest.id) : headingId ?? null;
  }

  const rows: React.ReactNode[] = [];
  groups.forEach((group, groupIndex) => {
    if (group.chapter) {
      rows.push(
        <ChapterGroupHeading
          key={`chapter-${group.chapter.id}`}
          chapter={group.chapter}
          position={group.position}
          taskCount={group.tasks.length}
          isFirst={groupIndex === 0}
        />
      );
    }

    group.tasks.forEach((task, index) => {
      rows.push(
        <TaskRow
          key={task.id}
          task={task}
          chapters={chapters}
          groupId={group.chapter?.id ?? null}
          chapterLabel={group.chapter ? `Chapter ${group.position}` : null}
          position={index + 1}
          isFirst={index === 0}
          isLast={index === group.tasks.length - 1}
          disabled={disabled}
          deleteAction={deleteAction}
          deleteError={deleteState.tone === "error" && deletingTaskId === task.id ? deleteState : idleActionState}
          onDeleteRequest={() => {
            focusAfterDelete.current = focusTargetAfterDeleting(task.id);
            setDeletingTaskId(task.id);
          }}
        />
      );
    });
  });

  return (
    <div>
      {/* key per task yang dihapus: isi dipasang ulang, sehingga hapus berikutnya dengan teks yang sama tetap diumumkan. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {deleteState.tone === "success" ? (
          <div key={deletingTaskId} className="mb-5">
            <ActionMessage state={deleteState} inLiveRegion />
          </div>
        ) : null}
      </div>
      {tasks.length === 0 ? (
        <div className="mb-6">
          <EmptyState title="No tasks yet" message="Add at least one task so members' room progress can be counted." />
        </div>
      ) : (
        <div>{rows}</div>
      )}
      <AddTaskForm roomId={roomId} chapters={chapters} disabled={disabled} />
    </div>
  );
}
