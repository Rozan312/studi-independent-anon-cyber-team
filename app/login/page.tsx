import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { resolveNextPath } from "@/lib/auth/safe-redirect";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import type { AuthNoticeState } from "@/components/auth/auth-notice";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildNotice(params: SearchParams, nextPath: string | null): AuthNoticeState {
  const error = firstValue(params, "error");

  if (error === "missing-profile") {
    return {
      tone: "error",
      message: "Sesi ditemukan tetapi profil belum ada di database. Login ulang atau hubungi admin."
    };
  }

  if (firstValue(params, "registered") === "1") {
    return { tone: "info", message: "Akun berhasil dibuat. Cek email konfirmasi bila diminta, lalu login." };
  }

  if (firstValue(params, "reset") === "sent") {
    return { tone: "info", message: "Permintaan reset password sudah dikirim. Periksa email Anda." };
  }

  if (firstValue(params, "password") === "updated") {
    return { tone: "info", message: "Password berhasil diperbarui. Silakan login kembali." };
  }

  if (nextPath) {
    return { tone: "info", message: `Login diperlukan untuk membuka ${nextPath}. Anda akan diarahkan ke sana setelah masuk.` };
  }

  return null;
}

export default function LoginPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const isLocalAuth = isLocalAuthEnabled();
  const rawNext = firstValue(searchParams, "next");
  const nextPath = rawNext ? resolveNextPath(rawNext) : null;
  const safeNext = nextPath && nextPath !== "/dashboard" ? nextPath : null;
  const notice = buildNotice(searchParams, safeNext);

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
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Login</h1>
        <p className="mt-2 text-sm text-slate-400">Masuk ke learning console untuk melanjutkan room, quiz, dan lab aman.</p>
        <LoginForm isLocalAuth={isLocalAuth} initialNotice={notice} nextPath={safeNext} />
      </section>
    </main>
  );
}
