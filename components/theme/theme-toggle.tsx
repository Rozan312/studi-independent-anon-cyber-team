"use client";

import { useEffect, useState } from "react";

/** Kunci localStorage preferensi tema; dibaca juga oleh skrip awal di app/layout.tsx sebelum halaman tampil. */
export const THEME_KEY = "act-theme";
const CHANGE_EVENT = "act-theme-change";

function isLight() {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "light";
}

/** Tema gelap bawaan; status tema terang tersinkron antar tombol (rail, drawer, bar atas ponsel, bar halaman publik, halaman auth). */
export function useLightMode() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(isLight());
    const sync = () => setLight(isLight());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle() {
    const next = !isLight();
    const root = document.documentElement;
    if (next) root.dataset.theme = "light";
    else delete root.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next ? "light" : "dark");
    } catch {
      // Penyimpanan lokal tidak tersedia: tema tetap berganti untuk halaman ini saja.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { light, toggle };
}

// Ikon matahari tetap untuk "Light mode"; status nyala ditunjukkan sakelar/warna cyan, bukan dengan mengganti ikon.
function ThemeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

/**
 * Tombol tema terang (tema gelap adalah bawaan).
 * - "rail": baris dengan sakelar di rail, drawer ponsel, dan kolom merek halaman auth; label memudar saat rail diciutkan.
 * - "icon": tombol ikon untuk bar atas ponsel, bar halaman publik, dan bar atas halaman auth di layar kecil.
 */
export function ThemeToggle({ variant, collapsed = false }: { variant: "rail" | "icon"; collapsed?: boolean }) {
  const { light, toggle } = useLightMode();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={light}
        aria-label="Light mode"
        title="Light mode"
        className={`btn-secondary btn-sm px-2.5 coarse:min-w-11 ${light ? "border-cyan-ink/50 bg-cyan-soft text-cyan-ink" : ""}`}
      >
        <ThemeIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={light}
      aria-label={collapsed ? "Light mode" : undefined}
      title={collapsed ? "Light mode" : undefined}
      className={`mx-3 mb-1 flex min-h-9 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-sm text-ink-2 transition-[padding,background-color,color] duration-300 ease-out hover:bg-well/70 hover:text-ink motion-reduce:transition-none coarse:min-h-11 ${
        collapsed ? "px-[17px]" : "px-3"
      }`}
    >
      <span className={light ? "text-cyan-ink" : "text-ink-3"}>
        <ThemeIcon className="h-[18px] w-[18px]" />
      </span>
      <span className={`flex flex-1 items-center justify-between gap-2 transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={collapsed || undefined}>
        Light mode
        {/* Sakelar visual; status sebenarnya diumumkan lewat aria-pressed pada tombol. */}
        <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${light ? "bg-cyan-ink" : "bg-line-strong"}`} aria-hidden="true">
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-ink transition-[left] duration-200 motion-reduce:transition-none ${light ? "left-3.5 bg-sheet" : "left-0.5"}`} />
        </span>
      </span>
    </button>
  );
}
