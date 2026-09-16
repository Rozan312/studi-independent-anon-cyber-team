/** Kelas Tailwind bersama untuk form authoring instruktur/admin. */
export const inputClass =
  "focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-400";

export const primaryButtonClass =
  "rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButtonClass =
  "rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50";

export const panelClass = "glass-panel rounded-xl p-5 md:p-6";

export const idleActionState = { tone: "idle" as const, message: "" };
