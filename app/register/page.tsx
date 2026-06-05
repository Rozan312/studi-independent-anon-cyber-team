import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const isLocalAuth = isLocalAuthEnabled();

  return (
    <main className="cyber-grid flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold text-slate-50">Anon Cyber Team</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Controlled Intelligence</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Akun baru selalu dimulai sebagai STUDENT. Role admin/instruktur dikelola dari backend.</p>
        <RegisterForm isLocalAuth={isLocalAuth} />
      </section>
    </main>
  );
}
