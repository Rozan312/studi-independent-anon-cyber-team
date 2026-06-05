"use client";

import { useFormState, useFormStatus } from "react-dom";
import { publishInstructorRoomAction, type InstructorActionState } from "@/lib/actions/instructor-actions";
import { ActionMessage } from "@/components/ui/action-message";

const initialState: InstructorActionState = {
  tone: "idle",
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-bold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Publishing..." : "Publish"}
    </button>
  );
}

export function PublishRoomForm({ roomId }: { roomId: string }) {
  const [state, formAction] = useFormState(publishInstructorRoomAction, initialState);

  return (
    <form action={formAction} className="space-y-2 text-right">
      <input type="hidden" name="roomId" value={roomId} />
      <SubmitButton />
      <ActionMessage state={state} />
    </form>
  );
}
