"use client";

import { useFormState } from "react-dom";
import { updateUserRoleAction, type AdminActionState } from "@/lib/actions/admin-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AdminActionState = {
  tone: "idle",
  message: ""
};

export function UserRoleForm({
  userId,
  currentRole,
  userName,
  isSelf = false
}: {
  userId: string;
  currentRole: string;
  /** Nama untuk label aksesibel select. */
  userName?: string;
  /** Baris akun admin yang sedang login: role admin sendiri tidak bisa dicabut di sini (dicek juga di server). */
  isSelf?: boolean;
}) {
  const [state, formAction] = useFormState(updateUserRoleAction, initialState);
  const selectId = `role-${userId}`;

  return (
    <form action={formAction} className="w-[15rem] space-y-1.5">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          {userName ? `Role for ${userName}` : "Role"}
        </label>
        <select id={selectId} name="role" defaultValue={currentRole} className="input h-8 w-auto min-w-0 flex-1 py-0 pl-2.5 text-sm">
          <option value="STUDENT">Member</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <SubmitButton label="Save role" className="btn-secondary btn-sm" />
      </div>
      {isSelf ? <p className="text-xs leading-snug text-ink-3">You can&apos;t remove your own admin role. Another admin can change it.</p> : null}
      <ActionMessage state={state} />
    </form>
  );
}
