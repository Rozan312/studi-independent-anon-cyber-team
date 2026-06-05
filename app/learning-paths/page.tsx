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
    <AppShell title="Learning Paths" subtitle="Structured curricula for safe cybersecurity learning." role={profile.role}>
      <Card>
        <SectionHeader eyebrow="Curriculum" title="Available paths" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paths.map((path) => (
            <Link key={path.id} href={`/learning-paths/${path.slug}`} className="group rounded-lg border border-border bg-black/20 p-4 transition hover:border-primary/45 hover:bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{path.category}</p>
                <StatusPill tone={path.difficulty === "Beginner" ? "success" : "primary"}>{path.difficulty}</StatusPill>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-50">{path.title}</h2>
              <p className="mt-2 min-h-16 text-sm text-slate-400">{path.description}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>{path.estimatedHours} hours</span>
                <span>{path._count.rooms} rooms</span>
              </div>
              <div className="mt-4 rounded-md border border-border px-3 py-2 text-center text-sm text-slate-300 transition group-hover:border-primary/45 group-hover:text-slate-50">
                View path
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
