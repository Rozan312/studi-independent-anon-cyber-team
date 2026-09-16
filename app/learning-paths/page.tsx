import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { listPublishedLearningPaths } from "@/lib/services/learning-path-service";

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  const profile = await requireRole(["STUDENT"]);
  const paths = await listPublishedLearningPaths();

  return (
    <AppShell title="Learning Paths" subtitle="Jalur belajar terstruktur. Pilih path, lalu kerjakan room di dalamnya secara berurutan." role={profile.role}>
      <Card>
        <SectionHeader eyebrow="Curriculum" title="Available paths" />
        {paths.length === 0 ? (
          <p className="rounded-lg border border-white/[0.06] bg-black/20 p-5 text-sm text-slate-400">Belum ada learning path yang dipublish.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/learning-paths/${path.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-black/20 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/5"
              >
                {/* Cover: gambar yang diunggah instruktur, atau pola gradien bila belum ada */}
                <div className="relative h-32 overflow-hidden bg-[#0f131d]">
                  {path.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={path.coverImageUrl}
                      alt={path.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-emerald-500/15" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                    <span className="rounded border border-white/[0.08] bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md">
                      {path.category}
                    </span>
                    <StatusPill tone={path.difficulty === "Beginner" ? "success" : "primary"}>{path.difficulty}</StatusPill>
                  </div>
                </div>

                <div className="flex flex-grow flex-col p-4">
                  <h2 className="text-lg font-semibold text-slate-50 transition-colors group-hover:text-primary">{path.title}</h2>
                  <p className="mt-2 line-clamp-3 min-h-16 text-sm text-slate-400">{path.description}</p>
                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{path.estimatedHours} jam</span>
                      <span>{path._count.rooms} room</span>
                    </div>
                    <div className="mt-4 rounded-md border border-border px-3 py-2 text-center text-sm text-slate-300 transition group-hover:border-primary/45 group-hover:text-slate-50">
                      Buka path
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
