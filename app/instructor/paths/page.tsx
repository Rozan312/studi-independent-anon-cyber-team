import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { LearningPathForm } from "@/components/instructor/learning-path-form";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { panelClass } from "@/components/instructor/form-styles";
import { toggleLearningPathPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { canManageContent, listLearningPathsForManagement } from "@/lib/services/content-service";

export const dynamic = "force-dynamic";

export default async function InstructorPathsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const paths = await listLearningPathsForManagement();
  const publishedCount = paths.filter((path) => path.isPublished).length;

  return (
    <AppShell
      title="Learning Path Manager"
      subtitle="Susun jalur belajar, kelompokkan room ke dalamnya, dan atur kapan path terlihat oleh student."
      role={profile.role}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-100">
              {paths.length} learning path · {publishedCount} published
            </h3>
            <Link href="/instructor/rooms/new" className="text-xs font-bold text-primary hover:underline">
              Buat room baru
            </Link>
          </div>

          {paths.length === 0 ? (
            <div className={`${panelClass} text-sm text-slate-400`}>Belum ada learning path. Gunakan form di samping untuk membuat yang pertama.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paths.map((path) => {
                const manageable = canManageContent(profile, path.createdById);

                return (
                  <article key={path.id} className="glass-panel flex flex-col justify-between rounded-xl p-5 transition-all duration-300 hover:border-primary-container/40">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold text-slate-100">{path.title}</h4>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {path.category} · {path.difficulty} · {path.estimatedHours} jam
                          </p>
                        </div>
                        <StatusPill tone={path.isPublished ? "success" : "neutral"}>{path.isPublished ? "Published" : "Draft"}</StatusPill>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{path.description}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{path._count.rooms} room</span>
                      <span>Pemilik: {path.createdBy?.username ?? "seed / tanpa pemilik"}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/instructor/paths/${path.id}`} className="text-xs font-bold text-primary hover:underline">
                        {manageable ? "Kelola path" : "Lihat detail"}
                      </Link>
                      <PublishToggleForm
                        action={toggleLearningPathPublishAction}
                        idField="pathId"
                        id={path.id}
                        isPublished={path.isPublished}
                        disabled={!manageable}
                        compact
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Buat baru</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Learning path baru</h3>
          <p className="mb-5 mt-2 text-xs leading-relaxed text-slate-400">
            Setelah dibuat, tambahkan room ke path ini lewat Room Builder. Path draft tidak terlihat oleh student sampai dipublish.
          </p>
          <LearningPathForm mode="create" />
        </aside>
      </div>
    </AppShell>
  );
}
