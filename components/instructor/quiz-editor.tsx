"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useFormState } from "react-dom";
import {
  addQuizQuestionAction,
  deleteQuizQuestionAction,
  deleteRoomQuizAction,
  moveQuizQuestionAction,
  updateQuizQuestionAction,
  upsertQuizAction
} from "@/lib/actions/content-actions";
import { EmptyState } from "@/components/card";
import { ActionMessage, type ActionMessageState } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { MoveButton } from "@/components/instructor/move-button";
import { dangerButtonClass, helpClass, idleActionState, inputClass, labelClass, secondaryButtonClass } from "@/components/instructor/form-styles";

export type EditorOption = { id: string; label: string; isCorrect: boolean };
export type EditorQuestion = { id: string; question: string; explanation: string; orderIndex: number; options: EditorOption[] };
export type EditorQuiz = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  attemptsCount: number;
  questions: EditorQuestion[];
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

/** Tombol ikon kecil (urutkan pertanyaan, hapus opsi). */
const iconButtonClass = "btn-ghost btn-sm w-8 px-0";

type DraftOption = { key: number; label: string; isCorrect: boolean };

function toDraftOptions(options?: EditorOption[]): DraftOption[] {
  if (options && options.length > 0) {
    return options.map((option, index) => ({ key: index, label: option.label, isCorrect: option.isCorrect }));
  }

  return [
    { key: 0, label: "", isCorrect: true },
    { key: 1, label: "", isCorrect: false },
    { key: 2, label: "", isCorrect: false },
    { key: 3, label: "", isCorrect: false }
  ];
}

