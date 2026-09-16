"use client";

import { useFormState } from "react-dom";
import type { ActionMessageState } from "@/components/ui/action-message";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ghostButtonClass, idleActionState, primaryButtonClass } from "@/components/instructor/form-styles";

type ToggleAction = (state: ActionMessageState, formData: FormData) => Promise<ActionMessageState>;

/**
 * Tombol publish/unpublish generik. `action` adalah server action yang membaca
 * `idField` dan `isPublished` dari FormData.
 */
export function PublishToggleForm({
  action,
  idField,
  id,
  isPublished,
  disabled = false,
  compact = false
}: {
  action: ToggleAction;
  idField: "roomId" | "pathId";
  id: string;
  isPublished: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, formAction] = useFormState(action, idleActionState);

  return (
    <form action={formAction} className={compact ? "flex flex-col items-end gap-2" : "space-y-2"}>
      <input type="hidden" name={idField} value={id} />
      <input type="hidden" name="isPublished" value={String(!isPublished)} />
      <SubmitButton
        label={isPublished ? "Unpublish" : "Publish"}
        pendingLabel="Memproses..."
        className={isPublished ? ghostButtonClass : primaryButtonClass}
        disabled={disabled}
      />
      <ActionMessage state={state} />
    </form>
  );
}
