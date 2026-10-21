"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { loginAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";
import { inputClass, labelClass } from "@/components/instructor/form-styles";
import { SubmitButton } from "@/components/ui/submit-button";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function validateLogin(form: HTMLFormElement, isLocalAuth: boolean): string | null {
  const formData = new FormData(form);
  const identifier = value(formData, isLocalAuth ? "username" : "email");
  const password = value(formData, "password");

  if (!identifier) return isLocalAuth ? "Enter your username." : "Enter your email address.";
  if (isLocalAuth && identifier.length < 3) return "Usernames have at least 3 characters. Check yours and try again.";
  if (isLocalAuth && identifier.length > 32) return "Usernames have at most 32 characters. Check yours and try again.";
  if (isLocalAuth && !/^[a-zA-Z0-9_-]+$/.test(identifier)) return "Usernames can only use letters, numbers, underscores, and hyphens.";
  if (!isLocalAuth && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return "Enter a valid email address, like name@example.com.";
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Passwords have at least 8 characters. Check yours and try again.";

  return null;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-px h-4 w-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.2v3.6M8 5.1v.1" strokeLinecap="round" />
    </svg>
  );
}

export function LoginForm({
  isLocalAuth,
  initialNotice = null,
  nextPath = null
}: {
  isLocalAuth: boolean;
  initialNotice?: AuthNoticeState;
  nextPath?: string | null;
}) {
  // Kegagalan dari server (kredensial salah, username tidak valid) kembali sebagai state, bukan halaman error.
  // Urutan tampil: error cek di browser, lalu hasil server, lalu pemberitahuan dari URL (mis. tujuan `next`).
  const [clientNotice, setClientNotice] = useState<AuthNoticeState>(null);
  const [serverState, formAction] = useFormState(loginAction, null);
  const notice = clientNotice ?? serverState ?? initialNotice;
  const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = validateLogin(event.currentTarget, isLocalAuth);
    setClientNotice(message ? { tone: "error", message } : null);
    if (message) event.preventDefault();
  }

  return (
    <>
      <form action={formAction} className="space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthNotice notice={notice} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        {isLocalAuth ? (
          <div>
            <label htmlFor="login-username" className={labelClass}>
              Username
            </label>
            <input id="login-username" className={inputClass} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} />
          </div>
        ) : (
          <div>
            <label htmlFor="login-email" className={labelClass}>
              Email
            </label>
            <input id="login-email" className={inputClass} name="email" type="email" autoComplete="email" />
          </div>
        )}
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input id="login-password" className={inputClass} name="password" type="password" autoComplete="current-password" />
        </div>
        <div className="pt-1">
          <SubmitButton label="Sign in" pendingLabel="Signing in…" className="btn-primary min-h-11 w-full text-[0.9375rem]" />
        </div>
      </form>
      {isLocalAuth ? (
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
          <InfoIcon />
          <span>
            <span className="font-semibold text-ink">Local development sign-in.</span> Passwords aren&apos;t checked: enter a username and any
            password of 8 or more characters. A new username creates a member account.
          </span>
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-soft pt-5 text-sm">
        <Link href={registerHref} className="text-link">
          Create an account
        </Link>
        <Link href="/forgot-password" className="text-link">
          Forgot password?
        </Link>
      </div>
    </>
  );
}
