/** Primitif bersama dunia "Security Paper": lembar, judul seksi, label status, bilah progres, angka bersel. */

export function Card({
  children,
  className = "",
  as: Element = "section"
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return <Element className={`sheet p-5 ${className}`}>{children}</Element>;
}

export function SectionHeader({
  title,
  description,
  action,
  as: Heading = "h2",
  id,
  className = ""
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
  /** Id judul, untuk aria-labelledby pada seksi pembungkus. */
  id?: string;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 ${className}`}>
      <div className="min-w-0">
        <Heading id={id} className="text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
          {title}
        </Heading>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export type StatusTone = "neutral" | "primary" | "success" | "warning" | "danger" | "done";

const statusToneClass: Record<StatusTone, string> = {
  neutral: "border-line bg-well text-ink-2",
  primary: "border-cyan-ink/25 bg-cyan-soft text-cyan-ink",
  success: "border-green/25 bg-green-soft text-green",
  warning: "border-amber/25 bg-amber-soft text-amber",
  danger: "border-red/25 bg-red-soft text-red",
  done: "border-violet/25 bg-violet-soft text-violet"
};

export function StatusPill({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: StatusTone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.08em] ${statusToneClass[tone]} ${className}`}
      style={{ fontStretch: "78%" }}
    >
      {children}
    </span>
  );
}

export type ProgressTone = "violet" | "cyan" | "ink" | "green";

const progressToneClass: Record<ProgressTone, string> = {
  violet: "bg-violet",
  cyan: "bg-cyan",
  ink: "bg-ink",
  green: "bg-green"
};

export function ProgressBar({
  value,
  tone = "violet",
  label = "Progress",
  className = ""
}: {
  value: number;
  tone?: ProgressTone;
  label?: string;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-line-soft ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${progressToneClass[tone]}`} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

/** Angka penting dalam sel bergaris tetap: label kolom, nilai tabular, catatan kecil. */
export function Figure({
  label,
  value,
  unit,
  note,
  size = "md",
  className = ""
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  note?: React.ReactNode;
  /** "sm" untuk nilai berupa kata (misalnya tingkat kesulitan) atau sel sempit. */
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="field-label">{label}</p>
      <p className={`figure mt-1.5 font-bold leading-none text-ink ${size === "sm" ? "text-lg leading-tight" : "text-[1.75rem]"}`}>
        {value}
        {unit ? <span className="ml-1 text-sm font-semibold text-ink-2">{unit}</span> : null}
      </p>
      {note ? <p className="mt-1.5 text-xs text-ink-3">{note}</p> : null}
    </div>
  );
}

/** Kotak kosong yang jujur: menjelaskan kenapa kosong dan apa langkah berikutnya. */
export function EmptyState({ title, message, action }: { title: string; message?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-sheet border border-dashed border-line-strong bg-paper/60 px-5 py-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {message ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">{message}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
