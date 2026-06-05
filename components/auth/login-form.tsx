"use client";

import Link from "next/link";
import { useState } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function validateLogin(form: HTMLFormElement, isLocalAuth: boolean): string | null {
  const formData = new FormData(form);
  const identifier = value(formData, isLocalAuth ? "username" : "email");
  const password = value(formData, "password");

  if (!identifier) return isLocalAuth ? "Masukkan username terlebih dahulu." : "Masukkan email terlebih dahulu.";
  if (isLocalAuth && identifier.length < 3) return "Username minimal 3 karakter.";
  if (!isLocalAuth && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return "Format email belum valid.";
  if (!password) return "Masukkan password terlebih dahulu.";
  if (password.length < 8) return "Password minimal 8 karakter.";

  return null;
}

export function LoginForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [notice, setNotice] = useState<AuthNoticeState>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = validateLogin(event.currentTarget, isLocalAuth);
    if (!message) return;

    event.preventDefault();
    setNotice({ tone: "error", message });
  }

  return (
    <>
      <form action={loginAction} className="glass-panel mt-6 space-y-4 rounded-lg p-6" noValidate onSubmit={handleSubmit}>
        <AuthNotice notice={notice} />
        {isLocalAuth ? (
          <label className="block text-sm">
            Username
            <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="username" autoComplete="username" />
          </label>
        ) : (
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="email" type="email" autoComplete="email" />
          </label>
        )}
        <label className="block text-sm">
          Password
          <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="password" type="password" autoComplete="current-password" />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(77,142,255,0.22)] transition hover:bg-blue-500" type="submit">
          Login
        </button>
      </form>
      {isLocalAuth ? (
        <p className="mt-3 text-xs text-slate-400">
          Local mode: gunakan username dan password minimal 8 karakter. User baru default STUDENT.
        </p>
      ) : null}
      <div className="mt-4 flex justify-between text-sm text-slate-300">
        <Link href="/register">Create account</Link>
        <Link href="/forgot-password">Forgot password</Link>
      </div>
    </>
  );
}
