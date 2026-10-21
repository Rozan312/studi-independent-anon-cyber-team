/**
 * Penanda penyelesaian yang langsung ke inti: room lulus = tanda centang, quiz lulus = angka skornya,
 * quiz yang perlu diulang = ikon retry. Centang yang baru didapat digambar sekali (check-draw),
 * mati pada prefers-reduced-motion.
 */

export type CompletionKind = "room" | "quiz-pass" | "quiz-retry";

export type CompletionEntry = {
  id: string;
  kind: CompletionKind;
  /** Judul room. */
  title: string;
  /** Skor quiz dalam persen. */
  score?: number;
  /** Tanggal pendek, misalnya "14 Oct 2026". */
  date: string;
  /** Penyelesaian yang baru terjadi: centang digambar sekali. */
  fresh?: boolean;
};

const SIZE = {
  md: { box: "h-10 w-10", icon: "h-5 w-5", score: "text-lg" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", score: "text-[1.75rem]" }
} as const;

export function CompletionMark({
  kind,
  score,
  fresh = false,
  size = "md",
  className = ""
}: {
  kind: CompletionKind | "next";
  score?: number;
  fresh?: boolean;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];

  if (kind === "quiz-pass") {
    return (
      <span className={`figure inline-flex min-w-10 shrink-0 items-center justify-center font-bold leading-none text-green ${s.score} ${className}`} aria-hidden="true">
        {score ?? 0}%
      </span>
    );
  }

  if (kind === "quiz-retry") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-red-soft text-red ${s.box} ${className}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className={s.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
        </svg>
      </span>
    );
  }

  if (kind === "next") {
    return <span className={`inline-flex shrink-0 rounded-full border-2 border-dashed border-line-strong ${s.box} ${className}`} aria-hidden="true" />;
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-violet text-sheet ${s.box} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={`${s.icon} ${fresh ? "check-draw" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12.5 4.5 4.5L19 7.5" pathLength={1} />
      </svg>
    </span>
  );
}

function describe(entry: CompletionEntry) {
  if (entry.kind === "room") return `Room passed · ${entry.date}`;
  if (entry.kind === "quiz-pass") return `Quiz passed · ${entry.date}`;
  return `Quiz scored ${entry.score ?? 0}% · try again · ${entry.date}`;
}

/** Daftar penyelesaian (room lulus, skor quiz, quiz yang perlu diulang), terbaru dulu. */
export function CompletionList({ entries, next }: { entries: CompletionEntry[]; next?: string | null }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 border-b border-line-soft py-3">
          <span className="flex w-12 shrink-0 justify-center">
            <CompletionMark kind={entry.kind} score={entry.score} fresh={entry.fresh} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold leading-snug text-ink">{entry.title}</span>
            <span className="mt-0.5 block text-sm text-ink-3">{describe(entry)}</span>
          </span>
        </li>
      ))}
      {next ? (
        <li className="flex items-center gap-3 border-b border-line-soft py-3">
          <span className="flex w-12 shrink-0 justify-center">
            <CompletionMark kind="next" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold leading-snug text-ink-2">{next}</span>
            <span className="mt-0.5 block text-sm text-ink-3">Up next</span>
          </span>
        </li>
      ) : null}
    </ul>
  );
}
