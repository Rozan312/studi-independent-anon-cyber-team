"use client";

import { PageNotice } from "@/components/ui/page-notice";

export type AuthNoticeState = {
  tone: "error" | "info" | "success";
  message: string;
} | null;

export function AuthNotice({ notice }: { notice: AuthNoticeState }) {
  if (!notice) return null;

  return <PageNotice tone={notice.tone} message={notice.message} />;
}
