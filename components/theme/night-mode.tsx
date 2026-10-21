"use client";

import { useEffect, useState } from "react";

/** Kunci localStorage preferensi tema; dibaca juga oleh skrip awal di app/layout.tsx sebelum halaman tampil. */
export const NIGHT_MODE_KEY = "act-night-mode";
const CHANGE_EVENT = "act-theme-change";

function isNight() {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "night";
}

/** Status night mode yang tersinkron antar tombol (rail, bar atas ponsel, halaman lab). */
export function useNightMode() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(isNight());
    const sync = () => setNight(isNight());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle() {
    const next = !isNight();
    const root = document.documentElement;
    if (next) root.dataset.theme = "night";
    else delete root.dataset.theme;
    try {
      localStorage.setItem(NIGHT_MODE_KEY, String(next));
    } catch {
      // Penyimpanan lokal tidak tersedia: tema tetap berganti untuk halaman ini saja.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { night, toggle };
}

function ThemeIcon({ night, className = "h-4 w-4" }: { night: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {night ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </>
      ) : (
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      )}
    </svg>
  );
}

/**
 * Tombol night mode.
 * - "button": tombol sekunder berlabel (header halaman lab).
 * - "rail": baris menu kiri, label memudar saat rail diciutkan.
 * - "icon": tombol ikon untuk bar atas ponsel.
 */
export function NightModeToggle({ variant = "button", collapsed = false }: { variant?: "button" | "rail" | "icon"; collapsed?: boolean }) {
  const { night, toggle } = useNightMode();

  if (variant === "icon") {
    return (
      <button type="button" onClick={toggle} aria-pressed={night} aria-label="Night mode" title="Night mode" className="btn-secondary btn-sm px-2.5">
        <ThemeIcon night={night} />
      </button>
    );
  }

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={night}
        aria-label={collapsed ? "Night mode" : undefined}
        title={collapsed ? "Night mode" : undefined}
        className={`mx-3 mb-1 flex min-h-9 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-sm text-ink-2 transition-[padding,background-color,color] duration-300 ease-out hover:bg-sheet/60 hover:text-ink motion-reduce:transition-none ${
          collapsed ? "px-[17px]" : "px-3"
        }`}
      >
        <span className={night ? "text-cyan-ink" : "text-ink-3"}>
          <ThemeIcon night={night} className="h-[18px] w-[18px]" />
        </span>
        <span className={`flex flex-1 items-center justify-between gap-2 transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={collapsed || undefined}>
          Night mode
          {/* Sakelar visual; status sebenarnya diumumkan lewat aria-pressed pada tombol. */}
          <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${night ? "bg-cyan" : "bg-line-strong/70"}`} aria-hidden="true">
            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-sheet shadow-sheet transition-[left] duration-200 ${night ? "left-3.5" : "left-0.5"}`} />
          </span>
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={night} className={`btn-secondary ${night ? "border-cyan-ink/50 bg-cyan-soft" : ""}`}>
      <ThemeIcon night={night} />
      Night mode
    </button>
  );
}
