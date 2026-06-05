"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateUserRoleAction, type AdminActionState } from "@/lib/actions/admin-actions";
import { ActionMessage } from "@/components/ui/action-message";

const initialState: AdminActionState = {
  tone: "idle",
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary-container/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Update"}
    </button>
  );
}

export function UserRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [state, formAction] = useFormState(updateUserRoleAction, initialState);

  return (
    <form action={formAction} className="min-w-48 space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center justify-end gap-2">
        <select
          name="role"
          defaultValue={currentRole}
          className="focus-ring rounded-md border border-white/[0.08] bg-[#0b111d] px-2 py-2 text-xs font-semibold text-slate-100 outline-none"
        >
          <option value="STUDENT">STUDENT</option>
          <option value="INSTRUCTOR">INSTRUCTOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <SubmitButton />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}
