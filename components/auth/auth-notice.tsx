"use client";

export type AuthNoticeState = {
  tone: "error" | "info";
  message: string;
} | null;

export function AuthNotice({ notice }: { notice: AuthNoticeState }) {
  if (!notice) return null;

  const className =
    notice.tone === "error"
      ? "border-red-400/40 bg-red-500/10 text-red-100"
      : "border-primary/40 bg-primary/10 text-blue-100";

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${className}`} role={notice.tone === "error" ? "alert" : "status"}>
      {notice.message}
    </div>
  );
}
