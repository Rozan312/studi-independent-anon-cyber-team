import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-wide text-success">Safe cybersecurity learning</p>
      <h1 className="mt-4 text-4xl font-bold">Studi Independent Anon Cyber Team</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        Backend-first foundation for structured cybersecurity rooms, progress tracking, quizzes, instructor monitoring,
        admin operations, and lab session placeholders.
      </p>
      <div className="mt-8 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white" href="/register">
          Register
        </Link>
        <Link className="rounded-md border border-border px-4 py-2 text-sm font-medium" href="/login">
          Login
        </Link>
      </div>
    </main>
  );
}
