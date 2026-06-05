"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createInstructorRoomAction, type InstructorActionState } from "@/lib/actions/instructor-actions";
import { ActionMessage } from "@/components/ui/action-message";

type LearningPathOption = {
  id: string;
  title: string;
  category: string;
};

const initialState: InstructorActionState = {
  tone: "idle",
  message: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Room"}
    </button>
  );
}

export function RoomBuilderForm({ paths }: { paths: LearningPathOption[] }) {
  const [state, formAction] = useFormState(createInstructorRoomAction, initialState);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [taskCount, setTaskCount] = useState(2);

  const selectedPath = useMemo(() => paths[0], [paths]);

  function updateTitle(value: string) {
    setTitle(value);
    setSlug((current) => (current ? current : slugify(value)));
  }

  if (paths.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-sm text-slate-400">
        Belum ada learning path published. Buat atau publish learning path dulu sebelum membuat room.
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-400">Environment Draft Editor</h3>
          <p className="mt-1 text-xs text-slate-500">Semua konten harus aman, konseptual, dan edukatif.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <input name="isPublished" type="checkbox" className="h-4 w-4 accent-primary" />
            Publish immediately
          </label>
          <SubmitButton />
        </div>
      </div>

      <ActionMessage state={state} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="glass-panel rounded-xl bg-black/10 p-5">
            <div className="mb-5 border-b border-slate-800/85 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">room metadata</p>
              <h3 className="mt-1 text-base font-bold text-slate-100">Room Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 md:col-span-2">
                Room Title
                <input
                  name="title"
                  value={title}
                  onChange={(event) => updateTitle(event.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-600"
                  placeholder="Authentication Concepts Review"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Slug
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-600"
                  placeholder="authentication-concepts-review"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Learning Path
                <select
                  name="learningPathId"
                  defaultValue={selectedPath.id}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none"
                >
                  {paths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
                <input
                  name="category"
                  defaultValue={selectedPath.category}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Difficulty
                <select
                  name="difficulty"
                  defaultValue="Beginner"
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 md:col-span-2">
                Description
                <textarea
                  name="description"
                  rows={4}
                  className="focus-ring mt-1.5 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-200 outline-none placeholder:text-slate-600"
                  placeholder="Safe guided room for reviewing identity, session, and access-control concepts without offensive instructions."
                />
              </label>
            </div>
          </section>

          <section className="glass-panel rounded-xl bg-black/10 p-5">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">objectives</p>
                <h3 className="mt-1 text-base font-bold text-slate-100">Tasks & Answers</h3>
              </div>
              <button
                type="button"
                onClick={() => setTaskCount((value) => Math.min(5, value + 1))}
                className="rounded-lg border border-primary-container/30 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary-container/10"
              >
                Add Objective
              </button>
            </div>

            <div className="space-y-4">
              {Array.from({ length: taskCount }).map((_, index) => (
                <div key={index} className="rounded-lg border border-slate-800/80 bg-slate-900/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Objective {index + 1}</p>
                    {taskCount > 1 ? (
                      <button
                        type="button"
                        onClick={() => setTaskCount((value) => Math.max(1, value - 1))}
                        className="text-xs font-bold text-slate-500 transition hover:text-rose-300"
                      >
                        Remove last
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem]">
                    <input
                      name="taskTitle"
                      placeholder="Review session lifecycle"
                      className="focus-ring rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                    />
                    <input
                      name="taskPoints"
                      type="number"
                      min={0}
                      max={10000}
                      defaultValue={10}
                      className="focus-ring rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
                    />
                    <textarea
                      name="taskDescription"
                      rows={2}
                      placeholder="Explain the concept learners should identify in the safe lab notes."
                      className="focus-ring resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 md:col-span-2"
                    />
                    <input
                      name="taskExpectedAnswer"
                      placeholder="Expected answer, e.g. defense-in-depth"
                      className="focus-ring rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 md:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <section className="glass-panel rounded-xl border-t-2 border-t-primary-container bg-black/10 p-5">
            <h3 className="border-b border-slate-800 pb-3 text-base font-bold text-slate-100">Module Options</h3>
            <div className="mt-4 grid gap-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Estimated Duration
                <input
                  name="estimatedMinutes"
                  type="number"
                  min={5}
                  max={600}
                  defaultValue={45}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Room Points
                <input
                  name="points"
                  type="number"
                  min={0}
                  max={10000}
                  defaultValue={100}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Order Index
                <input
                  name="orderIndex"
                  type="number"
                  min={0}
                  max={10000}
                  defaultValue={100}
                  className="focus-ring mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
                />
              </label>
            </div>
          </section>

          <section className="glass-panel rounded-xl bg-black/10 p-5">
            <h3 className="border-b border-slate-800 pb-3 text-base font-bold text-slate-100">Safety Boundary</h3>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-500">
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">Use safe placeholders, defensive explanations, and concept checks only.</p>
              <p className="rounded-lg border border-white/[0.06] bg-black/20 p-3">Do not include real exploit commands, malware, phishing, credential theft, bypass, persistence, or harmful payload content.</p>
              <p className="rounded-lg border border-white/[0.06] bg-black/20 p-3">Lab orchestration is still placeholder-only until a hardened provider is added.</p>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
