export type PageNoticeTone = "info" | "warning" | "error" | "success";

const toneClass: Record<PageNoticeTone, string> = {
  info: "border-primary/30 bg-primary/10 text-blue-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-100",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
};

const dotClass: Record<PageNoticeTone, string> = {
  info: "bg-blue-300",
  warning: "bg-amber-300",
  error: "bg-rose-300",
  success: "bg-emerald-300"
};

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
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${toneClass[tone]} ${className}`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass[tone]}`} />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className={title ? "mt-0.5 text-xs opacity-90" : ""}>{message}</p>
      </div>
    </div>
  );
}
