import type { Metadata } from "next";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { resolveNextPath } from "@/lib/auth/safe-redirect";
import { AuthFrame } from "@/components/auth/auth-frame";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Record<string, string | string[] | undefined>;

export default function RegisterPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const isLocalAuth = isLocalAuthEnabled();
  const rawNext = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const resolvedNext = rawNext ? resolveNextPath(rawNext) : null;
  const nextPath = resolvedNext && resolvedNext !== "/dashboard" ? resolvedNext : null;

  return (
    <AuthFrame
      title="Create your account"
      description="New accounts start as members. Instructor and admin roles are granted by a platform admin."
    >
      <RegisterForm isLocalAuth={isLocalAuth} nextPath={nextPath} />
    </AuthFrame>
  );
}
