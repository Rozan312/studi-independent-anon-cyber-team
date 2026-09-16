import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { toggleRoomPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { canManageContent, listRoomsForManagement } from "@/lib/services/content-service";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";

export const dynamic = "force-dynamic";

export default async function InstructorRoomsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const rooms = await listRoomsForManagement();
  const publishedCount = rooms.filter((room) => room.isPublished).length;

  return (
    <AppShell title="Module Management" subtitle="Buat, lengkapi, dan publish room pembelajaran beserta materi, task, dan quiz-nya." role={profile.role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-100">
          {rooms.length} room · {publishedCount} published
        </h3>
        <div className="flex items-center gap-3">
          <Link href="/instructor/paths" className="text-xs font-bold text-slate-400 hover:text-primary">
            Learning Path Manager
          </Link>
          <Link
            className="flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(77,142,255,0.2)] transition-all hover:bg-blue-600"
            href="/instructor/rooms/new"
          >
            New Module Draft
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="glass-panel rounded-xl p-6 text-sm text-slate-400">Belum ada room. Buat room pertama lewat tombol New Module Draft.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rooms.map((room) => {
            const manageable = canManageContent(profile, room.createdById);
            const hasContent = room.content.trim().length > 0;
            const questionCount = room.quiz?._count.questions ?? 0;
            const availability = getRoomAvailability(room);

            return (
              <div key={room.id} className="glass-panel group flex flex-col justify-between rounded-xl p-5 transition-all duration-300 hover:border-primary-container/40">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-100 transition-colors group-hover:text-primary">{room.title}</h4>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {room.learningPath.title}
                      {room.learningPath.isPublished ? "" : " (path draft)"}
                    </p>
                  </div>
                  <StatusPill tone={room.isPublished ? "success" : "neutral"}>{room.isPublished ? "Published" : "Draft"}</StatusPill>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {room.isPublished && (availability.isScheduled || !availability.isOpen) ? (
                    <StatusPill tone={availability.state === "open" ? "primary" : availability.state === "upcoming" ? "warning" : "danger"}>
                      {describeAvailability(availability)}
                    </StatusPill>
                  ) : null}
                  <StatusPill tone={hasContent ? "primary" : "warning"}>{hasContent ? "Materi ada" : "Materi kosong"}</StatusPill>
                  <StatusPill tone={room._count.tasks > 0 ? "primary" : "warning"}>{room._count.tasks} task</StatusPill>
                  <StatusPill tone={questionCount > 0 ? "primary" : "warning"}>{questionCount} soal quiz</StatusPill>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>{room.points} XP · {room.category}</span>
                  <span>Pemilik: {room.createdBy?.username ?? "tanpa pemilik"}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                  <Link href={`/instructor/rooms/${room.id}`} className="text-xs font-bold text-primary hover:underline">
                    {manageable ? "Edit room" : "Lihat room"}
                  </Link>
                  <PublishToggleForm action={toggleRoomPublishAction} idField="roomId" id={room.id} isPublished={room.isPublished} disabled={!manageable} compact />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
