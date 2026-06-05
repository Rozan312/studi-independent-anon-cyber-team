"use client";

import { useState } from "react";
import { forgotPasswordAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";

export function ForgotPasswordForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [notice, setNotice] = useState<AuthNoticeState>(
    isLocalAuth
      ? {
          tone: "info",
          message: "Mode local tidak mengirim email. Gunakan password minimal 8 karakter saat login."
        }
      : null
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isLocalAuth) {
      event.preventDefault();
      setNotice({
        tone: "info",
        message: "Reset email dinonaktifkan di mode local. Akun local menerima password apa pun selama minimal 8 karakter."
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      event.preventDefault();
      setNotice({ tone: "error", message: "Masukkan email terlebih dahulu." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      event.preventDefault();
      setNotice({ tone: "error", message: "Format email belum valid." });
    }
  }

  return (
    <form action={forgotPasswordAction} className="glass-panel mt-6 space-y-4 rounded-lg p-6" noValidate onSubmit={handleSubmit}>
      <AuthNotice notice={notice} />
      <label className="block text-sm">
        Email
        <input
          className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]"
          name="email"
          type="email"
          autoComplete="email"
          disabled={isLocalAuth}
          placeholder={isLocalAuth ? "Tidak digunakan di mode local" : "nama@domain.com"}
        />
      </label>
      <button
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(77,142,255,0.22)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isLocalAuth}
      >
        Send reset link
      </button>
    </form>
  );
}
