import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";

export const dynamic = "force-dynamic";

export default async function LearningPathDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const progress = await getLearningPathProgressForCurrentUser(profile.id, params.slug);
  if (!progress) notFound();

  const { path } = progress;

  return (
    <AppShell title={path.title} subtitle={path.description} role={profile.role}>
      <Card className="relative overflow-hidden">
        {path.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={path.coverImageUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#171b26] via-[#171b26]/85 to-transparent" />
          </>
        ) : null}
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="primary">{path.category}</StatusPill>
              <StatusPill tone={path.difficulty === "Beginner" ? "success" : "neutral"}>{path.difficulty}</StatusPill>
              <span className="text-xs text-slate-500">{path.estimatedHours} jam</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-50">{progress.percentage}% selesai</h2>
            <p className="mt-2 text-sm text-slate-400">
              {progress.completedRooms} dari {progress.totalRooms} room selesai. Kerjakan berurutan agar konsep saling menyambung.
            </p>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Progress path</span>
              <span>{progress.percentage}%</span>
            </div>
            <ProgressBar value={progress.percentage} />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <SectionHeader eyebrow="Room sequence" title="Modules" />
        {path.rooms.length === 0 ? (
          <p className="rounded-lg border border-white/[0.06] bg-black/20 p-5 text-sm text-slate-400">Belum ada room yang dipublish di path ini.</p>
        ) : (
          <div className="space-y-3">
            {path.rooms.map((room) => {
              const availability = getRoomAvailability(room);
              const userProgress = room.userProgress[0];
              const progressTone = userProgress?.status === "COMPLETED" ? "success" : userProgress?.status === "IN_PROGRESS" ? "warning" : "neutral";
              const progressLabel =
                userProgress?.status === "COMPLETED"
                  ? "Selesai"
                  : userProgress?.status === "IN_PROGRESS"
                    ? `${userProgress.progressPercentage}%`
                    : "Belum dimulai";

              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.slug}`}
                  className={`flex flex-col gap-3 rounded-lg border border-border bg-black/20 p-3 transition hover:border-primary/45 hover:bg-primary/5 md:flex-row md:items-center md:justify-between ${
                    availability.isOpen ? "" : "opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-[#0f131d]">
                      {room.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={room.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent text-lg font-black text-primary/60">
                          {room.orderIndex}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-50">
                        {room.orderIndex}. {room.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {room.difficulty} · {room.estimatedMinutes} menit · {room.points} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {availability.isScheduled || !availability.isOpen ? (
                      <StatusPill tone={availability.state === "open" ? "primary" : availability.state === "upcoming" ? "warning" : "danger"}>
                        {describeAvailability(availability)}
                      </StatusPill>
                    ) : null}
                    <StatusPill tone={progressTone}>{progressLabel}</StatusPill>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
