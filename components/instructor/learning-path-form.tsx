"use client";

import { useId, useState } from "react";
import { useFormState } from "react-dom";
import { createLearningPathAction, updateLearningPathAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageUploadField } from "@/components/instructor/image-upload-field";
import { helpClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

export type LearningPathFormValues = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  coverImageUrl: string | null;
  logoUrl: string | null;
};

const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

/** Versi slugify untuk slug yang diketik sendiri: tanda hubung di akhir dibiarkan agar "web-" bisa dilanjutkan menjadi "web-security". */
function slugifyTyping(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-/, "")
    .slice(0, 180);
}

/** Label di atas input, teks bantuan opsional di bawahnya (terhubung lewat aria-describedby di input). */
function Field({ id, label, help, className = "", children }: { id: string; label: string; help?: React.ReactNode; className?: string; children: React.ReactNode }) {
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

export function LearningPathForm({
  mode,
  path,
  disabled = false
}: {
  mode: "create" | "edit";
  path?: LearningPathFormValues;
  disabled?: boolean;
}) {
  const action = mode === "create" ? createLearningPathAction : updateLearningPathAction;
  const [state, formAction] = useFormState(action, idleActionState);
  const [title, setTitle] = useState(path?.title ?? "");
  const [slug, setSlug] = useState(path?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const uid = useId();
  const fieldId = (key: string) => `${uid}-${key}`;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-5">
      {path ? <input type="hidden" name="pathId" value={path.id} /> : null}

      <Field id={fieldId("title")} label="Title">
        <input
          id={fieldId("title")}
          name="title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Web Security Fundamentals"
          className={inputClass}
          disabled={disabled}
        />
      </Field>

      <Field id={fieldId("slug")} label="Slug" help={`Used in the address: /learning-paths/${slug || "your-path"}`}>
        <input
          id={fieldId("slug")}
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugifyTyping(event.target.value));
          }}
          placeholder="web-security-fundamentals"
          className={inputClass}
          disabled={disabled}
          aria-describedby={`${fieldId("slug")}-help`}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field id={fieldId("category")} label="Category">
          <input
            id={fieldId("category")}
            name="category"
            defaultValue={path?.category ?? ""}
            placeholder="Web"
            className={inputClass}
            disabled={disabled}
          />
        </Field>
        <Field id={fieldId("difficulty")} label="Difficulty">
          <input
            id={fieldId("difficulty")}
            name="difficulty"
            list={fieldId("difficulty-options")}
            defaultValue={path?.difficulty ?? "Beginner"}
            className={inputClass}
            disabled={disabled}
          />
          <datalist id={fieldId("difficulty-options")}>
            {difficultyOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>
        <Field id={fieldId("hours")} label="Estimated hours">
          <input
            id={fieldId("hours")}
            name="estimatedHours"
            type="number"
            min={1}
            max={500}
            defaultValue={path?.estimatedHours ?? 8}
            className={`${inputClass} figure`}
            disabled={disabled}
          />
        </Field>
      </div>

      <Field id={fieldId("description")} label="Description" help="At least 20 characters.">
        <textarea
          id={fieldId("description")}
          name="description"
          rows={4}
          defaultValue={path?.description ?? ""}
          placeholder="What the path covers, who it's for, and what members will be able to do by the end."
          className={inputClass}
          disabled={disabled}
          aria-describedby={`${fieldId("description")}-help`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ImageUploadField name="logoUrl" label="Logo" previewClassName="h-24 w-24 rounded-2xl" initialValue={path?.logoUrl} help="Optional. A square image shown next to the path name. Without one, the initials of the name are used." disabled={disabled} />
        <ImageUploadField initialValue={path?.coverImageUrl} help="Optional. A wide banner shown at the top of the path page." disabled={disabled} />
      </div>

      {mode === "create" ? (
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input name="isPublished" type="checkbox" className="h-4 w-4 rounded border-line-strong accent-violet" disabled={disabled} />
          Publish as soon as it&apos;s created
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line-soft pt-4">
        <SubmitButton
          label={mode === "create" ? "Create learning path" : "Save changes"}
          pendingLabel={mode === "create" ? "Creating…" : "Saving…"}
          disabled={disabled}
        />
        <ActionMessage state={state} />
      </div>
    </form>
  );
}
