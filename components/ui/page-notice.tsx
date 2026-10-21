export type PageNoticeTone = "info" | "warning" | "error" | "success";

const toneClass: Record<PageNoticeTone, string> = {
  info: "border-line bg-well text-ink",
  warning: "border-amber/30 bg-amber-soft text-ink",
  error: "border-red/30 bg-red-soft text-ink",
  success: "border-green/30 bg-green-soft text-ink"
};

const markClass: Record<PageNoticeTone, string> = {
  info: "text-ink-2",
  warning: "text-amber",
  error: "text-red",
  success: "text-green"
};

function NoticeIcon({ tone }: { tone: PageNoticeTone }) {
  if (tone === "success") {
    return <path d="m5.5 10.5 3 3 6-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (tone === "info") {
    return <path d="M10 9v5M10 6.2v.1" strokeWidth="1.8" strokeLinecap="round" />;
  }
  return <path d="M10 5.5v5.5M10 13.8v.1" strokeWidth="1.8" strokeLinecap="round" />;
}

export function PageNotice({
  tone = "info",
  title,
  message,
  className = ""
}: {
  tone?: PageNoticeTone;
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-sheet border px-4 py-3 text-sm ${toneClass[tone]} ${className}`}
    >
      <svg viewBox="0 0 20 20" className={`mt-0.5 h-5 w-5 shrink-0 ${markClass[tone]}`} fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" strokeWidth="1.5" />
        <NoticeIcon tone={tone} />
      </svg>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={title ? "mt-0.5 text-ink-2" : ""}>{message}</p>
      </div>
    </div>
  );
}
