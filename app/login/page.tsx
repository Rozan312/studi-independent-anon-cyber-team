import type { Metadata } from "next";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { resolveNextPath } from "@/lib/auth/safe-redirect";
import { AuthFrame } from "@/components/auth/auth-frame";
import { LoginForm } from "@/components/auth/login-form";
import type { AuthNoticeState } from "@/components/auth/auth-notice";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildNotice(params: SearchParams, nextPath: string | null): AuthNoticeState {
  const error = firstValue(params, "error");

  if (error === "missing-profile") {
    return {
      tone: "error",
      message: "We found your session, but no member profile exists for it yet. Sign in again, or ask an admin for help."
    };
  }

  if (firstValue(params, "registered") === "1") {
    return { tone: "success", message: "Account created. Confirm your email if we asked you to, then sign in." };
  }

  if (firstValue(params, "reset") === "sent") {
    return { tone: "info", message: "Reset link sent. Check your email for the link to set a new password." };
  }

  if (firstValue(params, "password") === "updated") {
    return { tone: "success", message: "Password updated. Sign in with your new password." };
  }

  if (nextPath) {
    return { tone: "info", message: `Sign in to open ${nextPath}. You'll go straight there afterwards.` };
  }

  return null;
}

export default function LoginPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const isLocalAuth = isLocalAuthEnabled();
  const rawNext = firstValue(searchParams, "next");
  const nextPath = rawNext ? resolveNextPath(rawNext) : null;
  const safeNext = nextPath && nextPath !== "/dashboard" ? nextPath : null;
  const notice = buildNotice(searchParams, safeNext);

  return (
    <AuthFrame title="Sign in" description="Pick up your rooms, tasks, and quizzes where you left off.">
      <LoginForm isLocalAuth={isLocalAuth} initialNotice={notice} nextPath={safeNext} />
    </AuthFrame>
  );
}
