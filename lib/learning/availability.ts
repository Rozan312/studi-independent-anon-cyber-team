/**
 * Ketersediaan room berdasarkan status publish dan jendela waktu opsional.
 * Modul ini bebas dependensi server sehingga bisa dipakai di server maupun client.
 *
 * - availableFrom kosong  : langsung tersedia setelah publish
 * - availableUntil kosong : tersedia tanpa batas akhir
 * - keduanya kosong       : selalu tersedia (default)
 */

export type RoomScheduleFields = {
  isPublished: boolean;
  availableFrom: Date | string | null;
  availableUntil: Date | string | null;
};

export type RoomAvailabilityState = "draft" | "upcoming" | "open" | "closed";

export type RoomAvailability = {
  state: RoomAvailabilityState;
  isOpen: boolean;
  isScheduled: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
};

export const DISPLAY_TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE ?? "Asia/Jakarta";

function toDate(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRoomAvailability(room: RoomScheduleFields, now: Date = new Date()): RoomAvailability {
  const opensAt = toDate(room.availableFrom);
  const closesAt = toDate(room.availableUntil);

  let state: RoomAvailabilityState = "open";
  if (!room.isPublished) state = "draft";
  else if (opensAt && now < opensAt) state = "upcoming";
  else if (closesAt && now >= closesAt) state = "closed";

  return {
    state,
    isOpen: state === "open",
    isScheduled: Boolean(opensAt || closesAt),
    opensAt,
    closesAt
  };
}

export function formatScheduleDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

/** Kalimat singkat untuk badge di daftar room dan halaman detail. */
export function describeAvailability(availability: RoomAvailability) {
  switch (availability.state) {
    case "draft":
      return "Draft, belum dipublish";
    case "upcoming":
      return `Dibuka ${formatScheduleDate(availability.opensAt as Date)}`;
    case "closed":
      return `Ditutup sejak ${formatScheduleDate(availability.closesAt as Date)}`;
    default:
      return availability.closesAt ? `Tersedia sampai ${formatScheduleDate(availability.closesAt)}` : "Selalu tersedia";
  }
}

/** Pesan error server saat peserta mencoba mengerjakan room yang tidak terbuka. */
export function availabilityErrorMessage(availability: RoomAvailability) {
  switch (availability.state) {
    case "draft":
      return "Room belum dipublish.";
    case "upcoming":
      return `Room belum dibuka. Jadwal buka: ${formatScheduleDate(availability.opensAt as Date)}.`;
    case "closed":
      return `Room sudah ditutup sejak ${formatScheduleDate(availability.closesAt as Date)}.`;
    default:
      return "Room tersedia.";
  }
}

/** Nilai untuk <input type="datetime-local"> dalam zona waktu tampilan. */
export function toDateTimeLocalValue(value: Date | string | null) {
  const date = toDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Mengubah nilai datetime-local (tanpa offset) menjadi ISO dengan asumsi zona waktu tampilan,
 * sehingga server dan browser dengan zona berbeda menghasilkan waktu yang sama.
 */
export function dateTimeLocalToIso(value: string) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return "";

  const [, year, month, day, hour, minute] = match.map(Number);
  // Tebakan awal dalam UTC, lalu koreksi selisih zona waktu tampilan pada saat itu.
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMinutes = timeZoneOffsetMinutes(guess);
  const corrected = new Date(guess.getTime() - offsetMinutes * 60_000);
  return corrected.toISOString();
}

function timeZoneOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - date.getTime()) / 60_000);
}
