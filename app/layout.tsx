import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

// Archivo variabel (berat + lebar): label kolom memakai versi condensed lewat font-stretch.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo"
});

const jetbrainsMono = JetBrains_Mono({
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
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {/* Pasang night mode sebelum halaman tampil agar tidak ada kilatan tema terang. Isi skrip konstan. */}
        <Script id="act-theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("act-night-mode")==="true")document.documentElement.dataset.theme="night"}catch(e){}`}
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
