import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

export default function ForgotPasswordPage() {
  const isLocalAuth = isLocalAuthEnabled();

  return (
    <main className="cyber-grid flex min-h-screen items-center justify-center bg-background px-6 text-slate-100">
      <section className="w-full max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Account Recovery</p>
        <h1 className="mt-3 text-3xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Struktur flow sudah siap untuk Supabase. Mode local menampilkan status tanpa mengirim email.
        </p>
        <ForgotPasswordForm isLocalAuth={isLocalAuth} />
        <Link className="mt-4 inline-block text-sm text-slate-300 hover:text-primary" href="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
