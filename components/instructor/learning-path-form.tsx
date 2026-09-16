"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createLearningPathAction, updateLearningPathAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageUploadField } from "@/components/instructor/image-upload-field";
import { idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

export type LearningPathFormValues = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  coverImageUrl: string | null;
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

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={formAction} className="space-y-4">
      {path ? <input type="hidden" name="pathId" value={path.id} /> : null}

      <label className={labelClass}>
        Judul
        <input
          name="title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Web Security Fundamentals"
          className={inputClass}
          disabled={disabled}
        />
      </label>

      <label className={labelClass}>
        Slug (URL)
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          placeholder="web-security-fundamentals"
          className={inputClass}
          disabled={disabled}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Kategori
          <input name="category" defaultValue={path?.category ?? ""} placeholder="Web" className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Tingkat
          <input
            name="difficulty"
            list="learning-path-difficulty"
            defaultValue={path?.difficulty ?? "Beginner"}
            className={inputClass}
            disabled={disabled}
          />
          <datalist id="learning-path-difficulty">
            {difficultyOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label className={labelClass}>
          Estimasi (jam)
          <input
            name="estimatedHours"
            type="number"
            min={1}
            max={500}
            defaultValue={path?.estimatedHours ?? 8}
            className={inputClass}
            disabled={disabled}
          />
        </label>
      </div>

      <label className={labelClass}>
        Deskripsi
        <textarea
          name="description"
          rows={4}
          defaultValue={path?.description ?? ""}
          placeholder="Jelaskan tujuan learning path, siapa targetnya, dan apa yang akan dikuasai peserta (minimal 20 karakter)."
          className={inputClass}
          disabled={disabled}
        />
      </label>

      <ImageUploadField initialValue={path?.coverImageUrl} disabled={disabled} />

      {mode === "create" ? (
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <input name="isPublished" type="checkbox" className="h-4 w-4 accent-primary" disabled={disabled} />
          Publish langsung setelah dibuat
        </label>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label={mode === "create" ? "Buat learning path" : "Simpan perubahan"} disabled={disabled} />
      </div>
    </form>
  );
}
