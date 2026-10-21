import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
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
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
