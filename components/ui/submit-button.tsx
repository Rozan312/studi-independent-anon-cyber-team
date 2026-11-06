"use client";

import { useFormStatus } from "react-dom";
import { secondaryButtonClass } from "@/components/instructor/form-styles";

/** Default sekunder: hanya aksi utama satu tampilan yang diberi primaryButtonClass secara eksplisit (satu tombol cyan per tampilan). */
export function SubmitButton({
  label,
  pendingLabel = "Saving…",
  className = secondaryButtonClass,
  disabled = false,
  describedBy
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  /** Id teks yang menjelaskan tombol, misalnya alasan tombol nonaktif. */
  describedBy?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      aria-describedby={describedBy}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
