"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useFormState } from "react-dom";
import { addRoomToPathAction, moveRoomInPathAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState, StatusPill } from "@/components/card";
import { StateTag, type StateTone } from "@/components/paper/state-tag";
import { helpClass, idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";
import { MoveButton } from "@/components/instructor/move-button";

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

/** Warna label jadwal dari teks describeAvailability: "Closed since…" merah, selain itu amber (terjadwal). */
function scheduleTone(label: string): StateTone {
  return label.startsWith("Closed") ? "red" : "amber";
}

function RoomRow({ room, isFirst, isLast, disabled }: { room: PathRoomItem; isFirst: boolean; isLast: boolean; disabled: boolean }) {
  const [moveState, moveAction] = useFormState(moveRoomInPathAction, idleActionState);
  const titleId = useId();

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span className="figure w-7 shrink-0 text-right text-lg font-bold leading-6 text-ink-3" aria-hidden="true">
          {room.orderIndex}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              id={titleId}
              href={`/instructor/rooms/${room.id}`}
              className="tap-target min-w-0 font-semibold leading-6 text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
            >
              {room.title}
            </Link>
            <StatusPill tone={room.isPublished ? "success" : "neutral"}>{room.isPublished ? "Published" : "Draft"}</StatusPill>
            {room.scheduleLabel ? <StateTag tone={scheduleTone(room.scheduleLabel)}>{room.scheduleLabel}</StateTag> : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-3">
            {room.taskCount} {room.taskCount === 1 ? "task" : "tasks"} ·{" "}
            {room.questionCount > 0 ? `${room.questionCount} quiz ${room.questionCount === 1 ? "question" : "questions"}` : "No quiz"} ·{" "}
            <span className="figure">{room.points}</span> {room.points === 1 ? "pt" : "pts"} · Owner: {room.ownerLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <form action={moveAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="direction" value="up" />
            <MoveButton direction="up" describedBy={titleId} disabled={disabled || isFirst} />
          </form>
          <form action={moveAction}>
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="direction" value="down" />
            <MoveButton direction="down" describedBy={titleId} disabled={disabled || isLast} />
          </form>
        </div>
      </div>
      {moveState.message ? (
        <div className="mt-2 pl-10">
          <ActionMessage state={moveState} />
        </div>
      ) : null}
    </li>
  );
}

function AddExistingRoomForm({ pathId, candidates, disabled }: { pathId: string; candidates: CandidateRoomItem[]; disabled: boolean }) {
  const [state, formAction] = useFormState(addRoomToPathAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const selectId = `${uid}-room`;
  const helpId = `${uid}-help`;

  useEffect(() => {
    if (state.tone === "success") formRef.current?.reset();
  }, [state]);

  const selectable = candidates.filter((room) => room.canManage);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border-t border-dashed border-line-strong pt-4">
      <input type="hidden" name="pathId" value={pathId} />
      <div>
        <label htmlFor={selectId} className={labelClass}>
          Add an existing room
        </label>
        <select
          id={selectId}
          name="roomId"
          defaultValue=""
          className={inputClass}
          disabled={disabled || selectable.length === 0}
          aria-describedby={helpId}
          required
        >
          <option value="" disabled>
            {selectable.length === 0 ? "No other rooms you can move" : "Choose a room from another path"}
          </option>
          {candidates.map((room) => (
            <option key={room.id} value={room.id} disabled={!room.canManage}>
              {room.title} (from {room.pathTitle})
              {room.isPublished ? "" : ", draft"}
              {room.canManage ? "" : ", owned by another instructor"}
            </option>
          ))}
        </select>
        <p id={helpId} className={helpClass}>
          A room belongs to one path, so the room you pick moves out of its current path and goes to the end of this one.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <SubmitButton label="Add room" pendingLabel="Adding…" className="btn-secondary" disabled={disabled || selectable.length === 0} />
        <ActionMessage state={state} />
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
        <EmptyState title="No rooms in this path yet" message="Add an existing room below, or create a new room for this path." />
      ) : (
        <ol className="divide-y divide-line-soft border-t border-line-soft" aria-label="Rooms in this path, in order">
          {rooms.map((room, index) => (
            <RoomRow key={room.id} room={room} isFirst={index === 0} isLast={index === rooms.length - 1} disabled={!canManagePath} />
          ))}
        </ol>
      )}

      <AddExistingRoomForm pathId={pathId} candidates={candidates} disabled={!canManagePath} />

      <Link href={`/instructor/rooms/new?pathId=${pathId}`} className="btn-secondary w-full">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
        </svg>
        Create a new room in this path
      </Link>
    </div>
  );
}
