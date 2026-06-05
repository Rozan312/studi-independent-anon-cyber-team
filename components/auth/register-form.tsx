"use client";

import Link from "next/link";
import { useState } from "react";
import { registerAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function validateRegister(form: HTMLFormElement, isLocalAuth: boolean): string | null {
  const formData = new FormData(form);
  const fullName = value(formData, "fullName");
  const username = value(formData, "username");
  const email = value(formData, "email");
  const password = value(formData, "password");

  if (fullName.length < 2) return "Nama minimal 2 karakter.";
  if (username.length < 3) return "Username minimal 3 karakter.";
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username hanya boleh memakai huruf, angka, underscore, dan hyphen.";
  if (!isLocalAuth && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email belum valid.";
  if (!password) return "Masukkan password terlebih dahulu.";
  if (password.length < 8) return "Password minimal 8 karakter.";

  return null;
}

export function RegisterForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [notice, setNotice] = useState<AuthNoticeState>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = validateRegister(event.currentTarget, isLocalAuth);
    if (!message) return;

    event.preventDefault();
    setNotice({ tone: "error", message });
  }

  return (
    <>
      <form action={registerAction} className="glass-panel mt-6 space-y-4 rounded-lg p-6" noValidate onSubmit={handleSubmit}>
        <AuthNotice notice={notice} />
        <label className="block text-sm">
          Full name
          <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="fullName" autoComplete="name" />
        </label>
        <label className="block text-sm">
          Username
          <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="username" autoComplete="username" />
        </label>
        {isLocalAuth ? null : (
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="email" type="email" autoComplete="email" />
          </label>
        )}
        <label className="block text-sm">
          Password
          <input className="mt-1 w-full rounded-md border border-border bg-black/25 px-3 py-2 outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(77,142,255,0.16)]" name="password" type="password" autoComplete="new-password" />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(77,142,255,0.22)] transition hover:bg-blue-500" type="submit">
          Register
        </button>
      </form>
      {isLocalAuth ? (
        <p className="mt-3 text-xs text-slate-400">
          Local mode: email tidak diperlukan. Akun baru default STUDENT.
        </p>
      ) : null}
      <Link className="mt-4 inline-block text-sm text-slate-300" href="/login">
        Already have an account?
      </Link>
    </>
  );
}
