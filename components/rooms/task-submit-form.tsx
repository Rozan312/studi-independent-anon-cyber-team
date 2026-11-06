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

/** Nama tanda baca yang sering muncul di jawaban/flag; tanpa ini sebagian pembaca layar melewatkannya. */
const SYMBOL_NAMES: Record<string, string> = {
  "{": "left brace",
  "}": "right brace",
  "(": "left parenthesis",
  ")": "right parenthesis",
  "[": "left bracket",
  "]": "right bracket",
  "<": "less-than sign",
  ">": "greater-than sign",
  _: "underscore",
  "-": "hyphen",
  ".": "dot",
  ",": "comma",
  ":": "colon",
  ";": "semicolon",
  "/": "slash",
  "\\": "backslash",
  "@": "at sign",
  "#": "hash",
  $: "dollar sign",
  "%": "percent sign",
  "&": "ampersand",
  "+": "plus sign",
  "=": "equals sign",
  "!": "exclamation mark",
  "?": "question mark",
  "'": "apostrophe",
  '"': "quotation mark",
  "|": "vertical bar",
  "~": "tilde",
  "^": "caret"
};

/**
 * Kalimat pembaca layar untuk pola jawaban: deretan "*" dibacakan sebagai jumlah karakter, tanda baca dengan
 * namanya. "***** ********" → "2 words, 5 and 8 characters"; "***{****_*}" → "3 characters, left brace, ...".
 */
function describeAnswerPattern(pattern: string) {
  const words = pattern.split(" ");
  const starsOnly = words.every((word) => /^\*+$/.test(word));

  if (starsOnly) {
    const lengths = words.map((word) => word.length);
    if (lengths.length === 1) return `Answer pattern: ${plural(lengths[0], "character")}.`;
    const last = lengths[lengths.length - 1];
    const list = `${lengths.slice(0, -1).join(", ")} and ${last}`;
    return `Answer pattern: ${lengths.length} words, ${list} characters.`;
  }

  const parts = words.map((word) =>
    (word.match(/\*+|[^*]/g) ?? [])
      .map((token) => (token[0] === "*" ? plural(token.length, "character") : SYMBOL_NAMES[token] ?? token))
      .join(", ")
  );
  return `Answer pattern: ${parts.join(", space, ")}.`;
}

/**
 * Pola yang terlihat. Bintang Red Hat Mono duduk setinggi huruf kapital, sehingga "-" di bawahnya terbaca seperti "_";
 * deretan bintang diturunkan 0,2em agar sejajar dengan tanda baca, dan tanda baca ditebalkan dalam ink agar "-", "_"
 * dan "." mudah dibedakan. Spasi tetap teks biasa supaya aturan bungkus barisnya tidak berubah.
 */
function AnswerPatternGlyphs({ pattern }: { pattern: string }) {
  return pattern.split(/(\*+|\s+)/).map((token, index) => {
    if (!token) return null;
    if (token[0] === "*") {
      return (
        <span key={index} className="relative top-[0.2em]">
          {token}
        </span>
      );
    }
    if (/^\s+$/.test(token)) return token;
    return (
      <span key={index} className="font-semibold text-ink">
        {token}
      </span>
    );
  });
}

export function TaskSubmitForm({
  taskId,
  roomSlug,
  answerType,
  answerPattern = null,
  hasHint = false,
  hint = null,
  wrongAttempts = 0,
  hintUnlockAfter = 2,
  solved = false
}: {
  taskId: string;
  roomSlug: string;
  answerType: string;
  /** Pola petunjuk dari server (huruf/angka menjadi "*"); jawaban aslinya tidak pernah sampai ke browser. */
  answerPattern?: string | null;
  hasHint?: boolean;
  /** Hanya diisi server ketika hint sudah terbuka untuk peserta ini. */
  hint?: string | null;
  wrongAttempts?: number;
  hintUnlockAfter?: number;
  /**
   * Task sudah dijawab benar. Komponen tetap dipasang di posisi yang sama setelah revalidasi
   * agar pesan sukses "Correct" dari submit barusan tetap terlihat.
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
          {/* Petunjuk pola dan format ikut kolom field, jadi di ponsel keduanya tetap di bawah field, di atas tombol Submit. */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
            <div className="min-w-0 sm:flex-1">
              <input
                id={`answer-${taskId}`}
                name="answer"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby={answerPattern ? `answer-pattern-${taskId} answer-hint-${taskId}` : `answer-hint-${taskId}`}
                placeholder={format.placeholder}
                className={inputClass}
              />
              {/*
                Bintang dalam potongan mono dengan jarak huruf agar mudah dihitung. Deretan bintang aria-hidden; deskripsi
                field hanya menunjuk kalimat sr-only, sehingga pembaca layar tidak ikut membacakan bintangnya.
              */}
              {answerPattern ? (
                <p className="mt-2 text-sm text-ink-3">
                  <span aria-hidden="true" className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <span>Answer:</span>
                    <span className="min-w-0 whitespace-pre-wrap font-mono text-[0.9375rem] tracking-[0.22em] text-ink-2 [overflow-wrap:anywhere]">
                      <AnswerPatternGlyphs pattern={answerPattern} />
                    </span>
                  </span>
                  <span id={`answer-pattern-${taskId}`} className="sr-only">
                    {describeAnswerPattern(answerPattern)}
                  </span>
                </p>
              ) : null}
              <p id={`answer-hint-${taskId}`} className={helpClass}>
                {format.hint}
              </p>
            </div>
            <SubmitButton label="Submit answer" pendingLabel="Checking…" className={`${primaryButtonClass} sm:mt-1.5 sm:shrink-0`} />
          </div>

          {hint ? (
            <div className="mt-3 rounded-lg border border-line bg-well px-3.5 py-3" role="note">
              <p className="field-label">Hint</p>
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
