import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { PublishPill } from "@/components/instructor/publish-state";
import { listPanelClass, panelHeadClass, panelTitleClass } from "@/components/instructor/form-styles";
import { AnnouncementCreateForm, AnnouncementEditForm } from "@/components/admin/announcement-forms";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { listAnnouncements } from "@/lib/services/admin-service";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  STUDENT: "Members",
  INSTRUCTOR: "Instructors",
  ADMIN: "Admins"
};

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export default async function AdminAnnouncementsPage() {
  const profile = await requireRole(["ADMIN"]);
  const announcements = await listAnnouncements();

  const published = announcements.filter((announcement) => announcement.isPublished).length;
  const drafts = announcements.length - published;
  const subtitle =
    announcements.length > 0
      ? `${plural(announcements.length, "announcement")} · ${formatNumber(published)} published · ${plural(drafts, "draft")}`
      : "Write announcements for members, instructors, or everyone.";

  return (
    <AppShell title="Announcements" subtitle={subtitle} role={profile.role}>
      {/* Kolom samping 340px baru dibuka di xl, sama dengan dasbor: di lg rail 256px masih terbuka dan form edit jadi terlalu sempit. */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="xl:col-start-2 xl:row-start-1">
          <AnnouncementCreateForm />
        </div>

        <section className={`${listPanelClass} xl:col-start-1 xl:row-start-1`} aria-labelledby="announcement-list-title">
          <div className={panelHeadClass}>
            <div className="min-w-0">
              <h2 id="announcement-list-title" className={panelTitleClass}>
                All announcements
              </h2>
              <p className="mt-0.5 text-sm text-ink-2">
                Newest first. Published announcements appear under Announcements on the dashboard of their audience.
              </p>
            </div>
          </div>

          {announcements.length > 0 ? (
            <ul className="divide-y divide-line">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="px-5 py-4 sm:px-6">
                  <article aria-labelledby={`announcement-${announcement.id}-heading`}>
                    <h3 id={`announcement-${announcement.id}-heading`} className="font-semibold leading-snug text-ink">
                      {announcement.title}
                    </h3>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                      <PublishPill published={announcement.isPublished} />
                      <StatusPill tone="neutral">{AUDIENCE_LABEL[announcement.audience] ?? announcement.audience}</StatusPill>
                      <span>
                        {formatShortDate(announcement.createdAt)} by {announcement.createdBy.username}
                      </span>
                    </p>
                    <p className="mt-2 line-clamp-2 max-w-3xl whitespace-pre-line text-sm text-ink-2">{announcement.content}</p>

                    <AnnouncementEditForm
                      announcement={{
                        id: announcement.id,
                        title: announcement.title,
                        content: announcement.content,
                        audience: announcement.audience,
                        isPublished: announcement.isPublished
                      }}
                    />
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="No announcements yet"
                message="Write the first one with the New announcement form. Leave it unpublished to keep it as a draft."
              />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
