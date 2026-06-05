"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";

export function ResetPasswordForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [notice, setNotice] = useState<AuthNoticeState>(
    isLocalAuth
      ? {
          tone: "info",
          message: "Mode local tidak menyimpan password. Gunakan password minimal 8 karakter saat login."
        }
      : null
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isLocalAuth) {
      event.preventDefault();
      setNotice({
        tone: "info",
        message: "Reset password dinonaktifkan di mode local."
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!password) {
      event.preventDefault();
      setNotice({ tone: "error", message: "Masukkan password baru terlebih dahulu." });
      return;
    }

    if (password.length < 8) {
      event.preventDefault();
      setNotice({ tone: "error", message: "Password minimal 8 karakter." });
    }
  }

  return (
    <form action={resetPasswordAction} className="glass-panel mt-6 space-y-4 rounded-lg p-6" noValidate onSubmit={handleSubmit}>
      <AuthNotice notice={notice} />
      <label className="block text-sm">
        New password
        <input
          className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={isLocalAuth}
        />
      </label>
      <button
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(77,142,255,0.22)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isLocalAuth}
      >
        Update password
      </button>
    </form>
  );
}
