import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { listPublishedLearningPaths } from "@/lib/services/learning-path-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  const profile = await requireRole(["STUDENT"]);
  const [pathRows, publishedRooms, completedRows] = await Promise.all([
    listPublishedLearningPaths(),
    // Hanya room yang terbit dihitung, sama seperti halaman detail path.
    prisma.room.findMany({
      where: { isPublished: true, learningPath: { isPublished: true } },
      select: { id: true, learningPathId: true }
    }),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id, status: "COMPLETED" },
      select: { roomId: true }
    })
  ]);

  // Beginner → Intermediate → Advanced, lalu judul (urutan abjad menaruh "Advanced" lebih dulu).
  const paths = sortByDifficulty(pathRows);
  const completedRoomIds = new Set(completedRows.map((row) => row.roomId));
  const roomIdsByPath = new Map<string, string[]>();
  for (const room of publishedRooms) {
    const list = roomIdsByPath.get(room.learningPathId) ?? [];
    list.push(room.id);
    roomIdsByPath.set(room.learningPathId, list);
  }

  return (
    <AppShell
      title="Learning paths"
      subtitle="Structured routes through the material. Pick a path and work through its rooms in order."
      role={profile.role}
    >
      {paths.length === 0 ? (
        <EmptyState title="No learning paths yet" message="Instructors haven't published a path yet. Check back soon." />
      ) : (
        <section className="sheet overflow-hidden" aria-label="All learning paths">
          {/* Sel bergaris rambut seperti halaman album: margin negatif menyembunyikan garis tepi kanan/bawah terakhir. */}
          <ul className="-mb-px -mr-px grid md:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => {
              const roomIds = roomIdsByPath.get(path.id) ?? [];
              const total = roomIds.length;
              const done = roomIds.filter((id) => completedRoomIds.has(id)).length;
              const complete = total > 0 && done === total;
              const roomNoun = total === 1 ? "room" : "rooms";
              const progressTitle = `${path.title}: ${done} of ${total} ${roomNoun} completed`;

              return (
                <li key={path.id} className="border-b border-r border-line-soft">
                  <Link
                    href={`/learning-paths/${path.slug}`}
                    className="group flex h-full gap-4 p-5 transition-colors hover:bg-well md:flex-col md:gap-0 md:p-6"
                  >
                    <EntityLogo name={path.title} src={path.logoUrl} size="lg" />

                    <div className="flex min-w-0 flex-1 flex-col md:mt-4">
                      <h2 className="text-lg font-bold leading-snug tracking-[-0.01em] text-ink [text-wrap:balance] group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                        {path.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-2">{path.description}</p>
                      <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-3 text-sm text-ink-3">
                        <span>{path.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span>{total === 0 ? "No rooms yet" : `${total} ${total === 1 ? "room" : "rooms"}`}</span>
                        <span aria-hidden="true">·</span>
                        <span>~{path.estimatedHours} h</span>
                        {complete ? <StatusPill tone="done">Complete</StatusPill> : null}
                      </p>

                      {total > 0 ? (
                        <div className="mt-3">
                          <p className="mb-1.5 text-xs text-ink-3">
                            {done} of {total} {roomNoun} passed
                          </p>
                          <ProgressBar value={(done / total) * 100} label={progressTitle} />
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
