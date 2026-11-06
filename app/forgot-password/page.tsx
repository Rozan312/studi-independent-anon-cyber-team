import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  const isLocalAuth = isLocalAuthEnabled();

  return (
    <AuthFrame
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a link to set a new password."
    >
      <ForgotPasswordForm isLocalAuth={isLocalAuth} />
      <p className="mt-6 border-t border-line pt-5 text-sm">
        <Link className="text-link" href="/login">
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
