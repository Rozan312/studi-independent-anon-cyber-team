import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";

export const dynamic = "force-dynamic";

export default async function LearningPathDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const progress = await getLearningPathProgressForCurrentUser(profile.id, params.slug);
  if (!progress) notFound();

  return (
    <AppShell title={progress.path.title} subtitle={progress.path.description} role={profile.role}>
      <Card>
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <StatusPill tone="primary">{progress.path.category}</StatusPill>
            <h2 className="mt-4 text-xl font-semibold text-slate-50">{progress.percentage}% complete</h2>
            <p className="mt-2 text-sm text-slate-400">
              {progress.completedRooms} of {progress.totalRooms} rooms completed. Continue in sequence for the cleanest learning path.
            </p>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Path progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <ProgressBar value={progress.percentage} />
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <SectionHeader eyebrow="Room sequence" title="Modules" />
        <div className="space-y-3">
          {progress.path.rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.slug}`} className="flex flex-col gap-3 rounded-lg border border-border bg-black/20 p-4 transition hover:border-primary/45 hover:bg-primary/5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-50">{room.orderIndex}. {room.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {room.difficulty} - {room.estimatedMinutes} min - {room.points} pts
                </p>
              </div>
              <StatusPill tone="neutral">Open room</StatusPill>
            </Link>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
