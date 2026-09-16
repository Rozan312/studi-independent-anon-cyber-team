"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  addQuizQuestionAction,
  deleteQuizQuestionAction,
  moveQuizQuestionAction,
  updateQuizQuestionAction,
  upsertQuizAction
} from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { dangerButtonClass, ghostButtonClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

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
      <label className={labelClass}>
        Pertanyaan
        <textarea
          name="question"
          rows={2}
          defaultValue={question?.question ?? ""}
          placeholder="Tuliskan pertanyaan konsep (minimal 5 karakter)."
          className={inputClass}
          disabled={disabled}
        />
      </label>

      <div>
        <p className={labelClass}>Opsi jawaban (pilih satu yang benar)</p>
        <input type="hidden" name="correctOption" value={correctIndex} />
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={option.key} className="flex items-center gap-2">
              <input
                type="radio"
                aria-label={`Tandai opsi ${index + 1} sebagai benar`}
                checked={option.isCorrect}
                onChange={() => markCorrect(index)}
                className="h-4 w-4 accent-primary"
                disabled={disabled}
              />
              <input
                name="optionLabel"
                value={option.label}
                onChange={(event) => updateLabel(index, event.target.value)}
                placeholder={`Opsi ${index + 1}`}
                className={`${inputClass} mt-0`}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className={ghostButtonClass}
                disabled={disabled || options.length <= MIN_OPTIONS}
                title="Hapus opsi"
              >
                x
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className={`${ghostButtonClass} mt-2`} disabled={disabled || options.length >= MAX_OPTIONS}>
          Tambah opsi
        </button>
      </div>

      <label className={labelClass}>
        Penjelasan jawaban
        <textarea
          name="explanation"
          rows={2}
          defaultValue={question?.explanation ?? ""}
          placeholder="Alasan singkat mengapa jawaban tersebut benar (minimal 5 karakter)."
          className={inputClass}
          disabled={disabled}
        />
      </label>
    </>
  );
}

function QuizSettingsForm({ roomId, quiz, disabled }: { roomId: string; quiz: EditorQuiz | null; disabled: boolean }) {
  const [state, formAction] = useFormState(upsertQuizAction, idleActionState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-white/[0.08] bg-black/20 p-4">
      <input type="hidden" name="roomId" value={roomId} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
        <label className={labelClass}>
          Judul quiz
          <input name="title" defaultValue={quiz?.title ?? ""} placeholder="Concept Check" className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Passing score (%)
          <input name="passingScore" type="number" min={0} max={100} defaultValue={quiz?.passingScore ?? 70} className={inputClass} disabled={disabled} />
        </label>
      </div>
      <label className={labelClass}>
        Deskripsi quiz
        <textarea
          name="description"
          rows={2}
          defaultValue={quiz?.description ?? ""}
          placeholder="Jelaskan cakupan quiz ini (minimal 10 karakter)."
          className={inputClass}
          disabled={disabled}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label={quiz ? "Simpan pengaturan quiz" : "Buat quiz"} disabled={disabled} />
      </div>
    </form>
  );
}

function QuestionRow({
  question,
  isFirst,
  isLast,
  disabled
}: {
  question: EditorQuestion;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
}) {
  const [state, formAction] = useFormState(updateQuizQuestionAction, idleActionState);
  const [deleteState, deleteAction] = useFormState(deleteQuizQuestionAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveQuizQuestionAction, idleActionState);

  return (
    <article className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pertanyaan {question.orderIndex}</p>
        <div className="flex flex-wrap items-center gap-2">
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isFirst}>
              Naik
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isLast}>
              Turun
            </button>
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Hapus pertanyaan ini dari quiz?")) event.preventDefault();
            }}
          >
            <input type="hidden" name="questionId" value={question.id} />
            <button type="submit" className={dangerButtonClass} disabled={disabled}>
              Hapus
            </button>
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="questionId" value={question.id} />
        <QuestionFields question={question} disabled={disabled} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteState} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Simpan pertanyaan" disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

function AddQuestionForm({ quizId, roomId, disabled }: { quizId: string; roomId: string; disabled: boolean }) {
  const [state, formAction] = useFormState(addQuizQuestionAction, idleActionState);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.tone === "success") setResetKey((value) => value + 1);
  }, [state]);

  return (
    <form key={resetKey} action={formAction} className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Tambah pertanyaan</p>
      <input type="hidden" name="quizId" value={quizId} />
      <input type="hidden" name="roomId" value={roomId} />
      <QuestionFields disabled={disabled} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Tambah pertanyaan" pendingLabel="Menambahkan..." disabled={disabled} />
      </div>
    </form>
  );
}

export function QuizEditor({ roomId, quiz, disabled = false }: { roomId: string; quiz: EditorQuiz | null; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      <QuizSettingsForm roomId={roomId} quiz={quiz} disabled={disabled} />

      {quiz ? (
        <>
          {quiz.attemptsCount > 0 ? (
            <p className="text-[11px] leading-relaxed text-slate-500">
              Quiz ini sudah dikerjakan {quiz.attemptsCount} kali. Mengubah pertanyaan tidak mengubah skor attempt yang sudah tercatat.
            </p>
          ) : null}
          {quiz.questions.length === 0 ? (
            <p className="rounded-lg border border-white/[0.06] bg-black/20 p-4 text-sm text-slate-400">
              Quiz belum memiliki pertanyaan. Student baru bisa mengerjakan quiz setelah minimal satu pertanyaan ditambahkan.
            </p>
          ) : null}
          {quiz.questions.map((question, index) => (
            <QuestionRow
              key={question.id}
              question={question}
              isFirst={index === 0}
              isLast={index === quiz.questions.length - 1}
              disabled={disabled}
            />
          ))}
          <AddQuestionForm quizId={quiz.id} roomId={roomId} disabled={disabled} />
        </>
      ) : (
        <p className="text-sm text-slate-400">Simpan pengaturan quiz terlebih dahulu, lalu tambahkan pertanyaan.</p>
      )}
    </div>
  );
}
