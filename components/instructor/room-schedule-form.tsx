"use client";

import { useId, useState } from "react";
import { useFormState } from "react-dom";
import { updateRoomScheduleAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field } from "@/components/instructor/room-metadata-form";
import { checkboxClass, checkboxLabelClass, helpClass, idleActionState, inputClass } from "@/components/instructor/form-styles";
import { DISPLAY_TIME_ZONE, dateTimeLocalToIso, toDateTimeLocalValue } from "@/lib/learning/availability";

/**
 * Jadwal buka/tutup room di halaman Schedule & publishing. Hanya menyimpan availableFrom/availableUntil;
 * mematikan kotak centang lalu menyimpan berarti room terbuka tanpa batas selama terbit.
 */
export function RoomScheduleForm({
  roomId,
  availableFrom,
  availableUntil,
  disabled = false
}: {
  roomId: string;
  /** ISO string atau null; dikonversi ke zona waktu tampilan di form. */
  availableFrom: string | null;
  availableUntil: string | null;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(updateRoomScheduleAction, idleActionState);
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(availableFrom || availableUntil));
  const [fromLocal, setFromLocal] = useState(toDateTimeLocalValue(availableFrom));
  const [untilLocal, setUntilLocal] = useState(toDateTimeLocalValue(availableUntil));
  const uid = useId();
  const fieldId = (key: string) => `${uid}-${key}`;

  const fromIso = scheduleEnabled ? dateTimeLocalToIso(fromLocal) : "";
  const untilIso = scheduleEnabled ? dateTimeLocalToIso(untilLocal) : "";
  const rangeInvalid = Boolean(fromIso && untilIso && new Date(untilIso) <= new Date(fromIso));

  return (
    <form action={formAction} aria-labelledby={fieldId("heading")}>
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="availableFrom" value={fromIso} />
      <input type="hidden" name="availableUntil" value={untilIso} />

      <h3 id={fieldId("heading")} className="text-base font-bold text-ink">
        Schedule
      </h3>
      <div className="mt-3">
        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            className={checkboxClass}
            checked={scheduleEnabled}
            onChange={(event) => setScheduleEnabled(event.target.checked)}
            disabled={disabled}
            aria-describedby={fieldId("help")}
          />
          Set opening and closing times
        </label>
        <p id={fieldId("help")} className={helpClass}>
          Without a schedule, the room stays available while it&apos;s published. Times are in {DISPLAY_TIME_ZONE}.
        </p>
      </div>

      {scheduleEnabled ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field id={fieldId("from")} label="Opens" help="Leave empty to open immediately.">
            <input
              id={fieldId("from")}
              type="datetime-local"
              value={fromLocal}
              onChange={(event) => setFromLocal(event.target.value)}
              className={inputClass}
              disabled={disabled}
              aria-describedby={`${fieldId("from")}-help`}
            />
          </Field>
          <Field id={fieldId("until")} label="Closes" help="Leave empty to keep it open.">
            <input
              id={fieldId("until")}
              type="datetime-local"
              value={untilLocal}
              onChange={(event) => setUntilLocal(event.target.value)}
              className={inputClass}
              disabled={disabled}
              aria-invalid={rangeInvalid || undefined}
              aria-describedby={`${fieldId("until")}-help`}
            />
          </Field>
          {rangeInvalid ? (
            <div className="md:col-span-2">
              <ActionMessage state={{ tone: "error", message: "The closing time must be after the opening time." }} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <SubmitButton label="Save schedule" disabled={disabled || rangeInvalid} />
        <ActionMessage state={state} />
      </div>
    </form>
  );
}
