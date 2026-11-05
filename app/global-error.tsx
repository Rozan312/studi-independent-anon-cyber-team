"use client";

import "./globals.css";

/** Cadangan terakhir bila root layout sendiri gagal: tanpa layout, jadi html/body dan gaya dimuat di sini. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Unavailable · Anon Cyber Team</title>
      </head>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
          <div className="sheet p-6 sm:p-8">
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.018em] text-ink">Anon Cyber Team didn&apos;t load</h1>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
              The app hit an error before any page could open. Try again in a moment.
            </p>
            <button type="button" onClick={reset} className="btn-primary mt-6">
              Try again
            </button>
            {error.digest ? (
              <p className="mt-5 text-xs text-ink-3">
                Error reference: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
