"use client";

import { useEffect, useId, useRef } from "react";
import { useFormState } from "react-dom";
import {
  addRoomTaskAction,
  deleteRoomTaskAction,
  moveRoomTaskAction,
  updateRoomTaskAction
} from "@/lib/actions/content-actions";
import { EmptyState } from "@/components/card";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { dangerButtonClass, helpClass, idleActionState, inputClass, labelClass, secondaryButtonClass } from "@/components/instructor/form-styles";

export type EditorTask = {
  id: string;
  title: string;
  description: string;
  expectedAnswer: string | null;
  acceptedAnswers: string[];
  hint: string | null;
  points: number;
  orderIndex: number;
};

/** Tombol ikon kecil untuk mengubah urutan task. */
const reorderButtonClass = "btn-ghost btn-sm w-8 px-0";

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={direction === "up" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TaskFields({ task, disabled }: { task?: EditorTask; disabled: boolean }) {
  const id = useId();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
        <div>
          <label htmlFor={`${id}-title`} className={labelClass}>
            Task title
          </label>
          <input
            id={`${id}-title`}
            name="title"
            defaultValue={task?.title ?? ""}
            placeholder="Identify the response header"
            className={inputClass}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor={`${id}-points`} className={labelClass}>
            Points
          </label>
          <input
            id={`${id}-points`}
            name="points"
            type="number"
            min={0}
            max={10000}
            defaultValue={task?.points ?? 10}
            className={`${inputClass} figure`}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-description`} className={labelClass}>
          Instructions for members
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="Describe what members should look at or do (at least 10 characters)."
          className={inputClass}
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor={`${id}-answer`} className={labelClass}>
          Expected answer
        </label>
        <input
          id={`${id}-answer`}
          name="expectedAnswer"
          defaultValue={task?.expectedAnswer ?? ""}
          placeholder="e.g. least privilege"
          aria-describedby={`${id}-answer-help`}
          className={`${inputClass} font-mono text-sm`}
          disabled={disabled}
        />
        <p id={`${id}-answer-help`} className={helpClass}>
          Members must type this answer (or one of the other accepted answers) to solve the task. Letter case and spaces at either end are
          ignored. A task without an answer can&apos;t be solved: the tasks after it stay locked and the room can&apos;t be completed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-accepted`} className={labelClass}>
            Other accepted answers <span className="font-normal text-ink-3">(optional, one per line)</span>
          </label>
          <textarea
            id={`${id}-accepted`}
            name="acceptedAnswers"
            rows={3}
            defaultValue={task?.acceptedAnswers?.join("\n") ?? ""}
            placeholder={"principle of least privilege\nleast-privilege"}
            aria-describedby={`${id}-accepted-help`}
            className={`${inputClass} font-mono text-sm`}
            disabled={disabled}
          />
          <p id={`${id}-accepted-help`} className={helpClass}>
            Synonyms, abbreviations, or other spellings that also count as correct. Up to 10 lines.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-hint`} className={labelClass}>
            Hint <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id={`${id}-hint`}
            name="hint"
            rows={3}
            defaultValue={task?.hint ?? ""}
            placeholder="Point members in the right direction without giving the answer away."
            aria-describedby={`${id}-hint-help`}
            className={inputClass}
            disabled={disabled}
          />
          <p id={`${id}-hint-help`} className={helpClass}>
            Shown to members after two wrong attempts on this task.
          </p>
        </div>
      </div>
    </>
  );
}

function TaskRow({
  task,
  position,
  isFirst,
  isLast,
  disabled
}: {
  task: EditorTask;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
}) {
  const [state, formAction] = useFormState(updateRoomTaskAction, idleActionState);
  const [deleteState, deleteAction] = useFormState(deleteRoomTaskAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveRoomTaskAction, idleActionState);
  const headingId = `task-${task.id}-heading`;

  return (
    <article aria-labelledby={headingId} className="py-6 first:pt-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h3 id={headingId} className="text-base font-bold text-ink">
            Task <span className="figure">{position}</span>
          </h3>
          <span className="figure text-sm text-ink-3">
            {task.points} {task.points === 1 ? "pt" : "pts"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={reorderButtonClass} disabled={disabled || isFirst} aria-label="Move up" title="Move up">
              <ChevronIcon direction="up" />
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={reorderButtonClass} disabled={disabled || isLast} aria-label="Move down" title="Move down">
              <ChevronIcon direction="down" />
            </button>
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Delete this task and its answer history?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="taskId" value={task.id} />
            <button type="submit" className={`${dangerButtonClass} ml-1`} disabled={disabled}>
              Delete
            </button>
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="taskId" value={task.id} />
        <TaskFields task={task} disabled={disabled} />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteState} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Save task" className={secondaryButtonClass} disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

function AddTaskForm({ roomId, disabled }: { roomId: string; disabled: boolean }) {
  const [state, formAction] = useFormState(addRoomTaskAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (state.tone === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-labelledby={headingId}
      className="space-y-4 border-t border-dashed border-line-strong pt-6"
    >
      <h3 id={headingId} className="text-base font-bold text-ink">
        Add a task
      </h3>
      <input type="hidden" name="roomId" value={roomId} />
      <TaskFields disabled={disabled} />
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <ActionMessage state={state} />
        </div>
        <SubmitButton label="Add task" pendingLabel="Adding…" disabled={disabled} />
      </div>
    </form>
  );
}

/** Task tersusun sebagai daftar bergaris di dalam lembar seksi (bukan kartu di dalam kartu); form tambah dipisah garis putus-putus. */
export function TaskEditor({ roomId, tasks, disabled = false }: { roomId: string; tasks: EditorTask[]; disabled?: boolean }) {
  return (
    <div>
      {tasks.length === 0 ? (
        <div className="mb-6">
          <EmptyState title="No tasks yet" message="Add at least one task so members' room progress can be counted." />
        </div>
      ) : (
        <div className="divide-y divide-line-soft">
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              position={index + 1}
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
      <AddTaskForm roomId={roomId} disabled={disabled} />
    </div>
  );
}
