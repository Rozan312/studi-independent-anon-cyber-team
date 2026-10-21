"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { resetPasswordAction } from "@/lib/actions/auth-actions";
import { AuthNotice, type AuthNoticeState } from "@/components/auth/auth-notice";
import { helpClass, inputClass, labelClass } from "@/components/instructor/form-styles";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetPasswordForm({ isLocalAuth }: { isLocalAuth: boolean }) {
  const [clientNotice, setClientNotice] = useState<AuthNoticeState>(
    isLocalAuth
      ? {
          tone: "info",
          message: "Local development mode doesn't store passwords. Sign in with any password of at least 8 characters."
        }
      : null
  );
  // Kegagalan penyimpanan password baru dari server kembali sebagai state, bukan halaman error.
  const [serverState, formAction] = useFormState(resetPasswordAction, null);
  // Pemberitahuan dari cek di browser didahulukan; tanpa itu, hasil server terakhir yang tampil.
  const notice = clientNotice ?? serverState;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isLocalAuth) {
      event.preventDefault();
      setClientNotice({
        tone: "info",
        message: "Password reset is turned off in local development mode."
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!password) {
      event.preventDefault();
      setClientNotice({ tone: "error", message: "Enter a new password." });
      return;
    }

    if (password.length < 8) {
      event.preventDefault();
      setClientNotice({ tone: "error", message: "Use at least 8 characters for your new password." });
      return;
    }

    setClientNotice(null);
  }

  return (
    <form action={formAction} className="space-y-4" noValidate onSubmit={handleSubmit}>
      <AuthNotice notice={notice} />
      <div>
        <label htmlFor="reset-password" className={labelClass}>
          New password
        </label>
        <input
          id="reset-password"
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={isLocalAuth}
          aria-describedby="reset-password-help"
        />
        <p id="reset-password-help" className={helpClass}>
          At least 8 characters.
        </p>
      </div>
      <div className="pt-1">
        <SubmitButton
          label="Save new password"
          pendingLabel="Saving password…"
          disabled={isLocalAuth}
          className="btn-primary min-h-11 w-full text-[0.9375rem]"
        />
      </div>
    </form>
  );
}
