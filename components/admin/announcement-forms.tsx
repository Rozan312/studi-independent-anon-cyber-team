"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  createAnnouncementAction,
  publishAnnouncementAction,
  updateAnnouncementAction,
  type AdminActionState
} from "@/lib/actions/admin-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { checkboxClass, helpClass, inputClass, labelClass, panelClass, primaryButtonClass } from "@/components/instructor/form-styles";

const initialState: AdminActionState = {
  tone: "idle",
  message: ""
};

function AudienceSelect({ id, defaultValue = "ALL" }: { id: string; defaultValue?: string }) {
  return (
    <select id={id} name="audience" defaultValue={defaultValue} className={inputClass}>
      <option value="ALL">Everyone</option>
      <option value="STUDENT">Members</option>
      <option value="INSTRUCTOR">Instructors</option>
      <option value="ADMIN">Admins</option>
    </select>
  );
}

export function AnnouncementCreateForm() {
  const [state, formAction] = useFormState(createAnnouncementAction, initialState);

  return (
    <form action={formAction} noValidate className={`${panelClass} space-y-4`} aria-labelledby="new-announcement-heading">
      <div>
        <h2 id="new-announcement-heading" className="text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
          New announcement
        </h2>
        <p className="mt-1 text-sm text-ink-2">Once published, it shows under Announcements on the dashboard of the chosen audience.</p>
      </div>

      <div>
        <label htmlFor="new-announcement-title" className={labelClass}>
          Title
        </label>
        <input id="new-announcement-title" name="title" placeholder="Maintenance on Saturday evening" className={inputClass} />
      </div>

      <div>
        <label htmlFor="new-announcement-audience" className={labelClass}>
          Audience
        </label>
        <AudienceSelect id="new-announcement-audience" />
      </div>

      <div>
        <label htmlFor="new-announcement-content" className={labelClass}>
          Content
        </label>
        <textarea
          id="new-announcement-content"
          name="content"
          rows={5}
          placeholder="Write a short update for the people who will see it."
          aria-describedby="new-announcement-content-help"
          className={`${inputClass} resize-y`}
        />
        <p id="new-announcement-content-help" className={helpClass}>
          At least 10 characters.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2.5 font-display text-sm font-semibold text-ink">
          <input name="isPublished" type="checkbox" aria-describedby="new-announcement-publish-help" className={checkboxClass} />
          Publish immediately
        </label>
        <p id="new-announcement-publish-help" className={`${helpClass} pl-[1.625rem]`}>
          Leave unchecked to save it as a draft.
        </p>
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <ActionMessage state={state} />
        <SubmitButton label="Create announcement" pendingLabel="Creating…" className={`${primaryButtonClass} w-full`} />
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
  const [editing, setEditing] = useState(false);
  const fieldId = `announcement-${announcement.id}`;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={publishAction}>
          <input type="hidden" name="announcementId" value={announcement.id} />
          <input type="hidden" name="isPublished" value={String(!announcement.isPublished)} />
          <SubmitButton
            label={announcement.isPublished ? "Unpublish" : "Publish"}
            pendingLabel={announcement.isPublished ? "Unpublishing…" : "Publishing…"}
            className="btn-secondary btn-sm"
          />
        </form>
        <button
          type="button"
          className="btn-ghost btn-sm"
          aria-expanded={editing}
          aria-controls={`${fieldId}-editor`}
          onClick={() => setEditing((open) => !open)}
        >
          {editing ? "Close editor" : "Edit"}
        </button>
      </div>

      {publishState.message ? (
        <div className="mt-2 max-w-xl">
          <ActionMessage state={publishState} />
        </div>
      ) : null}

      {/* Form edit tetap ter-mount saat ditutup agar pesan hasil simpan dan isian tidak hilang.
          Kotak terangkat (well + sambungan tegas) karena sedang dikerjakan, beda dari baris daftar di sekitarnya. */}
      <form
        id={`${fieldId}-editor`}
        hidden={!editing}
        action={updateAction}
        noValidate
        className="mt-3 space-y-4 rounded-lg border border-line-strong bg-well p-4"
        aria-label={`Edit ${announcement.title}`}
      >
        <input type="hidden" name="announcementId" value={announcement.id} />
        <input type="hidden" name="isPublished" value={String(announcement.isPublished)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <div>
            <label htmlFor={`${fieldId}-title`} className={labelClass}>
              Title
            </label>
            <input id={`${fieldId}-title`} name="title" defaultValue={announcement.title} className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${fieldId}-audience`} className={labelClass}>
              Audience
            </label>
            <AudienceSelect id={`${fieldId}-audience`} defaultValue={announcement.audience} />
          </div>
        </div>
        <div>
          <label htmlFor={`${fieldId}-content`} className={labelClass}>
            Content
          </label>
          <textarea
            id={`${fieldId}-content`}
            name="content"
            rows={4}
            defaultValue={announcement.content}
            aria-describedby={`${fieldId}-content-help`}
            className={`${inputClass} resize-y`}
          />
          <p id={`${fieldId}-content-help`} className={helpClass}>
            At least 10 characters.
          </p>
        </div>
        <ActionMessage state={updateState} />
        <SubmitButton label="Save changes" />
      </form>
    </div>
  );
}
