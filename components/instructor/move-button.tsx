"use client";

import { useFormStatus } from "react-dom";

/** Tombol ikon naik/turun untuk mengubah urutan; nonaktif dan aria-busy selama action form-nya berjalan agar tidak terkirim dua kali. */
export function MoveButton({
  direction,
  disabled,
  describedBy,
  className = "btn-ghost btn-sm px-2"
}: {
  direction: "up" | "down";
  disabled: boolean;
  describedBy?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const label = direction === "up" ? "Move up" : "Move down";

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-label={label}
      aria-describedby={describedBy}
      title={label}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d={direction === "up" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
