import { zonedDateParts } from "@/lib/learning/availability";

/** "14 Oct 2026": tanggal pada daftar dan riwayat. */
export function formatShortDate(date: Date) {
  const { day, month, year } = zonedDateParts(date);
  return `${day} ${month} ${year}`;
}

/** "24 Oct": tanggal ringkas untuk label status seperti "Opens 24 Oct". */
export function formatDayMonth(date: Date) {
  const { day, month } = zonedDateParts(date);
  return `${day} ${month}`;
}

/** "5m ago", "3h ago", "Yesterday", "4d ago", lalu tanggal pendek setelah seminggu. */
export function formatRelativeTime(date: Date, now: Date = new Date()) {
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(date);
}

/** Angka dengan pemisah ribuan gaya Inggris: 1,240. */
export function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}
