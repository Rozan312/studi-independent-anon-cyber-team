"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createAnnouncementAction,
  publishAnnouncementAction,
  updateAnnouncementAction,
  type AdminActionState
} from "@/lib/actions/admin-actions";
import { ActionMessage } from "@/components/ui/action-message";

const initialState: AdminActionState = {
  tone: "idle",
  message: ""
};

function SubmitButton({ label, pendingLabel = "Saving..." }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function AudienceSelect({ defaultValue = "ALL" }: { defaultValue?: string }) {
  return (
    <select
      name="audience"
      defaultValue={defaultValue}
      className="focus-ring rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 py-2 text-sm text-slate-100 outline-none"
    >
      <option value="ALL">ALL</option>
      <option value="STUDENT">STUDENT</option>
      <option value="INSTRUCTOR">INSTRUCTOR</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}

export function AnnouncementCreateForm() {
  const [state, formAction] = useFormState(createAnnouncementAction, initialState);

  return (
    <form action={formAction} noValidate className="glass-panel rounded-xl p-5">
      <div className="mb-4 border-b border-white/[0.06] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">new bulletin</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">Draft Announcement</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 md:col-span-2">
          Title
          <input
            name="title"
            placeholder="Platform maintenance notice"
            className="focus-ring mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none placeholder:text-slate-600"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Audience
          <div className="mt-2">
            <AudienceSelect />
          </div>
        </label>
        <label className="flex items-end gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          <input name="isPublished" type="checkbox" className="mb-2 h-4 w-4 accent-primary" />
          Publish immediately
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 md:col-span-2">
          Content
          <textarea
            name="content"
            rows={4}
            placeholder="Write a short platform update for learners."
            className="focus-ring mt-2 w-full resize-none rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none placeholder:text-slate-600"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Create Announcement" />
      </div>
    </form>
  );
}

export function AnnouncementEditForm({
  announcement
}: {
  announcement: {
    id: string;
    title: string;
    content: string;
    audience: string;
    isPublished: boolean;
  };
}) {
  const [updateState, updateAction] = useFormState(updateAnnouncementAction, initialState);
  const [publishState, publishAction] = useFormState(publishAnnouncementAction, initialState);

  return (
    <div className="space-y-3">
      <form action={updateAction} noValidate className="space-y-3">
        <input type="hidden" name="announcementId" value={announcement.id} />
        <input type="hidden" name="isPublished" value={String(announcement.isPublished)} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
          <input
            name="title"
            defaultValue={announcement.title}
            className="focus-ring rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 py-2 text-sm font-semibold text-slate-100 outline-none"
          />
          <AudienceSelect defaultValue={announcement.audience} />
        </div>
        <textarea
          name="content"
          rows={3}
          defaultValue={announcement.content}
          className="focus-ring w-full resize-none rounded-lg border border-white/[0.08] bg-[#0b111d] px-3 py-2 text-sm text-slate-100 outline-none"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ActionMessage state={updateState} />
          <SubmitButton label="Save Changes" />
        </div>
      </form>

      <form action={publishAction} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input type="hidden" name="announcementId" value={announcement.id} />
        <input type="hidden" name="isPublished" value={String(!announcement.isPublished)} />
        <ActionMessage state={publishState} />
        <button
          type="submit"
          className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05]"
        >
          {announcement.isPublished ? "Unpublish" : "Publish"}
        </button>
      </form>
    </div>
  );
}
