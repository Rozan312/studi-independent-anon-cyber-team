import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/card";
import { RoomMetadataForm } from "@/components/instructor/room-metadata-form";
import { panelClass } from "@/components/instructor/form-styles";
import { listLearningPathsForManagement } from "@/lib/services/content-service";
import { loadRoomEditor, roomEditorHref } from "./editor-data";

// Judul statis: editor bisa memuat room yang belum terbit, jadi namanya tidak ditaruh di <title>.
export const metadata: Metadata = { title: "Room details" };
export const dynamic = "force-dynamic";

/**
 * Catatan setelah room dibuat, dengan tautan ke langkah berikutnya. Tampilannya mengikuti nada success
 * PageNotice, yang hanya menerima teks polos.
 */
function RoomCreatedNotice({ roomId }: { roomId: string }) {
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-sheet border border-green/35 bg-green-soft/55 px-4 py-3.5 text-sm text-ink sm:px-5">
      <svg viewBox="0 0 20 20" className="mt-px h-5 w-5 shrink-0 text-green" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" strokeWidth="1.5" />
        <path d="m5.5 10.5 3 3 6-7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="min-w-0">
        <p className="font-display font-semibold leading-snug text-ink">Room created</p>
        <p className="mt-0.5 max-w-[75ch] leading-relaxed text-ink-2">
          Next, write the walkthrough chapter by chapter on the{" "}
          <Link href={roomEditorHref(roomId, "material")} className="text-link">
            Material
          </Link>{" "}
          page, then add tasks under the chapters and, if you want one, a quiz. Publish the room from{" "}
          <Link href={roomEditorHref(roomId, "schedule")} className="text-link">
            Schedule &amp; publishing
          </Link>{" "}
          when everything is ready for members.
        </p>
      </div>
    </div>
  );
}

export default async function RoomDetailsPage({
  params,
  searchParams = {}
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { room, canManage } = await loadRoomEditor(params.id);
  const paths = await listLearningPathsForManagement();

  return (
    <>
      {searchParams.created === "1" ? <RoomCreatedNotice roomId={room.id} /> : null}
      <section aria-labelledby="room-details-heading" className={panelClass}>
        <SectionHeader
          id="room-details-heading"
          title="Details"
          description="Title, URL, learning path, level, points, and logo."
        />
        <RoomMetadataForm
          disabled={!canManage}
          paths={paths.map((path) => ({ id: path.id, title: path.title, isPublished: path.isPublished }))}
          room={{
            id: room.id,
            learningPathId: room.learningPathId,
            title: room.title,
            slug: room.slug,
            description: room.description,
            category: room.category,
            difficulty: room.difficulty,
            estimatedMinutes: room.estimatedMinutes,
            points: room.points,
            orderIndex: room.orderIndex,
            logoUrl: room.logoUrl
          }}
        />
      </section>
    </>
  );
}
