"use client";

import { useEffect, useState } from "react";

type SectionId = "material" | "tasks" | "quiz";

/** Seksi di kolom utama yang diikuti saat halaman digulir; Quiz adalah lompatan ke tombol quiz di kolom samping. */
const SPIED: SectionId[] = ["material", "tasks"];

/** Garis baca: seksi dianggap aktif setelah bagian atasnya melewati garis ini (di bawah bar atas dan tab yang menempel). */
const READ_LINE_PX = 140;

/**
 * Tab seksi room (Material / Tasks / Quiz). Tab seksi yang sedang dibaca ditandai cyan dan aria-current;
 * di desktop bar tab menempel di bawah bar atas sehingga posisi baca selalu terlihat.
 */
export function RoomSectionNav({ completedTasks, totalTasks, hasQuiz }: { completedTasks: number; totalTasks: number; hasQuiz: boolean }) {
  const [active, setActive] = useState<SectionId>("material");

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      let current: SectionId = SPIED[0];
      for (const id of SPIED) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= READ_LINE_PX) current = id;
      }
      // Materi pendek: seksi terakhir tidak pernah mencapai garis baca, jadi dasar halaman menandai seksi terakhir.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = SPIED[SPIED.length - 1];
      setActive(current);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const tabClass = (id: SectionId) =>
    `tap-target -mb-px whitespace-nowrap border-b-2 pb-2.5 pt-3 font-display text-sm font-semibold transition-colors ${
      active === id ? "border-cyan-ink text-cyan-ink" : "border-transparent text-ink-2 hover:border-cyan-ink/40 hover:text-cyan-ink"
    }`;

  return (
    // Tanpa overflow-x-auto: wadah gulir memotong outline fokus tautan. Tiga tautan muat di kolom tersempit dan membungkus saat teks diperbesar.
    <nav className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line bg-paper lg:sticky lg:top-14 lg:z-10" aria-label="Room sections">
      <a href="#material" aria-current={active === "material" ? "location" : undefined} className={tabClass("material")}>
        Material
      </a>
      <a href="#tasks" aria-current={active === "tasks" ? "location" : undefined} className={tabClass("tasks")}>
        Tasks{" "}
        <span className={`figure font-medium ${active === "tasks" ? "" : "text-ink-3"}`}>
          {completedTasks}/{totalTasks}
        </span>
      </a>
      {hasQuiz ? (
        <a href="#quiz" className={tabClass("quiz")}>
          Quiz
        </a>
      ) : null}
    </nav>
  );
}
