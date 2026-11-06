"use client";

import { useId } from "react";
import { useFormState } from "react-dom";
import { updateRoomMetadataAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageUploadField } from "@/components/instructor/image-upload-field";
import { helpClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

/** Isi form Details. Jadwal buka/tutup ada di form terpisah (RoomScheduleForm, halaman Schedule & publishing). */
export type RoomMetadataValues = {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  points: number;
  orderIndex: number;
  logoUrl: string | null;
};

/** Label di atas input, teks bantuan opsional di bawahnya (terhubung lewat aria-describedby di input). */
export function Field({ id, label, help, className = "", children }: { id: string; label: string; help?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {help ? (
        <p id={`${id}-help`} className={helpClass}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function RoomMetadataForm({
  room,
  paths,
  disabled = false
}: {
  room: RoomMetadataValues;
  paths: Array<{ id: string; title: string; isPublished: boolean }>;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(updateRoomMetadataAction, idleActionState);
  const uid = useId();
  const fieldId = (key: string) => `${uid}-${key}`;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="roomId" value={room.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field id={fieldId("title")} label="Room title">
          <input id={fieldId("title")} name="title" defaultValue={room.title} className={inputClass} disabled={disabled} />
        </Field>
        <Field id={fieldId("slug")} label="Slug" help="Used in the room's address.">
          <input
            id={fieldId("slug")}
            name="slug"
            defaultValue={room.slug}
            className={`${inputClass} font-mono text-sm`}
            disabled={disabled}
            aria-describedby={`${fieldId("slug")}-help`}
          />
        </Field>

        <Field id={fieldId("path")} label="Learning path">
          <select id={fieldId("path")} name="learningPathId" defaultValue={room.learningPathId} className={inputClass} disabled={disabled}>
            {paths.map((path) => (
              <option key={path.id} value={path.id}>
                {path.title}
                {path.isPublished ? "" : " (draft)"}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fieldId("order")} label="Position in path" help="1 is the first room members see.">
          <input
            id={fieldId("order")}
            name="orderIndex"
            type="number"
            min={0}
            max={10000}
            defaultValue={room.orderIndex}
            className={`${inputClass} figure`}
            disabled={disabled}
            aria-describedby={`${fieldId("order")}-help`}
          />
        </Field>

        <Field id={fieldId("category")} label="Category">
          <input id={fieldId("category")} name="category" defaultValue={room.category} className={inputClass} disabled={disabled} />
        </Field>
        <Field id={fieldId("difficulty")} label="Difficulty">
          <input id={fieldId("difficulty")} name="difficulty" defaultValue={room.difficulty} className={inputClass} disabled={disabled} />
        </Field>

        <Field id={fieldId("minutes")} label="Estimated minutes">
          <input
            id={fieldId("minutes")}
            name="estimatedMinutes"
            type="number"
            min={5}
            max={600}
            defaultValue={room.estimatedMinutes}
            className={`${inputClass} figure`}
            disabled={disabled}
          />
        </Field>
        <Field id={fieldId("points")} label="Points" help="Awarded when a member passes the room's quiz. A room without a quiz awards task points only.">
          <input
            id={fieldId("points")}
            name="points"
            type="number"
            min={0}
            max={10000}
            defaultValue={room.points}
            className={`${inputClass} figure`}
            disabled={disabled}
            aria-describedby={`${fieldId("points")}-help`}
          />
        </Field>
      </div>

      <Field id={fieldId("description")} label="Short description">
        <textarea id={fieldId("description")} name="description" rows={3} defaultValue={room.description} className={inputClass} disabled={disabled} />
      </Field>

      {/* Sampul room tidak ditawarkan: sejak kolom samping room dihapus, tidak ada tempat member melihatnya.
          Kolom coverImageUrl tetap ada dan tidak disentuh saat Details disimpan. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ImageUploadField
          name="logoUrl"
          label="Logo"
          previewClassName="h-24 w-24 rounded-lg"
          initialValue={room.logoUrl}
          help="Optional. A square image shown next to the room name. Without one, the initials of the name are used."
          disabled={disabled}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4">
        <SubmitButton label="Save room details" disabled={disabled} />
        <ActionMessage state={state} />
      </div>
    </form>
  );
}
