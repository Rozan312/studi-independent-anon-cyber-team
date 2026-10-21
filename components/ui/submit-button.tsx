"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClass } from "@/components/instructor/form-styles";

export function SubmitButton({
  label,
  pendingLabel = "Saving…",
  className = primaryButtonClass,
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
