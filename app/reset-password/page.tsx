import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  const isLocalAuth = isLocalAuthEnabled();

  return (
    <AuthFrame title="Set a new password" description="Choose the password you'll use to sign in from now on.">
      <ResetPasswordForm isLocalAuth={isLocalAuth} />
      <p className="mt-6 border-t border-line pt-5 text-sm">
        <Link className="text-link" href="/login">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
