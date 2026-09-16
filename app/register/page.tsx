import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { resolveNextPath } from "@/lib/auth/safe-redirect";
import { BrandMark } from "@/components/brand-mark";
import { RegisterForm } from "@/components/auth/register-form";

type SearchParams = Record<string, string | string[] | undefined>;

export default function RegisterPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const isLocalAuth = isLocalAuthEnabled();
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const resolvedNext = rawNext ? resolveNextPath(rawNext) : null;
  const nextPath = resolvedNext && resolvedNext !== "/dashboard" ? resolvedNext : null;

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
        <RegisterForm isLocalAuth={isLocalAuth} nextPath={nextPath} />
      </section>
    </main>
  );
}
