export type PageNoticeTone = "info" | "warning" | "error" | "success";

/**
 * Pemberitahuan halaman: panel rata bersambungan tipis seperti .sheet, diberi rona status yang tipis.
 * Latar soft dipakai 55% agar di tema gelap tidak menjadi blok cokelat/merah pekat; ikon memegang warna penuhnya.
 * Info netral (well), karena cyan disimpan untuk aksi dan item aktif.
 */
const toneClass: Record<PageNoticeTone, string> = {
  info: "border-line-strong bg-well",
  warning: "border-amber/35 bg-amber-soft/55",
  error: "border-red/35 bg-red-soft/55",
  success: "border-green/35 bg-green-soft/55"
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
      className={`flex items-start gap-3 rounded-sheet border px-4 py-3.5 text-sm text-ink sm:px-5 ${toneClass[tone]} ${className}`}
    >
      <svg viewBox="0 0 20 20" className={`mt-px h-5 w-5 shrink-0 ${markClass[tone]}`} fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" strokeWidth="1.5" />
        <NoticeIcon tone={tone} />
      </svg>
      <div className="min-w-0">
        {title ? <p className="font-display font-semibold leading-snug text-ink">{title}</p> : null}
        <p className={title ? "mt-0.5 max-w-[75ch] leading-relaxed text-ink-2" : "max-w-[75ch] leading-relaxed"}>{message}</p>
      </div>
    </div>
  );
}
