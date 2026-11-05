"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ProgressState = "idle" | "loading" | "done";

/**
 * Indikator loading antarhalaman: garis cyan tipis di tepi atas selama halaman berikutnya dirender server.
 * Next 14 tidak punya event router, jadi navigasi dideteksi dari klik link internal dan back/forward,
 * lalu dianggap selesai saat pathname/search berubah. Garis baru muncul setelah 150 ms (navigasi cepat tidak
 * berkedip) dan hilang sendiri setelah 8 detik bila navigasi dibatalkan atau gagal.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProgressState>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
    const start = () => {
      clear();
      timers.current.push(window.setTimeout(() => setState("loading"), 150));
      timers.current.push(window.setTimeout(() => setState("idle"), 8000));
    };
    // Fase capture: next/link memanggil preventDefault di handler-nya sendiri, jadi klik dibaca lebih dulu.
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      clear();
    };
  }, []);

  useEffect(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setState((current) => (current === "loading" ? "done" : "idle"));
    const reset = window.setTimeout(() => setState("idle"), 400);
    return () => window.clearTimeout(reset);
  }, [pathname, searchParams]);

  return (
    <>
      <div aria-hidden="true" className={`route-progress ${state === "idle" ? "" : `route-progress-${state}`}`} />
      <p role="status" className="sr-only">
        {state === "loading" ? "Loading page" : ""}
      </p>
    </>
  );
}
