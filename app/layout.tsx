import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studi Independent Anon Cyber Team",
  description: "Interactive, safe cybersecurity learning platform foundation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0e17] text-slate-100 min-h-screen antialiased">{children}</body>
    </html>
  );
}