function QuestionFields({ question, disabled }: { question?: EditorQuestion; disabled: boolean }) {
  const id = useId();
  const [options, setOptions] = useState<DraftOption[]>(() => toDraftOptions(question?.options));
  const correctIndex = Math.max(
    0,
    options.findIndex((option) => option.isCorrect)
  );

  function updateLabel(index: number, label: string) {
    setOptions((current) => current.map((option, position) => (position === index ? { ...option, label } : option)));
  }

  function markCorrect(index: number) {
    setOptions((current) => current.map((option, position) => ({ ...option, isCorrect: position === index })));
  }

  function addOption() {
    setOptions((current) =>
      current.length >= MAX_OPTIONS ? current : [...current, { key: Date.now(), label: "", isCorrect: false }]
    );
  }

  function removeOption(index: number) {
    setOptions((current) => {
      if (current.length <= MIN_OPTIONS) return current;
      const next = current.filter((_, position) => position !== index);
      if (!next.some((option) => option.isCorrect)) next[0] = { ...next[0], isCorrect: true };
      return next;
    });
  }

  return (
    <>
      <div>
        <label htmlFor={`${id}-question`} className={labelClass}>
          Question
        </label>
        <textarea
          id={`${id}-question`}
          name="question"
          rows={2}
          defaultValue={question?.question ?? ""}
          placeholder="Write a concept question (at least 5 characters)."
          className={inputClass}
          disabled={disabled}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Answer options</legend>
        <p className={helpClass}>
          Select the one correct answer with its radio button. Use {MIN_OPTIONS} to {MAX_OPTIONS} options.
        </p>
        {/* Nilai yang dikirim ke server; radio di bawah berbagi nama unik per pertanyaan hanya agar menjadi satu grup (panah, satu Tab stop). */}
        <input type="hidden" name="correctOption" value={correctIndex} />
        <ul className="mt-2 space-y-1">
          {options.map((option, index) => (
            <li
              key={option.key}
              className={`rounded-lg border px-1.5 py-1.5 transition-colors ${
                option.isCorrect ? "border-green/35 bg-green-soft" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <label className="flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center coarse:h-11 coarse:w-11" title="Mark as the correct answer">
                  <input
                    type="radio"
                    name={`${id}-correct`}
                    value={index}
                    aria-label={`Mark option ${index + 1} as the correct answer`}
                    checked={option.isCorrect}
                    onChange={() => markCorrect(index)}
                    className="h-4 w-4 cursor-pointer accent-green disabled:cursor-not-allowed"
                    disabled={disabled}
                  />
                </label>
                <input
                  name="optionLabel"
                  value={option.label}
                  onChange={(event) => updateLabel(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Option ${index + 1}`}
                  className={`input min-w-0 flex-1 ${option.isCorrect ? "border-green/60" : ""}`}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className={iconButtonClass}
                  disabled={disabled || options.length <= MIN_OPTIONS}
                  aria-label={`Remove option ${index + 1}`}
                  title="Remove option"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {option.isCorrect ? (
                <p className="ml-[2.375rem] mt-1 flex items-center gap-1.5 text-xs font-semibold text-green">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Correct answer
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addOption}
          className="btn-secondary btn-sm mt-2"
          disabled={disabled || options.length >= MAX_OPTIONS}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
          </svg>
          Add option
        </button>
      </fieldset>

      <div>
        <label htmlFor={`${id}-explanation`} className={labelClass}>
          Answer explanation
        </label>
        <textarea
          id={`${id}-explanation`}
          name="explanation"
          rows={2}
          defaultValue={question?.explanation ?? ""}
          placeholder="Briefly explain why this answer is correct (at least 5 characters)."
          className={inputClass}
          disabled={disabled}
        />
      </div>
    </>
  );
}

/**
 * Hapus quiz: konfirmasi menyebut apa yang hilang (pertanyaan) dan apa yang tetap (riwayat attempt, poin).
 * Room tanpa task tidak boleh kehilangan quiz-nya (server menolak, lihat deleteRoomQuiz), jadi tombolnya nonaktif
 * dengan alasan tertulis di bawah baris judul.
 */
function RemoveQuizForm({
  quiz,
  action,
  disabled,
  describedBy
}: {
  quiz: EditorQuiz;
  action: (formData: FormData) => void;
  disabled: boolean;
  describedBy?: string;
}) {
  const count = quiz.questions.length;
  const questionText = count === 0 ? "" : count === 1 ? " Its question is deleted for good." : ` Its ${count} questions are deleted for good.`;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message =
          `Remove the quiz "${quiz.title}"?${questionText} Members' past attempts stay in their history and the points they earned are kept. ` +
          "Without a quiz, the room is complete once every task is solved.";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input type="hidden" name="quizId" value={quiz.id} />
      <SubmitButton
        label="Remove quiz"
        pendingLabel="Removing…"
        className={dangerButtonClass}
        disabled={disabled}
        describedBy={describedBy}
      />
    </form>
  );
}

function QuizSettingsForm({
  roomId,
  quiz,
  taskCount,
  disabled,
  removeAction,
  headingRef
}: {
  roomId: string;
  quiz: EditorQuiz | null;
  taskCount: number;
  disabled: boolean;
  removeAction: (formData: FormData) => void;
  /** Judul form (tabIndex -1): tujuan fokus setelah quiz dihapus, karena tombol Remove quiz ikut hilang. */
  headingRef: RefObject<HTMLHeadingElement>;
}) {
  const [state, formAction] = useFormState(upsertQuizAction, idleActionState);
  const id = useId();
  const removeBlocked = Boolean(quiz) && taskCount === 0;

  return (
    <div className="space-y-4">
      {/* Form hapus berdiri sendiri di baris judul (form tidak boleh bersarang di form pengaturan). */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h3 ref={headingRef} id={`${id}-heading`} tabIndex={-1} className="text-base font-bold text-ink">
            {quiz ? "Quiz settings" : "Create a quiz"}
          </h3>
          {quiz ? (
            <RemoveQuizForm
              quiz={quiz}
              action={removeAction}
              disabled={disabled || removeBlocked}
              describedBy={removeBlocked ? `${id}-remove-help` : undefined}
            />
          ) : null}
        </div>
        {removeBlocked ? (
          <p id={`${id}-remove-help`} className={helpClass}>
            The quiz can&apos;t be removed while the room has no tasks: without tasks or a quiz, members can&apos;t complete it.
          </p>
        ) : null}
      </div>
      <form action={formAction} aria-labelledby={`${id}-heading`} className="space-y-4">
        <input type="hidden" name="roomId" value={roomId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
            <label htmlFor={`${id}-title`} className={labelClass}>
              Quiz title
            </label>
            <input
              id={`${id}-title`}
              name="title"
              defaultValue={quiz?.title ?? ""}
              placeholder="Concept check"
              className={inputClass}
              disabled={disabled}
            />
          </div>
          <div>
            <label htmlFor={`${id}-passing`} className={labelClass}>
              Passing score (%)
            </label>
            <input
              id={`${id}-passing`}
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={quiz?.passingScore ?? 70}
              className={`${inputClass} figure`}
              disabled={disabled}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-description`} className={labelClass}>
            Quiz description
          </label>
          <textarea
            id={`${id}-description`}
            name="description"
            rows={2}
            defaultValue={quiz?.description ?? ""}
            placeholder="Describe what this quiz covers (at least 10 characters)."
            className={inputClass}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <ActionMessage state={state} />
          </div>
          <SubmitButton label={quiz ? "Save quiz settings" : "Create quiz"} pendingLabel={quiz ? "Saving…" : "Creating…"} disabled={disabled} />
        </div>
      </form>
    </div>
  );
}

function questionHeadingId(questionId: string) {
  return `question-${questionId}-heading`;
}

function QuestionRow({
  question,
  position,
  isFirst,
  isLast,
  disabled,
  deleteAction,
  deleteError,
  onDeleteRequest
}: {
  question: EditorQuestion;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  /** Hasil hapus dipegang QuizEditor karena baris ini ikut hilang setelah berhasil; gagal tetap tampil di baris. */
  deleteAction: (formData: FormData) => void;
  deleteError: ActionMessageState;
  /** Dipanggil setelah konfirmasi hapus, sebelum form dikirim. */
  onDeleteRequest: () => void;
}) {
  const [state, formAction] = useFormState(updateQuizQuestionAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveQuizQuestionAction, idleActionState);
  const headingId = questionHeadingId(question.id);

  return (
    <article aria-labelledby={headingId} className="py-6 first:pt-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 id={headingId} tabIndex={-1} className="text-base font-bold text-ink">
          Question <span className="figure">{position}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <MoveButton direction="up" disabled={disabled || isFirst} describedBy={headingId} className={iconButtonClass} />
          </form>
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <MoveButton direction="down" disabled={disabled || isLast} describedBy={headingId} className={iconButtonClass} />
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Delete this question from the quiz?")) {
                event.preventDefault();
                return;
              }
              onDeleteRequest();
            }}
          >
            <input type="hidden" name="questionId" value={question.id} />
            <SubmitButton label="Delete" pendingLabel="Deleting…" className={`${dangerButtonClass} ml-1`} disabled={disabled} />
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="questionId" value={question.id} />
        <QuestionFields question={question} disabled={disabled} />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteError} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Save question" className={secondaryButtonClass} disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

function AddQuestionForm({
  quizId,
  roomId,
  headingId,
  disabled
}: {
  quizId: string;
  roomId: string;
  /** Id judul (tabIndex -1): tujuan fokus setelah pertanyaan terakhir dihapus. */
  headingId: string;
  disabled: boolean;
}) {
  const [state, formAction] = useFormState(addQuizQuestionAction, idleActionState);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.tone === "success") setResetKey((value) => value + 1);
  }, [state]);

  return (
    <form
      key={resetKey}
      action={formAction}
      aria-labelledby={headingId}
      className="space-y-4 border-t border-dashed border-line-strong pt-6"
    >
      <h3 id={headingId} tabIndex={-1} className="text-base font-bold text-ink">
        Add a question
      </h3>
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="roomId" value={roomId} />
      <QuestionFields disabled={disabled} />
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <ActionMessage state={state} />
        </div>
        <SubmitButton label="Add question" pendingLabel="Adding…" disabled={disabled} />
      </div>
    </form>
  );
}

/**
 * Pengaturan quiz lalu daftar pertanyaan bergaris di dalam panel seksi (bukan kartu di dalam kartu). Quiz opsional:
 * hasil "Remove quiz" dipegang di sini karena form hapusnya ikut hilang begitu room tidak lagi punya quiz. Hasil hapus
 * pertanyaan juga dipegang di sini karena barisnya ikut hilang. Pesan suksesnya tampil di wilayah status yang selalu
 * terpasang (wilayah yang dipasang sudah berisi sering tidak dibacakan), dan fokus dipindah ke judul terdekat.
 */
export function QuizEditor({
  roomId,
  quiz,
  taskCount,
  disabled = false
}: {
  roomId: string;
  quiz: EditorQuiz | null;
  /** Jumlah task room; tanpa task quiz tidak bisa dihapus (lihat deleteRoomQuiz). */
  taskCount: number;
  disabled?: boolean;
}) {
  const [removeState, removeAction] = useFormState(deleteRoomQuizAction, idleActionState);
  const [settingsKey, setSettingsKey] = useState(0);
  const settingsHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusSettingsHeading = useRef(false);

  const [questionDeleteState, questionDeleteAction] = useFormState(deleteQuizQuestionAction, idleActionState);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const focusAfterQuestionDelete = useRef<string | null>(null);
  const addQuestionHeadingId = useId();

  // Setelah quiz dihapus, form pengaturan dipasang ulang agar kosong lagi untuk quiz baru, bukan berisi judul quiz lama.
  useEffect(() => {
    if (removeState.tone !== "success") return;
    focusSettingsHeading.current = true;
    setSettingsKey((value) => value + 1);
  }, [removeState]);

  // Tombol "Remove quiz" yang difokus ikut hilang; fokus pindah ke judul "Create a quiz" pada form yang baru dipasang,
  // sehingga Tab berikutnya menuju field quiz baru.
  useEffect(() => {
    if (!focusSettingsHeading.current) return;
    focusSettingsHeading.current = false;
    settingsHeadingRef.current?.focus();
  }, [settingsKey]);

  useEffect(() => {
    if (questionDeleteState.tone !== "success") return;
    const targetId = focusAfterQuestionDelete.current;
    focusAfterQuestionDelete.current = null;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    target.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [questionDeleteState]);

  // Tujuan fokus setelah pertanyaan dihapus: pertanyaan berikutnya, lalu sebelumnya, lalu judul "Add a question".
  function focusTargetAfterDeleting(questionId: string) {
    const questions = quiz?.questions ?? [];
    const index = questions.findIndex((question) => question.id === questionId);
    const nearest = questions[index + 1] ?? (index > 0 ? questions[index - 1] : undefined);
    return nearest ? questionHeadingId(nearest.id) : addQuestionHeadingId;
  }

  return (
    <div>
      {/* Pesan sukses hanya relevan selama room belum punya quiz lagi; pesan gagal tampil di dekat quiz yang masih ada. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {removeState.tone === "success" && !quiz ? (
          <div className="mb-5">
            <ActionMessage state={removeState} inLiveRegion />
          </div>
        ) : null}
      </div>
      {removeState.tone === "error" ? (
        <div className="mb-5">
          <ActionMessage state={removeState} />
        </div>
      ) : null}

      <QuizSettingsForm
        key={settingsKey}
        roomId={roomId}
        quiz={quiz}
        taskCount={taskCount}
        disabled={disabled}
        removeAction={removeAction}
        headingRef={settingsHeadingRef}
      />

      {quiz ? (
        <div className="mt-6 border-t border-line pt-6">
          {/* key per pertanyaan yang dihapus: isi dipasang ulang, sehingga hapus berikutnya tetap diumumkan. */}
          <div role="status" aria-live="polite" aria-atomic="true">
            {questionDeleteState.tone === "success" ? (
              <div key={deletingQuestionId} className="mb-5">
                <ActionMessage state={questionDeleteState} inLiveRegion />
              </div>
            ) : null}
          </div>
          {quiz.attemptsCount > 0 ? (
            <p className="mb-5 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-sm leading-snug text-ink">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-amber" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 7.2v3.6M8 5.1v.1" strokeLinecap="round" />
              </svg>
              <span>
                This quiz has been taken <span className="figure font-semibold">{quiz.attemptsCount}</span>{" "}
                {quiz.attemptsCount === 1 ? "time" : "times"}. Editing questions does not change scores that are already recorded.
              </span>
            </p>
          ) : null}
          {quiz.questions.length === 0 ? (
            <div className="mb-6">
              <EmptyState
                title="No questions yet"
                message={`Members can take this quiz once it has at least one question. Until then no one can complete the room, so ${
                  taskCount > 0 ? "add questions or remove the quiz" : "add questions"
                }.`}
              />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {quiz.questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === quiz.questions.length - 1}
                  disabled={disabled}
                  deleteAction={questionDeleteAction}
                  deleteError={
                    questionDeleteState.tone === "error" && deletingQuestionId === question.id ? questionDeleteState : idleActionState
                  }
                  onDeleteRequest={() => {
                    focusAfterQuestionDelete.current = focusTargetAfterDeleting(question.id);
                    setDeletingQuestionId(question.id);
                  }}
                />
              ))}
            </div>
          )}
          <AddQuestionForm quizId={quiz.id} roomId={roomId} headingId={addQuestionHeadingId} disabled={disabled} />
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No quiz yet"
            message="Without a quiz, members complete this room by solving every task. To add one, create it with the settings above, then add its questions."
          />
        </div>
      )}
    </div>
  );
}
