"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PublicShell } from "@/components/public-shell";

/**
 * Error boundary semua halaman: pesan jujur, tombol coba lagi, dan jalan pulang ke dashboard.
 * Memakai kerangka halaman depan (bar atas, pesan, dua aksi, footer), bukan bingkai halaman masuk.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-10 lg:pt-24">
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] font-bold leading-[1.08] tracking-[-0.024em] text-ink [text-wrap:balance] sm:text-[2.75rem]">
            This page didn&apos;t load
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">
            Something failed on the server while loading it. Try again, or head back to your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-primary min-h-11 px-5 text-[0.9375rem]">
              Try again
            </button>
            <Link href="/dashboard" className="btn-secondary min-h-11 px-5 text-[0.9375rem]">
              Go to your dashboard
            </Link>
          </div>
          {/* Digest dari Next.js mencocokkan error ini dengan log server bila anggota melapor ke instruktur:
              satu baris label/nilai bergaris, label kiri dan nilai kanan. */}
          {error.digest ? (
            <dl className="mt-10 border-y border-line text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <dt className="field-label">Error reference</dt>
                <dd className="min-w-0 break-all font-mono text-ink-2">{error.digest}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}
