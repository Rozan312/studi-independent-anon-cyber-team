import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { PublishRoomForm } from "@/components/instructor/publish-room-form";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function InstructorRoomsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const rooms = await prisma.room.findMany({
    include: { learningPath: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AppShell title="Module Management" subtitle="Create, update, and manage draft cybersecurity lab rooms and learning environments." role={profile.role}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-slate-100">{rooms.length} active learning spaces</h3>
        <Link className="rounded-lg bg-primary-container text-white px-4 py-2 text-xs font-semibold hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(77,142,255,0.2)] flex items-center gap-1.5" href="/instructor/rooms/new">
          New Module Draft
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="glass-panel rounded-xl p-5 hover:border-primary-container/40 transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-primary transition-colors">{room.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5">{room.learningPath.title}</p>
              </div>
              <StatusPill tone={room.isPublished ? "success" : "neutral"}>
                {room.isPublished ? "Published" : "Draft"}
              </StatusPill>
            </div>

            <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Points: {room.points} XP</span>
              <span>Category: {room.category}</span>
            </div>
            {!room.isPublished ? (
              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <PublishRoomForm roomId={room.id} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
