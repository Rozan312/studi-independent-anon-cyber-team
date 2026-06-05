export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass-panel rounded-xl p-5 hover:border-primary/40 transition-all duration-300 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div>
        {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "border-slate-700 bg-slate-800/40 text-slate-400",
    primary: "border-primary-container/30 bg-primary-container/10 text-blue-300 shadow-[0_0_10px_rgba(77,142,255,0.06)]",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(78,222,163,0.06)]",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.06)]",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.06)]"
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${toneClass}`}>
      {tone === "success" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {tone === "primary" && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
      {tone === "warning" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
      {tone === "danger" && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />}
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/45 border border-white/[0.04]">
      <div className="h-full rounded-full bg-primary-container shadow-[0_0_12px_rgba(77,142,255,0.35)] transition-all duration-500" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
