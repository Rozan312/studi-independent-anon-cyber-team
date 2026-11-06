/**
 * Penanda penyelesaian yang langsung ke inti dan tenang: room lulus = lingkaran bergaris violet berisi centang,
 * quiz lulus = angka skornya dalam hijau, quiz yang perlu diulang = lingkaran bergaris merah berisi ikon retry.
 * Penanda bergaris (bukan cakram terisi) agar tidak lebih keras dari aksi cyan. Centang yang baru didapat
 * digambar sekali (check-draw), mati pada prefers-reduced-motion.
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
  md: { box: "h-7 w-7", icon: "h-3.5 w-3.5", score: "text-[0.8125rem]" },
  lg: { box: "h-11 w-11", icon: "h-5 w-5", score: "text-xl" }
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
      <span className={`figure inline-flex shrink-0 items-center justify-center font-bold leading-none text-green ${s.score} ${className}`} aria-hidden="true">
        {score ?? 0}%
      </span>
    );
  }

  if (kind === "quiz-retry") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-full border border-red/45 bg-red-soft text-red ${s.box} ${className}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className={s.icon} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5" />
          <path d="M20 3.5v5h-5" />
        </svg>
      </span>
    );
  }

  // Room berikutnya: lingkaran putus-putus cyan, sama dengan penanda "Up next" di daftar room dasbor.
  if (kind === "next") {
    return <span className={`inline-flex shrink-0 rounded-full border-[1.5px] border-dashed border-cyan-ink ${s.box} ${className}`} aria-hidden="true" />;
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border border-violet/45 bg-violet-soft text-violet ${s.box} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={`${s.icon} ${fresh ? "check-draw" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12.5 4.5 4.5L19 7.5" pathLength={1} />
      </svg>
    </span>
  );
}

function describe(entry: CompletionEntry) {
  if (entry.kind === "room") return "Room passed";
  if (entry.kind === "quiz-pass") return `Quiz passed with ${entry.score ?? 0}%`;
  return `Quiz scored ${entry.score ?? 0}% · try again`;
}

/**
 * Daftar penyelesaian (room lulus, skor quiz, quiz yang perlu diulang), terbaru dulu: satu kolom baris dengan
 * penanda kecil di kiri dan tanggal rata kanan.
 */
export function CompletionList({ entries, next }: { entries: CompletionEntry[]; next?: string | null }) {
  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <li key={entry.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3">
          <span className="flex justify-center">
            <CompletionMark kind={entry.kind} score={entry.score} fresh={entry.fresh} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display font-semibold leading-snug text-ink">{entry.title}</span>
            <span className="mt-0.5 block text-sm text-ink-3">{describe(entry)}</span>
          </span>
          <span className="figure whitespace-nowrap text-xs text-ink-3">{entry.date}</span>
        </li>
      ))}
      {next ? (
        <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3">
          <span className="flex justify-center">
            <CompletionMark kind="next" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display font-semibold leading-snug text-ink-2">{next}</span>
            <span className="mt-0.5 block text-sm text-cyan-ink">Up next</span>
          </span>
          <span />
        </li>
      ) : null}
    </ul>
  );
}
