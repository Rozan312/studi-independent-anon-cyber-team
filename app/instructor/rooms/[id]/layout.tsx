import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RoomStateMarks } from "@/components/instructor/publish-state";
import { RoomEditorNav } from "@/components/instructor/room-editor-nav";
import { PageNotice } from "@/components/ui/page-notice";
import { getRoomAvailability } from "@/lib/learning/availability";
import { loadRoomEditor } from "./editor-data";

export const dynamic = "force-dynamic";

/**
 * Kerangka editor room: judul shell, catatan baca-saja, lalu navigasi seksi di samping konten (xl ke atas)
 * atau sebagai deret tab di atasnya. Setiap seksi adalah halaman sendiri dengan judul dokumen statis.
 */
export default async function RoomEditorLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const { profile, room, canManage } = await loadRoomEditor(params.id);
  const availability = getRoomAvailability(room);

  return (
    <AppShell
      title={room.title}
      subtitle={
        <>
          Room in{" "}
          <Link href={`/instructor/paths/${room.learningPath.id}`} className="text-link">
            {room.learningPath.title}
          </Link>{" "}
          · <span className="font-mono text-sm">/rooms/{room.slug}</span>
        </>
      }
      role={profile.role}
      actions={
        <>
          <Link href="/instructor/rooms" className="btn-secondary">
            All rooms
          </Link>
          {room.isPublished ? (
            <Link href={`/rooms/${room.slug}`} className="btn-secondary">
              Preview as member
            </Link>
          ) : null}
        </>
      }
    >
      {!canManage ? (
        <PageNotice
          tone="warning"
          title="Read-only"
          message={`This room belongs to ${room.createdBy?.username ?? "another instructor"}. Only its owner or an admin can change it.`}
          className="mb-5"
        />
      ) : null}

      {/* Navigasi seksi baru pindah ke samping mulai xl. Di lg, kolom di samping rail yang terbuka membuat area tulis
          editor bab jauh lebih sempit daripada materi yang dibaca member; deret tab di atas konten memberi lebar penuh. */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-6">
        <RoomEditorNav
          roomId={room.id}
          chapterCount={room.chapters.length}
          taskCount={room.tasks.length}
          questionCount={room.quiz ? room.quiz.questions.length : null}
          status={<RoomStateMarks isPublished={room.isPublished} availability={availability} />}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </AppShell>
  );
}
