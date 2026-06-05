"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitTaskAnswerAction, type LearningActionState } from "@/lib/actions/learning-actions";
import { ActionMessage } from "@/components/ui/action-message";

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
  answerType
}: {
  taskId: string;
  roomSlug: string;
  answerType: string;
}) {
  const [state, formAction] = useFormState(submitTaskAnswerAction, initialState);

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
          placeholder={`Masukkan jawaban format ${answerType}`}
          className="focus-ring min-h-11 rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton />
      </div>
    </form>
  );
}
