"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { createInstructorRoomAction, type InstructorActionState } from "@/lib/actions/instructor-actions";
import { EmptyState, SectionHeader } from "@/components/card";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { checkboxClass, helpClass, inputClass, labelClass, panelClass } from "@/components/instructor/form-styles";

type LearningPathOption = {
  id: string;
  title: string;
  category: string;
};

const initialState: InstructorActionState = {
  tone: "idle",
  message: ""
};

/** Batas task awal yang bisa diisi di builder; task lain ditambahkan di editor room. */
const MAX_STARTER_TASKS = 5;

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

function formValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement ? field.value.trim() : "";
}

function formField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLElement ? field : null;
}

function taskFields(form: HTMLFormElement, name: string) {
  return Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`));
}

/** Angka opsional: kosong berarti server memakai nilai bawaan; selain itu harus bilangan bulat dalam rentang. */
function outOfRange(raw: string, min: number, max: number) {
  if (!raw) return false;
  const value = Number.parseInt(raw, 10);
  return !Number.isFinite(value) || value < min || value > max;
}

type BuilderProblem = { message: string; field: HTMLElement | null };

/**
 * Cek di browser dengan aturan yang sama seperti roomBuilderSchema dan createInstructorRoomAction,
 * agar instruktur melihat pesan yang menyebut field dan nomor task sebelum form dikirim.
 */
function validateBuilder(form: HTMLFormElement): BuilderProblem | null {
  const title = formValue(form, "title");
  if (title.length < 3) return { message: "Room title must be at least 3 characters.", field: formField(form, "title") };
  if (title.length > 160) return { message: "Room title must be 160 characters or fewer.", field: formField(form, "title") };

  const slug = formValue(form, "slug");
  if (slug.length < 3) {
    return { message: "Slug must be at least 3 characters. It fills in from the room title, or type your own.", field: formField(form, "slug") };
  }
  if (slug.length > 180) return { message: "Slug must be 180 characters or fewer.", field: formField(form, "slug") };

  const category = formValue(form, "category");
  if (category.length < 2) return { message: "Category must be at least 2 characters.", field: formField(form, "category") };
  if (category.length > 80) return { message: "Category must be 80 characters or fewer.", field: formField(form, "category") };

  const description = formValue(form, "description");
  if (description.length < 20) return { message: "Description must be at least 20 characters.", field: formField(form, "description") };
  if (description.length > 2000) return { message: "Description must be 2,000 characters or fewer.", field: formField(form, "description") };

  if (outOfRange(formValue(form, "estimatedMinutes"), 5, 600)) {
    return { message: "Estimated time must be between 5 and 600 minutes.", field: formField(form, "estimatedMinutes") };
  }
  if (outOfRange(formValue(form, "points"), 0, 10000)) {
    return { message: "Room points must be between 0 and 10,000.", field: formField(form, "points") };
  }
  if (outOfRange(formValue(form, "orderIndex"), 0, 10000)) {
    return { message: "Order in path must be between 0 and 10,000.", field: formField(form, "orderIndex") };
  }

  const titles = taskFields(form, "taskTitle");
  const descriptions = taskFields(form, "taskDescription");
  const answers = taskFields(form, "taskExpectedAnswer");
  const points = taskFields(form, "taskPoints");
  let filledTasks = 0;

  for (let index = 0; index < titles.length; index += 1) {
    const taskTitle = titles[index].value.trim();
    const taskDescription = descriptions[index]?.value.trim() ?? "";
    const taskAnswer = answers[index]?.value.trim() ?? "";
    // Kartu kosong dilewati, sama seperti di server.
    if (!taskTitle && !taskDescription && !taskAnswer) continue;

    filledTasks += 1;
    const label = `Task ${index + 1}`;
    if (taskTitle.length < 3) return { message: `${label}: title must be at least 3 characters.`, field: titles[index] };
    if (taskTitle.length > 160) return { message: `${label}: title must be 160 characters or fewer.`, field: titles[index] };
    if (taskDescription.length < 10) {
      return { message: `${label}: instructions must be at least 10 characters.`, field: descriptions[index] ?? null };
    }
    if (taskDescription.length > 2000) {
      return { message: `${label}: instructions must be 2,000 characters or fewer.`, field: descriptions[index] ?? null };
    }
    if (taskAnswer.length > 500) return { message: `${label}: expected answer must be 500 characters or fewer.`, field: answers[index] ?? null };

    const rawPoints = points[index]?.value.trim() ?? "";
    if (!rawPoints || outOfRange(rawPoints, 0, 10000)) {
      return { message: `${label}: points must be a whole number from 0 to 10,000.`, field: points[index] ?? null };
    }
  }

  if (filledTasks === 0) {
    return { message: "Add at least one starter task before creating the room.", field: titles[0] ?? null };
  }

  return null;
}

function StarterTaskFields({ position, canRemove, onRemove }: { position: number; canRemove: boolean; onRemove: () => void }) {
  const id = useId();
  const headingId = `${id}-heading`;

  return (
    <div role="group" aria-labelledby={headingId} className="py-5 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id={headingId} className="text-base font-bold text-ink">
          Task <span className="figure">{position}</span>
        </h3>
        {canRemove ? (
          <button type="button" onClick={onRemove} className="btn-ghost btn-sm">
            Remove task
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
        <div>
          <label htmlFor={`${id}-title`} className={labelClass}>
            Task title
          </label>
          <input id={`${id}-title`} name="taskTitle" placeholder="Review the session lifecycle" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${id}-points`} className={labelClass}>
            Points
          </label>
          <input
            id={`${id}-points`}
            name="taskPoints"
            type="number"
            min={0}
            max={10000}
            defaultValue={10}
            className={`${inputClass} figure`}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-description`} className={labelClass}>
            Instructions for members
          </label>
          <textarea
            id={`${id}-description`}
            name="taskDescription"
            rows={2}
            placeholder="Explain the concept members should identify in the safe lab notes."
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-answer`} className={labelClass}>
            Expected answer
          </label>
          <input
            id={`${id}-answer`}
            name="taskExpectedAnswer"
            placeholder="e.g. defense-in-depth"
            aria-describedby={`${id}-answer-help`}
            className={`${inputClass} font-mono text-sm`}
          />
          <p id={`${id}-answer-help`} className={helpClass}>
            Members type this to solve the task. Without it, the task can&apos;t be solved and the tasks after it stay locked.
          </p>
        </div>
      </div>
    </div>
  );
}

