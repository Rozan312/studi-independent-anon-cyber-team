"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { registerAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";
import { helpClass, inputClass, labelClass } from "@/components/instructor/form-styles";
import { SubmitButton } from "@/components/ui/submit-button";

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

  if (fullName.length < 2) return "Enter your full name (at least 2 characters).";
  if (fullName.length > 120) return "Full name must be 120 characters or fewer.";
  if (username.length < 3) return "Choose a username with at least 3 characters.";
  if (username.length > 32) return "Choose a username with 32 characters or fewer.";
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Usernames can only use letters, numbers, underscores, and hyphens.";
  if (!isLocalAuth && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address, like name@example.com.";
  if (!password) return "Choose a password.";
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password.length > 128) return "Use 128 characters or fewer for your password.";

  return null;
}

export function RegisterForm({ isLocalAuth, nextPath = null }: { isLocalAuth: boolean; nextPath?: string | null }) {
  // Kegagalan dari server (email sudah terdaftar, username terpakai) kembali sebagai state, bukan halaman error.
  // Error cek di browser didahulukan; tanpa itu, hasil server terakhir yang tampil.
  const [clientNotice, setClientNotice] = useState<AuthNoticeState>(null);
  const [serverState, formAction] = useFormState(registerAction, null);
  const notice = clientNotice ?? serverState;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = validateRegister(event.currentTarget, isLocalAuth);
    setClientNotice(message ? { tone: "error", message } : null);
    if (message) event.preventDefault();
  }

  return (
    <>
      <form action={formAction} className="space-y-4" noValidate onSubmit={handleSubmit}>
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <AuthNotice notice={notice} />
        <div>
          <label htmlFor="register-full-name" className={labelClass}>
            Full name
          </label>
          <input id="register-full-name" className={inputClass} name="fullName" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="register-username" className={labelClass}>
            Username
          </label>
          <input
            id="register-username"
            className={inputClass}
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby="register-username-help"
          />
          <p id="register-username-help" className={helpClass}>
            Letters, numbers, underscores, and hyphens. Shown on the leaderboard.
          </p>
        </div>
        {isLocalAuth ? null : (
          <div>
            <label htmlFor="register-email" className={labelClass}>
              Email
            </label>
            <input id="register-email" className={inputClass} name="email" type="email" autoComplete="email" />
          </div>
        )}
        <div>
          <label htmlFor="register-password" className={labelClass}>
            Password
          </label>
          <input
            id="register-password"
            className={inputClass}
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="register-password-help"
          />
          <p id="register-password-help" className={helpClass}>
            At least 8 characters.
          </p>
        </div>
        <div className="pt-1">
          <SubmitButton label="Create account" pendingLabel="Creating account…" className="btn-primary min-h-11 w-full text-[0.9375rem]" />
        </div>
      </form>
      {isLocalAuth ? (
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
          <svg viewBox="0 0 16 16" className="mt-px h-4 w-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.2v3.6M8 5.1v.1" strokeLinecap="round" />
          </svg>
          <span>
            <span className="font-semibold text-ink">Local development mode.</span> No email is needed, and new accounts start as members.
          </span>
        </p>
      ) : null}
      <p className="mt-6 border-t border-line pt-5 text-sm">
        <Link href="/login" className="text-link">
          Already a member? Sign in
        </Link>
      </p>
    </>
  );
}
