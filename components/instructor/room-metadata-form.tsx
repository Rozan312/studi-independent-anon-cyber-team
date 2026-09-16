"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { updateRoomMetadataAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageUploadField } from "@/components/instructor/image-upload-field";
import { idleActionState, inputClass, labelClass } from "@/components/instructor/form-styles";
import { DISPLAY_TIME_ZONE, dateTimeLocalToIso, toDateTimeLocalValue } from "@/lib/learning/availability";

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
  coverImageUrl: string | null;
  /** ISO string atau null; dikonversi ke zona waktu tampilan di form. */
  availableFrom: string | null;
  availableUntil: string | null;
};

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
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(room.availableFrom || room.availableUntil));
  const [fromLocal, setFromLocal] = useState(toDateTimeLocalValue(room.availableFrom));
  const [untilLocal, setUntilLocal] = useState(toDateTimeLocalValue(room.availableUntil));

  const fromIso = scheduleEnabled ? dateTimeLocalToIso(fromLocal) : "";
  const untilIso = scheduleEnabled ? dateTimeLocalToIso(untilLocal) : "";
  const rangeInvalid = Boolean(fromIso && untilIso && new Date(untilIso) <= new Date(fromIso));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="roomId" value={room.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Judul room
          <input name="title" defaultValue={room.title} className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Slug (URL)
          <input name="slug" defaultValue={room.slug} className={inputClass} disabled={disabled} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelClass}>
          Learning path
          <select name="learningPathId" defaultValue={room.learningPathId} className={inputClass} disabled={disabled}>
            {paths.map((path) => (
              <option key={path.id} value={path.id}>
                {path.title}
                {path.isPublished ? "" : " (draft)"}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Kategori
          <input name="category" defaultValue={room.category} className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Tingkat
          <input name="difficulty" defaultValue={room.difficulty} className={inputClass} disabled={disabled} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelClass}>
          Estimasi (menit)
          <input name="estimatedMinutes" type="number" min={5} max={600} defaultValue={room.estimatedMinutes} className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Poin room (quiz lulus)
          <input name="points" type="number" min={0} max={10000} defaultValue={room.points} className={inputClass} disabled={disabled} />
        </label>
        <label className={labelClass}>
          Urutan di path
          <input name="orderIndex" type="number" min={0} max={10000} defaultValue={room.orderIndex} className={inputClass} disabled={disabled} />
        </label>
      </div>

      <label className={labelClass}>
        Deskripsi singkat
        <textarea name="description" rows={3} defaultValue={room.description} className={inputClass} disabled={disabled} />
      </label>

      <ImageUploadField initialValue={room.coverImageUrl} label="Gambar cover (tampil di kartu menu dan hero room)" disabled={disabled} />

      <fieldset className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal kemunculan</legend>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={scheduleEnabled}
            onChange={(event) => setScheduleEnabled(event.target.checked)}
            disabled={disabled}
          />
          Atur jadwal buka dan tutup room
        </label>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Tanpa jadwal, room tersedia terus selama dipublish. Isi salah satu atau keduanya: hanya tanggal buka berarti tersedia sejak tanggal itu
          tanpa batas; hanya tanggal tutup berarti tersedia sampai tanggal itu. Zona waktu: {DISPLAY_TIME_ZONE}.
        </p>

        {scheduleEnabled ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className={labelClass}>
              Dibuka mulai
              <input
                type="datetime-local"
                value={fromLocal}
                onChange={(event) => setFromLocal(event.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </label>
            <label className={labelClass}>
              Ditutup pada
              <input
                type="datetime-local"
                value={untilLocal}
                onChange={(event) => setUntilLocal(event.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </label>
            {rangeInvalid ? <p className="text-xs text-rose-300 md:col-span-2">Tanggal tutup harus setelah tanggal buka.</p> : null}
          </div>
        ) : null}

        <input type="hidden" name="availableFrom" value={fromIso} />
        <input type="hidden" name="availableUntil" value={untilIso} />
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Simpan informasi room" disabled={disabled || rangeInvalid} />
      </div>
    </form>
  );
}
