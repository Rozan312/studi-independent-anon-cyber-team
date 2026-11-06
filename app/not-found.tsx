import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Page not found" };

/**
 * 404 untuk seluruh aplikasi: alamat salah, atau room/path yang belum terbit, diganti, atau dihapus.
 * Memakai kerangka halaman depan (bar atas, pesan, dua aksi, footer), bukan bingkai halaman masuk.
 */
export default function NotFound() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-10 lg:pt-24">
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] font-bold leading-[1.08] tracking-[-0.024em] text-ink [text-wrap:balance] sm:text-[2.75rem]">
            Page not found
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">
            Nothing lives at this address. The room or path may be unpublished, renamed, or removed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary min-h-11 px-5 text-[0.9375rem]">
              Go to your dashboard
            </Link>
            <Link href="/learning-paths" className="btn-secondary min-h-11 px-5 text-[0.9375rem]">
              Browse learning paths
            </Link>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
