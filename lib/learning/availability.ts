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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const zonedFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

/** Bagian tanggal di zona waktu tampilan. Nama bulan ditulis sendiri agar selalu tiga huruf ("Sep", bukan "Sept"). */
export function zonedDateParts(date: Date) {
  const parts = zonedFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: Number(get("day")),
    month: MONTHS[Number(get("month")) - 1] ?? "",
    year: get("year"),
    time: `${get("hour")}:${get("minute")}`
  };
}

/** Singkatan zona waktu Indonesia; zona lain memakai nama pendek dari Intl (misalnya "GMT+8"). */
const ZONE_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT"
};

function zoneLabel(date: Date) {
  if (ZONE_LABELS[DISPLAY_TIME_ZONE]) return ZONE_LABELS[DISPLAY_TIME_ZONE];
  const part = new Intl.DateTimeFormat("en-US", { timeZone: DISPLAY_TIME_ZONE, timeZoneName: "short" })
    .formatToParts(date)
    .find((item) => item.type === "timeZoneName");
  return part?.value ?? DISPLAY_TIME_ZONE;
}

/** "21 Oct 2026, 19:30 WIB" */
export function formatScheduleDate(date: Date) {
  const { day, month, year, time } = zonedDateParts(date);
  return `${day} ${month} ${year}, ${time} ${zoneLabel(date)}`;
}

/** Kalimat singkat untuk badge di daftar room dan halaman detail. */
export function describeAvailability(availability: RoomAvailability) {
  switch (availability.state) {
    case "draft":
      return "Draft, not published";
    case "upcoming":
      return `Opens ${formatScheduleDate(availability.opensAt as Date)}`;
    case "closed":
      return `Closed since ${formatScheduleDate(availability.closesAt as Date)}`;
    default:
      return availability.closesAt ? `Open until ${formatScheduleDate(availability.closesAt)}` : "Always open";
  }
}

/** Pesan error server saat peserta mencoba mengerjakan room yang tidak terbuka. */
export function availabilityErrorMessage(availability: RoomAvailability) {
  switch (availability.state) {
    case "draft":
      return "This room isn't published yet.";
    case "upcoming":
      return `This room opens on ${formatScheduleDate(availability.opensAt as Date)}.`;
    case "closed":
      return `This room closed on ${formatScheduleDate(availability.closesAt as Date)}.`;
    default:
      return "This room is open.";
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
