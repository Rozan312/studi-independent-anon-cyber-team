import { StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { formatDayMonth } from "@/lib/format/date";
import type { RoomAvailability } from "@/lib/learning/availability";

/** Status terbit yang sama di semua halaman staf: hijau Published (terlihat member), netral Draft. */
export function PublishPill({ published, className = "" }: { published: boolean; className?: string }) {
  return (
    <StatusPill tone={published ? "success" : "neutral"} className={className}>
      {published ? "Published" : "Draft"}
    </StatusPill>
  );
}

/** Status terbit + label jadwal room (amber terjadwal, merah ditutup) agar status room tidak pernah hilang dari pandangan. */
export function RoomStateMarks({ isPublished, availability }: { isPublished: boolean; availability: RoomAvailability }) {
  if (!isPublished) return <PublishPill published={false} />;
  return (
    <>
      <PublishPill published />
      {availability.state === "upcoming" && availability.opensAt ? (
        <StateTag tone="amber">{`Opens ${formatDayMonth(availability.opensAt)}`}</StateTag>
      ) : null}
      {availability.state === "closed" ? <StateTag tone="red">Closed</StateTag> : null}
    </>
  );
}
