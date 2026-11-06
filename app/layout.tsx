import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

// Satu keluarga Red Hat: Display untuk judul, label, dan angka; Text untuk bacaan panjang; Mono untuk kode dan serial.
const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
});

const redHatText = Red_Hat_Text({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-text"
});

const redHatMono = Red_Hat_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-code"
});

export const metadata: Metadata = {
  title: {
    default: "Anon Cyber Team",
    template: "%s · Anon Cyber Team"
  },
  description: "Self-paced cybersecurity learning paths, rooms, tasks, and quizzes by the Anon Cyber Team community."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: atribut data-theme dipasang skrip awal sebelum React hydrate.
    <html lang="en" className={`${redHatDisplay.variable} ${redHatText.variable} ${redHatMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {/* Tema gelap bawaan; pasang tema terang pilihan anggota sebelum halaman tampil agar tidak berkedip. Isi skrip konstan. */}
        <Script id="act-theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("act-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`}
        </Script>
        {/* useSearchParams di RouteProgress butuh batas Suspense agar halaman tetap bisa dirender di server. */}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
