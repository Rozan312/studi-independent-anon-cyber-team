"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { submitTaskAnswerAction, type LearningActionState } from "@/lib/actions/learning-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { helpClass, inputClass, labelClass, primaryButtonClass } from "@/components/instructor/form-styles";
import { getAnswerFormat } from "@/lib/learning/answer-format";

const initialState: LearningActionState = {
  tone: "idle",
  message: ""
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function TaskSubmitForm({
  taskId,
  roomSlug,
  answerType,
  hasHint = false,
  hint = null,
  wrongAttempts = 0,
  hintUnlockAfter = 2,
  solved = false
}: {
  taskId: string;
  roomSlug: string;
  answerType: string;
  hasHint?: boolean;
  /** Hanya diisi server ketika hint sudah terbuka untuk peserta ini. */
  hint?: string | null;
  wrongAttempts?: number;
  hintUnlockAfter?: number;
  /**
   * Task sudah dijawab benar. Komponen tetap dipasang di posisi yang sama setelah revalidasi
   * agar pesan sukses dan stempel "Correct" dari submit barusan tetap terlihat.
   */
  solved?: boolean;
}) {
  const [state, formAction] = useFormState(submitTaskAnswerAction, initialState);
  const format = getAnswerFormat(answerType);
  const attemptsUntilHint = Math.max(0, hintUnlockAfter - wrongAttempts);
  const succeeded = state.tone === "success";
  const resultRef = useRef<HTMLDivElement>(null);

  // Jawaban benar menggantikan form (termasuk tombol Submit yang sedang difokus). Fokus dipindah ke blok
  // hasil agar pembaca layar tidak kehilangan posisi; Tab berikutnya menuju task selanjutnya.
  useEffect(() => {
    if (succeeded) resultRef.current?.focus();
  }, [succeeded]);

  if (solved && !succeeded) return null;

  return (
    <div className="mt-4">
      {/*
        Wilayah status selalu terpasang selama form tampil, lalu isinya berubah saat jawaban benar.
        Live region yang dipasang sudah berisi sering tidak dibacakan (NVDA/JAWS + Chrome), jadi pesan
        sukses tidak memakai ActionMessage (yang baru dipasang bersama teksnya).
      */}
      <div
        ref={resultRef}
        tabIndex={succeeded ? -1 : undefined}
        className={succeeded ? "flex flex-col items-start gap-4 focus:outline-none sm:flex-row sm:items-center" : undefined}
      >
        <div role="status" aria-live="polite" aria-atomic="true" className={succeeded ? "min-w-0 flex-1" : undefined}>
          {succeeded ? (
            <p className="flex items-start gap-2 rounded-lg border border-green/30 bg-green-soft px-3 py-2 text-sm leading-snug text-ink">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-green" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m3.5 8.5 3 3 6-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{state.message}</span>
            </p>
          ) : null}
        </div>
      </div>

      {succeeded ? null : (
        <form action={formAction} noValidate>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="roomSlug" value={roomSlug} />

          <label htmlFor={`answer-${taskId}`} className={labelClass}>
            Your answer
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <input
              id={`answer-${taskId}`}
              name="answer"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby={`answer-hint-${taskId}`}
              placeholder={format.placeholder}
              className={`${inputClass} min-w-0 sm:flex-1`}
            />
            <SubmitButton label="Submit answer" pendingLabel="Checking…" className={`${primaryButtonClass} sm:mt-1.5 sm:shrink-0`} />
          </div>
          <p id={`answer-hint-${taskId}`} className={helpClass}>
            {format.hint}
          </p>

          {hint ? (
            <div className="mt-3 rounded-lg border border-amber/30 bg-amber-soft px-3.5 py-3" role="note">
              <p className="field-label text-amber">Hint</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{hint}</p>
            </div>
          ) : hasHint ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
              <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
                <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" strokeLinecap="round" />
              </svg>
              <span>
                {wrongAttempts > 0
                  ? `${plural(wrongAttempts, "wrong attempt")} so far. The hint unlocks after ${plural(attemptsUntilHint, "more wrong attempt")}.`
                  : `A hint unlocks after ${plural(attemptsUntilHint, "wrong attempt")}.`}
              </span>
            </p>
          ) : null}

          {state.message ? (
            <div className="mt-3">
              <ActionMessage state={state} />
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}
