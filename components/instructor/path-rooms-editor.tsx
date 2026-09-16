"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addRoomToPathAction, moveRoomInPathAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusPill } from "@/components/card";
import { ghostButtonClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";

export type PathRoomItem = {
  id: string;
  title: string;
  orderIndex: number;
  isPublished: boolean;
  points: number;
  taskCount: number;
  questionCount: number;
  ownerLabel: string;
  scheduleLabel: string | null;
  coverImageUrl: string | null;
};

export type CandidateRoomItem = {
  id: string;
  title: string;
  pathTitle: string;
  isPublished: boolean;
  canManage: boolean;
};

function RoomRow({ room, isFirst, isLast, disabled }: { room: PathRoomItem; isFirst: boolean; isLast: boolean; disabled: boolean }) {
  const [moveState, moveAction] = useFormState(moveRoomInPathAction, idleActionState);

  return (
    <li className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.06] bg-[#0f131d]">
          {room.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-base font-black text-primary/60">{room.orderIndex}</span>
          )}
        </div>
        <div className="min-w-0 flex-grow">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-100">
              {room.orderIndex}. {room.title}
            </p>
            <StatusPill tone={room.isPublished ? "success" : "neutral"}>{room.isPublished ? "Live" : "Draft"}</StatusPill>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {room.taskCount} task · {room.questionCount > 0 ? `${room.questionCount} soal quiz` : "tanpa quiz"} · {room.points} pts · pemilik {room.ownerLabel}
          </p>
          {room.scheduleLabel ? <p className="mt-1 text-[11px] text-amber-300/80">{room.scheduleLabel}</p> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <form action={moveAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isFirst} title="Pindah ke atas">
              Naik
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={ghostButtonClass} disabled={disabled || isLast} title="Pindah ke bawah">
              Turun
            </button>
          </form>
        </div>
        <Link href={`/instructor/rooms/${room.id}`} className="text-xs font-bold text-primary hover:underline">
          Buka editor
        </Link>
      </div>
      <ActionMessage state={moveState} />
    </li>
  );
}

function AddExistingRoomForm({ pathId, candidates, disabled }: { pathId: string; candidates: CandidateRoomItem[]; disabled: boolean }) {
  const [state, formAction] = useFormState(addRoomToPathAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.tone === "success") formRef.current?.reset();
  }, [state]);

  const selectable = candidates.filter((room) => room.canManage);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Tambahkan room yang sudah ada</p>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Room hanya bisa berada di satu path, jadi room yang dipilih akan dipindahkan dari path asalnya ke urutan terakhir di path ini.
      </p>
      <input type="hidden" name="pathId" value={pathId} />
      <label className={labelClass}>
        Pilih room
        <select name="roomId" defaultValue="" className={inputClass} disabled={disabled || selectable.length === 0} required>
          <option value="" disabled>
            {selectable.length === 0 ? "Tidak ada room lain yang bisa dipindahkan" : "Pilih room dari path lain"}
          </option>
          {candidates.map((room) => (
            <option key={room.id} value={room.id} disabled={!room.canManage}>
              {room.title} — dari {room.pathTitle}
              {room.isPublished ? "" : " (draft)"}
              {room.canManage ? "" : " (milik instruktur lain)"}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Tambahkan ke path" pendingLabel="Memindahkan..." disabled={disabled || selectable.length === 0} />
      </div>
    </form>
  );
}

export function PathRoomsEditor({
  pathId,
  rooms,
  candidates,
  canManagePath
}: {
  pathId: string;
  rooms: PathRoomItem[];
  candidates: CandidateRoomItem[];
  canManagePath: boolean;
}) {
  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <p className="rounded-lg border border-white/[0.06] bg-black/20 p-4 text-sm text-slate-400">
          Belum ada room di path ini. Tambahkan room yang sudah ada di bawah, atau buat room baru.
        </p>
      ) : (
        <ol className="space-y-2">
          {rooms.map((room, index) => (
            <RoomRow key={room.id} room={room} isFirst={index === 0} isLast={index === rooms.length - 1} disabled={!canManagePath} />
          ))}
        </ol>
      )}

      <AddExistingRoomForm pathId={pathId} candidates={candidates} disabled={!canManagePath} />

      <Link
        href={`/instructor/rooms/new?pathId=${pathId}`}
        className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-primary/40 hover:text-white"
      >
        Buat room baru di path ini
      </Link>
    </div>
  );
}
