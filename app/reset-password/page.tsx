import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

export default function ResetPasswordPage() {
  const isLocalAuth = isLocalAuthEnabled();

  return (
    <main className="cyber-grid flex min-h-screen items-center justify-center bg-background px-6 text-slate-100">
      <section className="w-full max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Credential Update</p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Validasi password ditampilkan sebagai notifikasi UI, bukan pesan bawaan browser.
        </p>
        <ResetPasswordForm isLocalAuth={isLocalAuth} />
        <Link className="mt-4 inline-block text-sm text-slate-300 hover:text-primary" href="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
