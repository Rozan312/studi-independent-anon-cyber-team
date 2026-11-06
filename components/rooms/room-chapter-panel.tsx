import Link from "next/link";
import type { ContentFormat } from "@prisma/client";
import { RoomMaterial } from "@/components/content/room-material";
import { repeatsRoomTitle } from "@/lib/learning/chapters";

/** Tautan bab; #chapter mendaratkan pembaca di awal panel bab, bukan di puncak halaman. */
function chapterHref(slug: string, number: number) {
  return `/rooms/${slug}?chapter=${number}#chapter`;
}

export function BackArrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ForwardArrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Langkah sesudah bab terakhir: maju (quiz, task terbuka) atau kembali ke learning path. */
export type AfterMaterial = { href: string; label: string; direction: "forward" | "back" };

/**
 * Satu bab materi room untuk member: daftar semua bab di dalam disclosure (tetap ringkas walau babnya banyak),
 * judul bab, isi bab, task bab itu (bila ada), lalu Previous/Next. Setelah bab terakhir, tombol kanan menuju
 * langkah berikutnya (afterMaterial). Panel selebar kolom konten; lebar baca diatur .prose-cyber di
 * app/globals.css, sama dengan editor instruktur.
 */
export function RoomChapterPanel({
  slug,
  roomTitle,
  chapters,
  index,
  chapter,
  taskCounts,
  tasks,
  forwardIsPrimary,
  afterMaterial
}: {
  slug: string;
  /** Judul room (h1 halaman); judul bab yang sama persis hanya dibacakan pembaca layar. */
  roomTitle: string;
  /** Semua bab room, urut; tanpa isi. */
  chapters: { id: string; title: string }[];
  /** Posisi bab yang dibaca (mulai 0). */
  index: number;
  /** Isi bab yang dibaca; null bila tidak bisa dimuat. */
  chapter: { title: string; content: string; contentFormat: ContentFormat } | null;
  /** Jumlah task per bab (sejajar dengan `chapters`) untuk daftar All chapters; total 0 berarti bab tanpa task. */
  taskCounts: { solved: number; total: number }[];
  /** Bagian Tasks bab ini (ChapterTasks), tampil di antara isi bab dan Previous/Next. */
  tasks?: React.ReactNode;
  /**
   * Next chapter / langkah maju menjadi aksi cyan. False bila bab ini masih punya task terbuka (Submit answer yang
   * cyan) atau bagian Tasks sudah menunjuk ke quiz, agar halaman tetap punya satu tombol utama.
   */
  forwardIsPrimary: boolean;
  afterMaterial: AfterMaterial | null;
}) {
  const position = index + 1;
  const total = chapters.length;
  const hasPrevious = index > 0;
  const hasNext = index < total - 1;
  const title = chapter?.title ?? chapters[index]?.title ?? "";
  // Bab yang judulnya hanya mengulang judul room (misalnya bab pertama hasil migrasi) tidak mencetak judul itu
  // untuk kedua kalinya; heading-nya tetap ada untuk pembaca layar, dan daftar All chapters tetap menyebutnya.
  const titleHidden = repeatsRoomTitle(title, roomTitle);
  const forwardClass = forwardIsPrimary ? "btn-primary" : "btn-secondary";

  return (
    <section id="chapter" className="sheet scroll-mt-28" aria-labelledby="chapter-title">
      {total > 1 ? (
        <details className="group border-b border-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-2 text-sm transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="figure text-ink-2">
              Chapter {position} of {total}
            </span>
            <span className="flex items-center gap-1.5 font-display font-semibold text-ink-2 transition-colors group-hover:text-cyan-ink">
              All chapters
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <nav aria-label="Chapters" className="border-t border-line py-1.5">
            <ol className="md:columns-2 md:gap-x-0">
              {chapters.map((item, itemIndex) => {
                const isCurrent = itemIndex === index;
                const count = taskCounts[itemIndex];
                const allSolved = count ? count.total > 0 && count.solved === count.total : false;
                return (
                  <li key={item.id} className="break-inside-avoid">
                    <Link
                      href={chapterHref(slug, itemIndex + 1)}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex min-h-10 items-baseline gap-3 px-5 py-2 text-sm transition-colors hover:bg-well focus-visible:outline-offset-[-2px] coarse:min-h-11 sm:px-6 ${
                        isCurrent ? "font-semibold text-cyan-ink" : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      <span className={`figure w-5 shrink-0 text-right ${isCurrent ? "" : "text-ink-3"}`}>{itemIndex + 1}</span>
                      <span className="min-w-0 flex-1">{item.title}</span>
                      {/* Bab dengan task menyebut berapa yang sudah benar; centang hijau bila semuanya benar. */}
                      {count && count.total > 0 ? (
                        <span className={`figure flex shrink-0 items-baseline gap-1 font-normal ${allSolved ? "text-green" : "text-ink-3"}`}>
                          {allSolved ? (
                            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : null}
                          <span aria-hidden="true">
                            {count.solved}/{count.total}
                          </span>
                          <span className="sr-only">
                            , {count.solved} of {count.total} {count.total === 1 ? "task" : "tasks"} solved
                          </span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </details>
      ) : null}

      <div className="px-5 pb-6 pt-5 md:px-6 md:pt-6">
        <h2
          id="chapter-title"
          className={titleHidden ? "sr-only" : "text-2xl font-bold leading-tight tracking-[-0.015em] text-ink [text-wrap:balance]"}
        >
          {total > 1 ? (
            <span className="sr-only">
              Chapter {position} of {total}:{" "}
            </span>
          ) : null}
          {title}
        </h2>
        {/* Heading materi digeser dua level agar berada di bawah h1 halaman dan h2 judul bab. */}
        <RoomMaterial
          content={chapter?.content ?? ""}
          format={chapter?.contentFormat ?? "HTML"}
          headingOffset={2}
          className={titleHidden ? undefined : "mt-4"}
          fallback={
            <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-paper/60 px-4 py-3.5 text-sm leading-relaxed text-ink-2">
              This chapter has no material yet.
              {tasks ? " Its tasks are below." : hasNext ? " Continue with the next chapter." : ""}
            </p>
          }
        />
      </div>

      {tasks ? <div className="border-t border-line">{tasks}</div> : null}

      {hasPrevious || hasNext || afterMaterial ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
          {hasPrevious ? (
            <Link href={chapterHref(slug, index)} className="btn-secondary">
              <BackArrow />
              Previous chapter
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {hasNext ? (
            <Link href={chapterHref(slug, index + 2)} className={forwardClass}>
              Next chapter
              <ForwardArrow />
            </Link>
          ) : afterMaterial ? (
            <Link href={afterMaterial.href} className={afterMaterial.direction === "forward" ? forwardClass : "btn-secondary"}>
              {afterMaterial.direction === "back" ? <BackArrow /> : null}
              {afterMaterial.label}
              {afterMaterial.direction === "forward" ? <ForwardArrow /> : null}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
