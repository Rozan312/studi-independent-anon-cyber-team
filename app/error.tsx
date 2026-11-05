"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthFrame } from "@/components/auth/auth-frame";

/** Error boundary semua halaman: pesan jujur, tombol coba lagi, dan jalan pulang ke dashboard. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthFrame
      title="This page didn't load"
      description="Something failed on the server while loading it. Try again, or head back to your dashboard."
    >
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Go to your dashboard
        </Link>
      </div>
      {/* Digest dari Next.js mencocokkan error ini dengan log server bila anggota melapor ke instruktur. */}
      {error.digest ? (
        <p className="mt-5 text-xs text-ink-3">
          Error reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </AuthFrame>
  );
}
