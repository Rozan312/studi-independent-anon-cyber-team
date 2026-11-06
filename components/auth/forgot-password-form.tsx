"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { forgotPasswordAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";
import { inputClass, labelClass } from "@/components/instructor/form-styles";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotPasswordForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [clientNotice, setClientNotice] = useState<AuthNoticeState>(
    isLocalAuth
      ? {
          tone: "info",
          message: "Local development mode doesn't send email. To sign in, use your username and any password of at least 8 characters."
        }
      : null
  );
  // Kegagalan pengiriman email reset dari server kembali sebagai state, bukan halaman error.
  const [serverState, formAction] = useFormState(forgotPasswordAction, null);
  // Pemberitahuan dari cek di browser didahulukan; tanpa itu, hasil server terakhir yang tampil.
  const notice = clientNotice ?? serverState;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isLocalAuth) {
      event.preventDefault();
      setClientNotice({
        tone: "info",
        message: "Reset emails are turned off in local development mode. Local accounts accept any password of at least 8 characters."
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      event.preventDefault();
      setClientNotice({ tone: "error", message: "Enter the email address you signed up with." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      event.preventDefault();
      setClientNotice({ tone: "error", message: "Enter a valid email address, like name@example.com." });
      return;
    }

    setClientNotice(null);
  }

  return (
    <form action={formAction} className="space-y-4" noValidate onSubmit={handleSubmit}>
      <AuthNotice notice={notice} />
      <div>
        <label htmlFor="forgot-email" className={labelClass}>
          Email
        </label>
        <input
          id="forgot-email"
          className={inputClass}
          name="email"
          type="email"
          autoComplete="email"
          disabled={isLocalAuth}
          placeholder={isLocalAuth ? "Not used in local development" : "name@example.com"}
        />
      </div>
      <div className="pt-1">
        <SubmitButton
          label="Send reset link"
          pendingLabel="Sending link…"
          disabled={isLocalAuth}
          className="btn-primary min-h-11 w-full text-[0.9375rem]"
        />
      </div>
    </form>
  );
}
