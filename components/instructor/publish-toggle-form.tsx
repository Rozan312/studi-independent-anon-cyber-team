"use client";

import { useFormState } from "react-dom";
import { StatusPill } from "@/components/card";
import type { ActionMessageState } from "@/components/ui/action-message";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleActionState } from "@/components/instructor/form-styles";

type ToggleAction = (state: ActionMessageState, formData: FormData) => Promise<ActionMessageState>;

/**
 * Tombol publish/unpublish generik. `action` adalah server action yang membaca
 * `idField` dan `isPublished` dari FormData. Status saat ini tampil sebagai pill
 * (matikan dengan `showState={false}` bila halaman sudah menampilkannya).
 */
export function PublishToggleForm({
  action,
  idField,
  id,
  isPublished,
  disabled = false,
  compact = false,
  showState = true
}: {
  action: ToggleAction;
  idField: "roomId" | "pathId";
  id: string;
  isPublished: boolean;
  disabled?: boolean;
  compact?: boolean;
  showState?: boolean;
}) {
  const [state, formAction] = useFormState(action, idleActionState);

  return (
    <form action={formAction} className={compact ? "flex flex-col items-end gap-2" : "space-y-2"}>
      <input type="hidden" name={idField} value={id} />
      <input type="hidden" name="isPublished" value={String(!isPublished)} />
      <div className="flex flex-wrap items-center gap-2">
        {showState ? <StatusPill tone={isPublished ? "success" : "neutral"}>{isPublished ? "Published" : "Draft"}</StatusPill> : null}
        <SubmitButton
          label={isPublished ? "Unpublish" : "Publish"}
          pendingLabel={isPublished ? "Unpublishing…" : "Publishing…"}
          className={compact ? "btn-secondary btn-sm" : "btn-secondary"}
          disabled={disabled}
        />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
