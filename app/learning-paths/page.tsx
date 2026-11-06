import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { listPublishedLearningPaths } from "@/lib/services/learning-path-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const metadata: Metadata = { title: "Learning paths" };
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
          {/* Baris rata selebar panel, sama dengan halaman Rooms: logo, judul, meta, deskripsi satu baris, lalu status
              path di kolom kanan selebar tetap agar bilah progres sejajar antarbaris (di ponsel pindah ke bawah teks). */}
          <ul className="divide-y divide-line">
            {paths.map((path) => {
              const roomIds = roomIdsByPath.get(path.id) ?? [];
              const total = roomIds.length;
              const done = roomIds.filter((id) => completedRoomIds.has(id)).length;
              const complete = total > 0 && done === total;
              const inProgress = done > 0 && done < total;
              const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
              const roomNoun = total === 1 ? "room" : "rooms";

              return (
                <li key={path.id}>
                  <Link
                    href={`/learning-paths/${path.slug}`}
                    className="group flex gap-4 px-5 py-4 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:items-center sm:px-6"
                  >
                    <EntityLogo name={path.title} src={path.logoUrl} size="lg" />

                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center sm:gap-8">
                      <div className="min-w-0">
                        <h2 className="font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-cyan-ink">{path.title}</h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-3">
                          <span>{path.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span className="figure">{total === 0 ? "No rooms yet" : `${total} ${roomNoun}`}</span>
                          <span aria-hidden="true">·</span>
                          <span className="figure">~{path.estimatedHours} h</span>
                        </p>
                        <p className="mt-0.5 truncate text-sm text-ink-2">{path.description}</p>
                      </div>

                      {/* Status: bilah cyan dan persen untuk path yang berjalan, centang violet untuk path selesai,
                          teks netral untuk path yang belum disentuh. Path tanpa room tidak punya status. */}
                      {total > 0 ? (
                        <div className="min-w-0">
                          {inProgress ? (
                            <>
                              <div className="mb-1.5 flex justify-between gap-3 text-xs">
                                <span className="text-ink-2">
                                  {done} of {total} {roomNoun} passed
                                </span>
                                <span className="figure font-semibold text-ink-2">{percentage}%</span>
                              </div>
                              <ProgressBar value={percentage} label={`${path.title}: ${done} of ${total} ${roomNoun} passed`} />
                            </>
                          ) : complete ? (
                            <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-violet">
                              <span className="grid h-6 w-6 place-items-center rounded-full border border-violet/45 bg-violet-soft" aria-hidden="true">
                                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="m2.5 6.5 2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              Complete
                            </span>
                          ) : (
                            <p className="text-sm text-ink-3">Not started</p>
                          )}
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
