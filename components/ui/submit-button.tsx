"use client";

import { useFormStatus } from "react-dom";
import { secondaryButtonClass } from "@/components/instructor/form-styles";

/** Default sekunder: hanya aksi utama satu tampilan yang diberi primaryButtonClass secara eksplisit (satu tombol cyan per tampilan). */
export function SubmitButton({
  label,
  pendingLabel = "Saving…",
  className = secondaryButtonClass,
  disabled = false
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
