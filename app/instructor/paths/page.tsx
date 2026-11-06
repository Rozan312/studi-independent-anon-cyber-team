import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SectionHeader } from "@/components/card";
import { LearningPathForm } from "@/components/instructor/learning-path-form";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { PublishPill } from "@/components/instructor/publish-state";
import { listPanelClass, panelClass, panelHeadClass, panelMetaClass, panelTitleClass, titleLinkClass } from "@/components/instructor/form-styles";
import { toggleLearningPathPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { canManageContent, listLearningPathsForManagement } from "@/lib/services/content-service";
import { EntityLogo } from "@/components/paper/entity-logo";

export const metadata: Metadata = { title: "Path manager" };
export const dynamic = "force-dynamic";

export default async function InstructorPathsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const paths = await listLearningPathsForManagement();
  const publishedCount = paths.filter((path) => path.isPublished).length;

  return (
    <AppShell
      title="Path manager"
      subtitle="Build learning paths, group rooms into them, and decide when members can see each path."
      role={profile.role}
      actions={
        <Link href="/instructor/rooms/new" className="btn-secondary">
          New room
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className={listPanelClass} aria-labelledby="paths-title">
          <div className={panelHeadClass}>
            <h2 id="paths-title" className={panelTitleClass}>
              Learning paths
            </h2>
            {paths.length > 0 ? (
              <p className={panelMetaClass}>
                {formatNumber(paths.length)} {paths.length === 1 ? "path" : "paths"} · {formatNumber(publishedCount)} published
              </p>
            ) : null}
          </div>

          {paths.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState title="No learning paths yet" message="Create the first one with the New learning path form. It stays a draft until you publish it." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {paths.map((path) => {
                const manageable = canManageContent(profile, path.createdById);
                const roomCount = path._count.rooms;

                return (
                  <li key={path.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 sm:px-6">
                    <EntityLogo name={path.title} src={path.logoUrl} size="md" />
                    <div className="min-w-0 flex-1 basis-56">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <Link href={`/instructor/paths/${path.id}`} className={titleLinkClass}>
                          {path.title}
                        </Link>
                        <PublishPill published={path.isPublished} />
                      </div>
                      <p className="mt-0.5 text-sm text-ink-3">
                        {roomCount} {roomCount === 1 ? "room" : "rooms"} · {path.category} · {path.difficulty} · <span className="figure">{path.estimatedHours} h</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        Updated {formatShortDate(path.updatedAt)} · {path.createdBy ? `Owner @${path.createdBy.username}` : "No owner"}
                      </p>
                    </div>
                    <div className="ml-auto flex items-start gap-2">
                      <PublishToggleForm
                        action={toggleLearningPathPublishAction}
                        idField="pathId"
                        id={path.id}
                        isPublished={path.isPublished}
                        disabled={!manageable}
                        compact
                        showState={false}
                      />
                      <Link href={`/instructor/paths/${path.id}`} className="btn-secondary btn-sm">
                        {manageable ? "Edit" : "View"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={panelClass} aria-label="New learning path">
          <SectionHeader
            title="New learning path"
            description="Drafts stay hidden from members until you publish them. After creating the path, add rooms to it from its page."
          />
          <LearningPathForm mode="create" />
        </aside>
      </div>
    </AppShell>
  );
}
