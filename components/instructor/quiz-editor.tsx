"use client";

import { useEffect, useId, useState } from "react";
import { useFormState } from "react-dom";
import {
  addQuizQuestionAction,
  deleteQuizQuestionAction,
  moveQuizQuestionAction,
  updateQuizQuestionAction,
  upsertQuizAction
} from "@/lib/actions/content-actions";
import { EmptyState } from "@/components/card";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
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

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={direction === "up" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
                <label className="flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center" title="Mark as the correct answer">
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

function QuizSettingsForm({ roomId, quiz, disabled }: { roomId: string; quiz: EditorQuiz | null; disabled: boolean }) {
  const [state, formAction] = useFormState(upsertQuizAction, idleActionState);
  const id = useId();

  return (
    <form action={formAction} aria-labelledby={`${id}-heading`} className="space-y-4">
      <h3 id={`${id}-heading`} className="text-base font-bold text-ink">
        Quiz settings
      </h3>
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
  );
}

function QuestionRow({
  question,
  position,
  isFirst,
  isLast,
  disabled
}: {
  question: EditorQuestion;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
}) {
  const [state, formAction] = useFormState(updateQuizQuestionAction, idleActionState);
  const [deleteState, deleteAction] = useFormState(deleteQuizQuestionAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveQuizQuestionAction, idleActionState);
  const headingId = `question-${question.id}-heading`;

  return (
    <article aria-labelledby={headingId} className="py-6 first:pt-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 id={headingId} className="text-base font-bold text-ink">
          Question <span className="figure">{position}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={iconButtonClass} disabled={disabled || isFirst} aria-label="Move up" title="Move up">
              <ChevronIcon direction="up" />
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={iconButtonClass} disabled={disabled || isLast} aria-label="Move down" title="Move down">
              <ChevronIcon direction="down" />
            </button>
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Delete this question from the quiz?")) event.preventDefault();
            }}
          >
            <input type="hidden" name="questionId" value={question.id} />
            <button type="submit" className={`${dangerButtonClass} ml-1`} disabled={disabled}>
              Delete
            </button>
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="questionId" value={question.id} />
        <QuestionFields question={question} disabled={disabled} />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteState} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Save question" className={secondaryButtonClass} disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

function AddQuestionForm({ quizId, roomId, disabled }: { quizId: string; roomId: string; disabled: boolean }) {
  const [state, formAction] = useFormState(addQuizQuestionAction, idleActionState);
  const [resetKey, setResetKey] = useState(0);
  const headingId = useId();

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
      <h3 id={headingId} className="text-base font-bold text-ink">
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

/** Pengaturan quiz lalu daftar pertanyaan bergaris di dalam lembar seksi (bukan kartu di dalam kartu). */
export function QuizEditor({ roomId, quiz, disabled = false }: { roomId: string; quiz: EditorQuiz | null; disabled?: boolean }) {
  return (
    <div>
      <QuizSettingsForm roomId={roomId} quiz={quiz} disabled={disabled} />

      {quiz ? (
        <div className="mt-6 border-t border-line pt-6">
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
              <EmptyState title="No questions yet" message="Members can take this quiz once it has at least one question." />
            </div>
          ) : (
            <div className="divide-y divide-line-soft">
              {quiz.questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === quiz.questions.length - 1}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
          <AddQuestionForm quizId={quiz.id} roomId={roomId} disabled={disabled} />
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState title="No quiz yet" message="Create the quiz with the settings above, then add its questions." />
        </div>
      )}
    </div>
  );
}
