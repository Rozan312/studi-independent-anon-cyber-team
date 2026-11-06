"use client";

import Link from "next/link";
import { useId } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRoomChapterAction, deleteRoomChapterAction, moveRoomChapterAction } from "@/lib/actions/content-actions";
import { EmptyState } from "@/components/card";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { MoveButton } from "@/components/instructor/move-button";
import {
  dangerButtonClass,
  helpClass,
  idleActionState,
  inputClass,
  labelClass,
  primaryButtonClass,
  titleLinkClass
} from "@/components/instructor/form-styles";
import { CHAPTER_TITLE_MAX } from "@/lib/content/rich-text-config";

export type ChapterListItem = {
  id: string;
  title: string;
  /** Ringkasan isi dari server: "Empty", "No text", atau jumlah kata. */
  summary: string;
  isEmpty: boolean;
  /** "Edited 3h ago", dihitung server. */
  editedLabel: string;
  /** Task yang tampil di bawah bab ini, termasuk task tanpa bab untuk bab terakhir. */
  taskCount: number;
};

/** Tombol ikon kecil untuk mengubah urutan bab. */
const reorderButtonClass = "btn-ghost btn-sm w-8 px-0";

/** Hapus bab: seperti SubmitButton, tapi membawa judul bab untuk pembaca layar. */
function DeleteChapterButton({ describedBy }: { describedBy: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={`${dangerButtonClass} ml-1`} disabled={pending} aria-busy={pending || undefined} aria-describedby={describedBy}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function ChapterRow({
  roomId,
  chapter,
  position,
  isFirst,
  isLast,
  disabled,
  moveAction,
  deleteAction
}: {
  roomId: string;
  chapter: ChapterListItem;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  moveAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const titleId = useId();

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 py-3.5">
      {/* Nomor urut dalam lingkaran bergaris, sama dengan penanda daftar room di editor path. */}
      <span
        className="figure mt-px grid h-7 min-w-7 shrink-0 place-items-center rounded-full border border-line-strong px-1 text-[0.6875rem] font-bold text-ink-3"
        aria-hidden="true"
      >
        {String(position).padStart(2, "0")}
      </span>
      {/* Lebar minimum membuat tombol pindah ke baris berikutnya di layar sempit, bukan menghimpit judul. */}
      <div className="min-w-[10rem] flex-1">
        <Link id={titleId} href={`/instructor/rooms/${roomId}/material/${chapter.id}`} className={`${titleLinkClass} block leading-7 [overflow-wrap:anywhere]`}>
          <span className="sr-only">Chapter {position}: </span>
          {chapter.title}
        </Link>
        <p className="mt-0.5 text-sm text-ink-3">
          <span className={chapter.isEmpty ? "font-semibold text-amber" : "figure"}>{chapter.summary}</span>
          {chapter.taskCount > 0 ? (
            <>
              {" · "}
              <span className="figure">{chapter.taskCount}</span> {chapter.taskCount === 1 ? "task" : "tasks"}
            </>
          ) : null}
          {" · "}
          {chapter.editedLabel}
        </p>
      </div>
      {disabled ? null : (
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <form action={moveAction}>
            <input type="hidden" name="chapterId" value={chapter.id} />
            <input type="hidden" name="direction" value="up" />
            <MoveButton direction="up" disabled={isFirst} describedBy={titleId} className={reorderButtonClass} />
          </form>
          <form action={moveAction}>
            <input type="hidden" name="chapterId" value={chapter.id} />
            <input type="hidden" name="direction" value="down" />
            <MoveButton direction="down" disabled={isLast} describedBy={titleId} className={reorderButtonClass} />
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              // Task bab ini tidak ikut terhapus: babnya dikosongkan dan task tampil di bab terakhir.
              const taskNote =
                chapter.taskCount === 0
                  ? ""
                  : chapter.taskCount === 1
                    ? " Its task stays in the room and shows under the last chapter."
                    : ` Its ${chapter.taskCount} tasks stay in the room and show under the last chapter.`;
              if (!window.confirm(`Delete the chapter "${chapter.title}"? Its material is removed for good and can't be restored.${taskNote}`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="chapterId" value={chapter.id} />
            <DeleteChapterButton describedBy={titleId} />
          </form>
        </div>
      )}
    </li>
  );
}

function AddChapterForm({ roomId, isFirstChapter }: { roomId: string; isFirstChapter: boolean }) {
  const [state, formAction] = useFormState(createRoomChapterAction, idleActionState);
  const headingId = useId();
  const inputId = useId();

  return (
    <form action={formAction} aria-labelledby={headingId} className="mt-6 space-y-3 border-t border-dashed border-line-strong pt-6">
      <h3 id={headingId} className="text-base font-bold text-ink">
        {isFirstChapter ? "Add the first chapter" : "Add a chapter"}
      </h3>
      <input type="hidden" name="roomId" value={roomId} />
      <div>
        <label htmlFor={inputId} className={labelClass}>
          Chapter title
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            id={inputId}
            name="title"
            required
            maxLength={CHAPTER_TITLE_MAX}
            placeholder="e.g. Reading HTTP response headers"
            aria-describedby={`${inputId}-help`}
            className={`${inputClass} sm:flex-1`}
          />
          <div className="sm:mt-1.5">
            <SubmitButton label="Add chapter" pendingLabel="Adding…" className={`${primaryButtonClass} w-full sm:w-auto`} />
          </div>
        </div>
        <p id={`${inputId}-help`} className={helpClass}>
          The chapter is added at the end and opens in the editor so you can write it.
        </p>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

/**
 * Daftar bab materi room: baris bergaris dengan nomor, judul (tautan ke editor bab), ringkasan isi, lalu
 * tombol urut dan hapus. Pesan pindah/hapus dipegang di tingkat daftar karena baris yang dihapus ikut hilang.
 */
export function ChapterList({ roomId, chapters, disabled = false }: { roomId: string; chapters: ChapterListItem[]; disabled?: boolean }) {
  const [moveState, moveAction] = useFormState(moveRoomChapterAction, idleActionState);
  const [deleteState, deleteAction] = useFormState(deleteRoomChapterAction, idleActionState);
  const hasMessage = Boolean(moveState.message || deleteState.message);

  return (
    <div>
      {hasMessage ? (
        <div className="mb-4 space-y-2">
          <ActionMessage state={deleteState} />
          <ActionMessage state={moveState} />
        </div>
      ) : null}

      {chapters.length === 0 ? (
        <EmptyState
          title="No chapters yet"
          message={
            disabled
              ? "The owner hasn't written any material for this room yet."
              : "Members read the material chapter by chapter, with each chapter's tasks below it. Add the first chapter below."
          }
        />
      ) : (
        <ol className="-mt-1 divide-y divide-line">
          {chapters.map((chapter, index) => (
            <ChapterRow
              key={chapter.id}
              roomId={roomId}
              chapter={chapter}
              position={index + 1}
              isFirst={index === 0}
              isLast={index === chapters.length - 1}
              disabled={disabled}
              moveAction={moveAction}
              deleteAction={deleteAction}
            />
          ))}
        </ol>
      )}

      {disabled ? null : <AddChapterForm roomId={roomId} isFirstChapter={chapters.length === 0} />}
    </div>
  );
}
