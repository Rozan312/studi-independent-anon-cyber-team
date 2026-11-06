"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = {
  href: string;
  label: string;
  /** Jumlah isi seksi; unit hanya dibacakan pembaca layar ("Material 3 chapters"). */
  count?: number;
  unit?: [string, string];
};

/**
 * Navigasi seksi editor room. Mulai xl berupa kolom vertikal yang menempel di bawah bar atas desktop;
 * di bawah xl menjadi deret tab yang membungkus. Item aktif mengikuti URL dengan gaya item rail
 * (cyan wash + garis tipis cyan), dan Material tetap aktif di halaman bab.
 */
export function RoomEditorNav({
  roomId,
  chapterCount,
  taskCount,
  questionCount,
  status
}: {
  roomId: string;
  chapterCount: number;
  taskCount: number;
  /** Null bila room tidak punya quiz: quiz opsional, jadi item Quiz tampil tanpa angka (bukan "0"). */
  questionCount: number | null;
  /** Penanda terbit/jadwal room, dirender server. */
  status: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/instructor/rooms/${roomId}`;

  const sections: Section[] = [
    { href: base, label: "Details" },
    { href: `${base}/schedule`, label: "Schedule & publishing" },
    { href: `${base}/material`, label: "Material", count: chapterCount, unit: ["chapter", "chapters"] },
    { href: `${base}/tasks`, label: "Tasks", count: taskCount, unit: ["task", "tasks"] },
    { href: `${base}/quiz`, label: "Quiz", count: questionCount ?? undefined, unit: ["question", "questions"] }
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-3 xl:sticky xl:top-[5.5rem] xl:block xl:self-start xl:border-b-0 xl:pb-0">
      <nav aria-label="Room editor sections" className="min-w-0">
        <ul className="flex flex-wrap gap-1 xl:flex-col xl:gap-0.5">
          {sections.map((section) => {
            const active = isActive(section.href);
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-9 items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 text-[0.9375rem] transition-colors coarse:min-h-11 ${
                    active ? "bg-cyan-soft font-semibold text-cyan-ink ring-1 ring-inset ring-cyan-ink/30" : "text-ink-2 hover:bg-well/70 hover:text-ink"
                  }`}
                >
                  <span>{section.label}</span>
                  {section.count !== undefined && section.unit ? (
                    <span className={`figure text-xs font-semibold ${active ? "text-cyan-ink" : "text-ink-3"}`}>
                      {section.count}
                      <span className="sr-only"> {section.count === 1 ? section.unit[0] : section.unit[1]}</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex flex-wrap items-center gap-2 xl:mt-4 xl:border-t xl:border-line xl:px-3 xl:pt-4">{status}</div>
    </div>
  );
}
