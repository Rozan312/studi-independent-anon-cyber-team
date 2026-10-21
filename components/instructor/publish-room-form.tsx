"use client";

import { useFormState } from "react-dom";
import { publishInstructorRoomAction, type InstructorActionState } from "@/lib/actions/instructor-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: InstructorActionState = {
  tone: "idle",
  message: ""
};

export function PublishRoomForm({ roomId }: { roomId: string }) {
  const [state, formAction] = useFormState(publishInstructorRoomAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="roomId" value={roomId} />
      <SubmitButton label="Publish" pendingLabel="Publishing…" className="btn-secondary btn-sm" />
      <ActionMessage state={state} />
    </form>
  );
}
