"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitTaskAnswerAction, type LearningActionState } from "@/lib/actions/learning-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { getAnswerFormat } from "@/lib/learning/answer-format";

const initialState: LearningActionState = {
  tone: "idle",
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_18px_rgba(91,141,239,0.22)] transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Memeriksa..." : "Submit Jawaban"}
    </button>
  );
}

export function TaskSubmitForm({
  taskId,
  roomSlug,
  answerType,
  hasHint = false,
  hint = null,
  wrongAttempts = 0,
  hintUnlockAfter = 2
}: {
  taskId: string;
  roomSlug: string;
  answerType: string;
  hasHint?: boolean;
  /** Hanya diisi server ketika hint sudah terbuka untuk peserta ini. */
  hint?: string | null;
  wrongAttempts?: number;
  hintUnlockAfter?: number;
}) {
  const [state, formAction] = useFormState(submitTaskAnswerAction, initialState);
  const format = getAnswerFormat(answerType);
  const attemptsUntilHint = Math.max(0, hintUnlockAfter - wrongAttempts);

  return (
    <form action={formAction} noValidate className="mt-5 space-y-3 rounded-lg border border-white/[0.06] bg-black/20 p-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="roomSlug" value={roomSlug} />
      <div className="flex flex-col gap-2">
        <label htmlFor={`answer-${taskId}`} className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Jawaban Task
        </label>
        <input
          id={`answer-${taskId}`}
          name="answer"
          autoComplete="off"
          aria-describedby={`answer-hint-${taskId}`}
          placeholder={format.placeholder}
          className="focus-ring min-h-11 rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
        <p id={`answer-hint-${taskId}`} className="text-[11px] leading-relaxed text-slate-500">
          {format.hint}
        </p>
      </div>

      {hint ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100" role="note">
          <span className="font-bold uppercase tracking-[0.16em] text-amber-300">Hint </span>
          {hint}
        </div>
      ) : hasHint ? (
        <p className="text-[11px] text-slate-500">
          {wrongAttempts > 0 ? `${wrongAttempts} percobaan salah. ` : ""}
          Hint terbuka setelah {attemptsUntilHint} percobaan salah lagi.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton />
      </div>
    </form>
  );
}
