/** Kelas Tailwind bersama untuk form (authoring instruktur/admin, auth, task). Definisi dasarnya ada di app/globals.css. */
export const inputClass = "input mt-1.5";

export const labelClass = "block text-sm font-semibold text-ink";

/** Teks bantuan di bawah field. */
export const helpClass = "mt-1 text-xs leading-relaxed text-ink-3";

export const primaryButtonClass = "btn-primary";

export const secondaryButtonClass = "btn-secondary";

export const ghostButtonClass = "btn-secondary btn-sm";

export const dangerButtonClass = "btn-danger btn-sm";

export const panelClass = "sheet p-5 md:p-6";

export const idleActionState = { tone: "idle" as const, message: "" };
