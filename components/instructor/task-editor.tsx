"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import {
  addRoomTaskAction,
  deleteRoomTaskAction,
  moveRoomTaskAction,
  updateRoomTaskAction
} from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { dangerButtonClass, ghostButtonClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

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

function TaskFields({ task, disabled }: { task?: EditorTask; disabled: boolean }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
        <label className={labelClass}>
          Judul task
          <input name="title" defaultValue={task?.title ?? ""} placeholder="Identifikasi header respons" className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Poin
          <input name="points" type="number" min={0} max={10000} defaultValue={task?.points ?? 10} className={inputClass} disabled={disabled} />
        </label>
      </div>
      <label className={labelClass}>
        Instruksi untuk peserta
        <textarea
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="Jelaskan apa yang harus diamati atau dikerjakan peserta (minimal 10 karakter)."
          className={inputClass}
          disabled={disabled}
        />
      </label>
      <label className={labelClass}>
        Jawaban yang diharapkan
        <input
          name="expectedAnswer"
          defaultValue={task?.expectedAnswer ?? ""}
          placeholder="Contoh: least privilege"
          className={inputClass}
          disabled={disabled}
        />
        <span className="mt-1 block text-[11px] normal-case tracking-normal text-slate-500">
          Dibandingkan sebagai teks: huruf besar/kecil dan spasi di tepi diabaikan. Kosongkan jika task hanya bersifat bacaan (jawaban tidak akan
          pernah dinilai benar).
        </span>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Jawaban alternatif (opsional, satu per baris)
          <textarea
            name="acceptedAnswers"
            rows={3}
            defaultValue={task?.acceptedAnswers?.join("\n") ?? ""}
            placeholder={"principle of least privilege\nleast-privilege"}
            className={inputClass}
            disabled={disabled}
          />
          <span className="mt-1 block text-[11px] normal-case tracking-normal text-slate-500">
            Sinonim, singkatan, atau ejaan lain yang juga dianggap benar. Maksimal 10 baris.
          </span>
        </label>
        <label className={labelClass}>
          Hint (opsional)
          <textarea
            name="hint"
            rows={3}
            defaultValue={task?.hint ?? ""}
            placeholder="Petunjuk yang mengarahkan tanpa menyebut jawabannya langsung."
            className={inputClass}
            disabled={disabled}
          />
          <span className="mt-1 block text-[11px] normal-case tracking-normal text-slate-500">
            Ditampilkan ke peserta setelah dua percobaan salah pada task ini.
          </span>
        </label>
      </div>
    </>
  );
}

function TaskRow({ task, isFirst, isLast, disabled }: { task: EditorTask; isFirst: boolean; isLast: boolean; disabled: boolean }) {
  const [state, formAction] = useFormState(updateRoomTaskAction, idleActionState);
  const [deleteState, deleteAction] = useFormState(deleteRoomTaskAction, idleActionState);
  const [moveState, moveAction] = useFormState(moveRoomTaskAction, idleActionState);

  return (
    <article className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Task {task.orderIndex}</p>
        <div className="flex flex-wrap items-center gap-2">
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isFirst} title="Pindah ke atas">
              Naik
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isLast} title="Pindah ke bawah">
              Turun
            </button>
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm("Hapus task ini? Riwayat jawaban peserta untuk task ini ikut terhapus.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="taskId" value={task.id} />
            <button type="submit" className={dangerButtonClass} disabled={disabled}>
              Hapus
            </button>
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="taskId" value={task.id} />
        <TaskFields task={task} disabled={disabled} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <ActionMessage state={state} />
            <ActionMessage state={deleteState} />
            <ActionMessage state={moveState} />
          </div>
          <SubmitButton label="Simpan task" disabled={disabled} />
        </div>
      </form>
    </article>
  );
}

function AddTaskForm({ roomId, disabled }: { roomId: string; disabled: boolean }) {
  const [state, formAction] = useFormState(addRoomTaskAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.tone === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Tambah task baru</p>
      <input type="hidden" name="roomId" value={roomId} />
      <TaskFields disabled={disabled} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Tambah task" pendingLabel="Menambahkan..." disabled={disabled} />
      </div>
    </form>
  );
}

export function TaskEditor({ roomId, tasks, disabled = false }: { roomId: string; tasks: EditorTask[]; disabled?: boolean }) {
  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="rounded-lg border border-white/[0.06] bg-black/20 p-4 text-sm text-slate-400">
          Belum ada task. Tambahkan minimal satu task agar progress room peserta dapat dihitung.
        </p>
      ) : null}
      {tasks.map((task, index) => (
        <TaskRow key={task.id} task={task} isFirst={index === 0} isLast={index === tasks.length - 1} disabled={disabled} />
      ))}
      <AddTaskForm roomId={roomId} disabled={disabled} />
    </div>
  );
}
