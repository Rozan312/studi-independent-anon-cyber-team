import { GuillocheBand } from "@/components/paper/guilloche-band";
import { Stamp, StampSlot } from "@/components/paper/stamp";

/**
 * Halaman visa paspor belajar: pita guilloche di kepala halaman, lalu sel-sel bergaris putus bernomor seri.
 * Tiap sel memuat satu stempel (room lulus, quiz lulus, atau quiz yang perlu diulang). Sel kosong tetap
 * terlihat sebagai tempat stempel berikutnya, jadi halaman tidak pernah tampak seperti daftar biasa.
 */

export type PassportEntry = {
  id: string;
  kind: "room" | "quiz-pass" | "quiz-retry";
  /** Room: judul room. Quiz: skor, misalnya "90%". */
  title: string;
  /** Tanggal pendek, misalnya "14 Oct 2026". */
  date: string;
  /** Teks di bawah stempel (judul room untuk stempel quiz). */
  caption?: string;
  /** Hentakkan stempel sekali (penyelesaian yang baru terjadi). */
  strike?: boolean;
};

export function PassportPage({
  entries,
  next,
  seed = "anon-cyber-team",
  minCells = 6
}: {
  entries: PassportEntry[];
  /** Judul room berikutnya, ditampilkan sebagai slot "Next stamp". */
  next?: string | null;
  /** Seed tinta pita guilloche (misalnya slug path aktif). */
  seed?: string;
  minCells?: number;
}) {
  const used = entries.length + (next ? 1 : 0);
  // Kelipatan 6 agar baris selalu penuh di 2, 3, maupun 6 kolom.
  const cells = Math.max(minCells, Math.ceil(used / 6) * 6);
  // Di layar 2 kolom, sel kosong setelah baris terakhir yang terisi disembunyikan agar halaman tidak memanjang.
  const mobileCells = Math.max(2, Math.ceil(used / 2) * 2);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper/70">
      <div className="flex items-center gap-3 border-b border-line-soft px-3 py-1.5">
        <span className="serial shrink-0 !text-[0.625rem] !text-ink-3">Visas · Stamps</span>
        <GuillocheBand seed={seed} className="min-w-0 flex-1" />
      </div>
      <ol className="-mb-px -mr-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: cells }, (_, index) => {
          const entry = entries[index];
          const isNext = !entry && next && index === entries.length;
          return (
            <li
              key={entry?.id ?? `cell-${index}`}
              aria-hidden={!entry && !isNext ? true : undefined}
              className={`relative min-h-[10.5rem] flex-col items-center justify-center gap-2 border-b border-r border-dashed border-line px-2 pb-3 pt-6 text-center ${
                index < mobileCells ? "flex" : "hidden sm:flex"
              }`}
            >
              <span className="serial absolute left-2.5 top-2 !text-[0.625rem] !tracking-[0.14em] !text-ink-3" aria-hidden="true">
                No. {String(index + 1).padStart(2, "0")}
              </span>
              {entry ? (
                <>
                  {entry.kind === "room" ? (
                    <Stamp tone="violet" size="sm" top="Passed" title={entry.title} bottom={entry.date} strike={entry.strike} />
                  ) : (
                    <Stamp
                      tone={entry.kind === "quiz-pass" ? "green" : "red"}
                      shape="round"
                      size="sm"
                      top={entry.kind === "quiz-pass" ? "Quiz" : "Retry"}
                      title={entry.title}
                      // Stempel bulat sempit: cukup tanggal dan bulan agar tidak menabrak lingkaran.
                      bottom={entry.date.replace(/\s\d{4}$/, "")}
                      strike={entry.strike}
                    />
                  )}
                  {entry.caption ? <span className="line-clamp-2 max-w-[10rem] text-xs leading-snug text-ink-2">{entry.caption}</span> : null}
                </>
              ) : isNext ? (
                <StampSlot size="sm" label="Next stamp" title={next as string} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
