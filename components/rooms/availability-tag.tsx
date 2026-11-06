import { StateTag, type StateTone } from "@/components/paper/state-tag";
import type { RoomAvailability } from "@/lib/learning/availability";
import { formatDayMonth } from "@/lib/format/date";

/** Isi label status ketersediaan room; null bila room terbuka tanpa batas akhir. */
export function availabilityLabel(availability: RoomAvailability): { tone: StateTone; text: string } | null {
  if (availability.state === "upcoming" && availability.opensAt) return { tone: "amber", text: `Opens ${formatDayMonth(availability.opensAt)}` };
  if (availability.state === "closed") return { tone: "red", text: "Closed" };
  if (availability.state === "draft") return { tone: "muted", text: "Draft" };
  if (availability.closesAt) return { tone: "amber", text: `Closes ${formatDayMonth(availability.closesAt)}` };
  return null;
}

export function AvailabilityTag({ availability }: { availability: RoomAvailability }) {
  const label = availabilityLabel(availability);
  return label ? <StateTag tone={label.tone}>{label.text}</StateTag> : null;
}
