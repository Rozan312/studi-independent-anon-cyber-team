import Link from "next/link";

export type RoomTab = "material" | "quiz";

/**
 * Tab halaman room (Material / Quiz). Task tampil di bawah bab materinya, jadi tidak punya tab sendiri. Tab hanya
 * dipasang bila room punya quiz: satu tab saja tidak memberi pilihan apa pun. Tab yang sedang dibuka bergaris
 * bawah cyan dengan aria-current="page". Di desktop bar menempel di bawah bar atas (top-14) agar perpindahan tab
 * tetap terjangkau saat membaca bab yang panjang.
 */
export function RoomTabs({ slug, active, hasQuiz }: { slug: string; active: RoomTab; hasQuiz: boolean }) {
  if (!hasQuiz) return null;

  const tabClass = (tab: RoomTab) =>
    `tap-target -mb-px whitespace-nowrap border-b-2 pb-2.5 pt-3 font-display text-sm font-semibold transition-colors ${
      active === tab ? "border-cyan-ink text-cyan-ink" : "border-transparent text-ink-2 hover:border-cyan-ink/40 hover:text-cyan-ink"
    }`;

  return (
    // Tanpa overflow-x-auto: wadah gulir memotong outline fokus tautan. Dua tautan muat di layar tersempit dan membungkus saat teks diperbesar.
    <nav className="mb-6 flex flex-wrap gap-x-6 gap-y-1 border-b border-line bg-paper lg:sticky lg:top-14 lg:z-10" aria-label="Room sections">
      <Link href={`/rooms/${slug}`} aria-current={active === "material" ? "page" : undefined} className={tabClass("material")}>
        Material
      </Link>
      <Link href={`/rooms/${slug}/quiz`} aria-current={active === "quiz" ? "page" : undefined} className={tabClass("quiz")}>
        Quiz
      </Link>
    </nav>
  );
}