export function RoomBuilderForm({ paths, defaultPathId }: { paths: LearningPathOption[]; defaultPathId?: string | null }) {
  const [state, formAction] = useFormState(createInstructorRoomAction, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  // Slug mengikuti judul sampai instruktur mengetiknya sendiri; mengosongkan slug membuatnya mengikuti judul lagi.
  const [slugTouched, setSlugTouched] = useState(false);
  const [taskCount, setTaskCount] = useState(2);
  const id = useId();

  const selectedPath = useMemo(() => paths.find((path) => path.id === defaultPathId) ?? paths[0], [paths, defaultPathId]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const problem = validateBuilder(event.currentTarget);
    if (!problem) {
      setClientError(null);
      return;
    }

    event.preventDefault();
    setClientError(problem.message);
    problem.field?.focus();
  }

  if (paths.length === 0) {
    return (
      <EmptyState
        title="No learning paths yet"
        message="Every room belongs to a learning path. Create one in the path manager first, then come back to add rooms."
        action={
          <Link href="/instructor/paths" className="btn-primary">
            Open path manager
          </Link>
        }
      />
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <section className={panelClass}>
          <SectionHeader title="Room details" description="What members see in the room list and at the top of the room." />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor={`${id}-title`} className={labelClass}>
                Room title
              </label>
              <input
                id={`${id}-title`}
                name="title"
                value={title}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="Authentication concepts review"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor={`${id}-slug`} className={labelClass}>
                Slug
              </label>
              <input
                id={`${id}-slug`}
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(event.target.value.length > 0);
                  setSlug(slugifyTyping(event.target.value));
                }}
                placeholder="authentication-concepts-review"
                aria-describedby={`${id}-slug-help`}
                className={`${inputClass} font-mono text-sm`}
              />
              <p id={`${id}-slug-help`} className={helpClass}>
                Used in the room address. Filled in from the title until you change it; lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div>
              <label htmlFor={`${id}-path`} className={labelClass}>
                Learning path
              </label>
              <select id={`${id}-path`} name="learningPathId" defaultValue={selectedPath.id} className={inputClass}>
                {paths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {path.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${id}-category`} className={labelClass}>
                Category
              </label>
              <input id={`${id}-category`} name="category" defaultValue={selectedPath.category} className={inputClass} />
            </div>

            <div>
              <label htmlFor={`${id}-difficulty`} className={labelClass}>
                Difficulty
              </label>
              <select id={`${id}-difficulty`} name="difficulty" defaultValue="Beginner" className={inputClass}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor={`${id}-description`} className={labelClass}>
                Description
              </label>
              <textarea
                id={`${id}-description`}
                name="description"
                rows={4}
                placeholder="Safe guided room for reviewing identity, session, and access-control concepts without offensive instructions."
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </section>

        <section className={panelClass}>
          <SectionHeader
            title="Starter tasks"
            description="Add at least one task with a title, instructions (10+ characters), and the expected answer. Empty tasks are skipped. Add hints, other accepted answers, and more tasks later in the room editor."
          />

          <div className="divide-y divide-line">
            {Array.from({ length: taskCount }).map((_, index) => (
              <StarterTaskFields
                key={index}
                position={index + 1}
                canRemove={taskCount > 1 && index === taskCount - 1}
                onRemove={() => setTaskCount((value) => Math.max(1, value - 1))}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setTaskCount((value) => Math.min(MAX_STARTER_TASKS, value + 1))}
              className="btn-secondary btn-sm"
              disabled={taskCount >= MAX_STARTER_TASKS}
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
              </svg>
              Add task
            </button>
            <p className="text-xs text-ink-3">
              <span className="figure">{taskCount}</span> of <span className="figure">{MAX_STARTER_TASKS}</span> starter tasks
            </p>
          </div>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <section className={panelClass} aria-labelledby={`${id}-settings`}>
          <h2 id={`${id}-settings`} className="mb-4 text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
            Room settings
          </h2>
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${id}-minutes`} className={labelClass}>
                Estimated time <span className="font-normal text-ink-3">(minutes)</span>
              </label>
              <input
                id={`${id}-minutes`}
                name="estimatedMinutes"
                type="number"
                min={5}
                max={600}
                defaultValue={45}
                className={`${inputClass} figure`}
              />
            </div>
            <div>
              <label htmlFor={`${id}-points`} className={labelClass}>
                Room points
              </label>
              <input
                id={`${id}-points`}
                name="points"
                type="number"
                min={0}
                max={10000}
                defaultValue={100}
                className={`${inputClass} figure`}
              />
            </div>
            <div>
              <label htmlFor={`${id}-order`} className={labelClass}>
                Order in path
              </label>
              <input
                id={`${id}-order`}
                name="orderIndex"
                type="number"
                min={0}
                max={10000}
                defaultValue={100}
                aria-describedby={`${id}-order-help`}
                className={`${inputClass} figure`}
              />
              <p id={`${id}-order-help`} className={helpClass}>
                Rooms are listed from the lowest number up.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 border-t border-line pt-5">
            <div>
              <label className="flex items-start gap-2.5 font-display text-sm font-semibold text-ink">
                <input name="isPublished" type="checkbox" aria-describedby={`${id}-publish-help`} className={`${checkboxClass} mt-0.5`} />
                Publish immediately
              </label>
              <p id={`${id}-publish-help`} className={`${helpClass} pl-[1.625rem]`}>
                Leave unchecked to keep the room as a draft while you finish the material and quiz.
              </p>
            </div>
            <ActionMessage state={clientError ? { tone: "error", message: clientError } : state} />
            <SubmitButton label="Create room" pendingLabel="Creating room…" className="btn-primary w-full" />
          </div>
        </section>

        <section className={panelClass} aria-labelledby={`${id}-safety`}>
          <h2 id={`${id}-safety`} className="text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
            Content rules
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-2">
            <li className="flex gap-2">
              <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-green" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Use safe placeholders, defensive explanations, and concept checks only.</span>
            </li>
            <li className="flex gap-2">
              <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-red" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" />
              </svg>
              <span>
                Do not include real exploit commands, malware, phishing, credential theft, bypass, persistence, or harmful payload content.
              </span>
            </li>
            <li className="flex gap-2">
              <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 7.2v3.6M8 5.1v.1" strokeLinecap="round" />
              </svg>
              <span>Labs stay placeholder-only until a hardened lab provider is added.</span>
            </li>
          </ul>
        </section>
      </aside>
    </form>
  );
}
