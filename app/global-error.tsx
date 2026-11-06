"use client";

import "./globals.css";
import { useEffect } from "react";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import { AuthFrame } from "@/components/auth/auth-frame";
import { THEME_KEY } from "@/components/theme/theme-toggle";

// Root layout tidak ikut dirender di sini, jadi keluarga Red Hat dipasang ulang dengan konfigurasi yang sama dengan app/layout.tsx.
const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const redHatText = Red_Hat_Text({ subsets: ["latin"], display: "swap", variable: "--font-text" });
const redHatMono = Red_Hat_Mono({ subsets: ["latin"], display: "swap", variable: "--font-code" });

/** Cadangan terakhir bila root layout sendiri gagal: tanpa layout, jadi html/body, gaya, font, dan tema dipasang di sini. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Skrip tema awal di root layout tidak berjalan di sini: pasang tema terang pilihan anggota setelah tampil.
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === "light") document.documentElement.dataset.theme = "light";
    } catch {
      // Penyimpanan lokal tidak tersedia: tetap tema gelap bawaan.
    }
  }, []);

  return (
    <html lang="en" className={`${redHatDisplay.variable} ${redHatText.variable} ${redHatMono.variable}`} suppressHydrationWarning>
      <head>
        <title>Unavailable · Anon Cyber Team</title>
      </head>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <AuthFrame title="Anon Cyber Team didn't load" description="The app hit an error before any page could open. Try again in a moment.">
          <button type="button" onClick={reset} className="btn-primary min-h-11 px-5 text-[0.9375rem]">
            Try again
          </button>
          {error.digest ? (
            <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line pt-4 text-xs">
              <span className="field-label">Error reference</span>
              <span className="break-all font-mono text-ink-2">{error.digest}</span>
            </p>
          ) : null}
        </AuthFrame>
      </body>
    </html>
  );
}
