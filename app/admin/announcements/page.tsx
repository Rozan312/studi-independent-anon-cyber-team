import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { StateStamp } from "@/components/paper/stamp";
import { AnnouncementCreateForm, AnnouncementEditForm } from "@/components/admin/announcement-forms";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { listAnnouncements } from "@/lib/services/admin-service";

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
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="lg:col-start-2 lg:row-start-1">
          <AnnouncementCreateForm />
        </div>

        <section className="sheet overflow-hidden lg:col-start-1 lg:row-start-1" aria-labelledby="announcement-list-title">
          <div className="border-b border-line px-5 pb-4 pt-5">
            <h2 id="announcement-list-title" className="text-lg font-bold text-ink">
              All announcements
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Newest first. Published announcements appear under Announcements on the dashboard of their audience.
            </p>
          </div>

          {announcements.length > 0 ? (
            <ul className="divide-y divide-line-soft">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="px-5 py-4">
                  <article aria-labelledby={`announcement-${announcement.id}-heading`}>
                    <h3 id={`announcement-${announcement.id}-heading`} className="font-semibold leading-snug text-ink">
                      {announcement.title}
                    </h3>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                      {announcement.isPublished ? (
                        <StatusPill tone="success">Published</StatusPill>
                      ) : (
                        <StateStamp tone="muted">Draft</StateStamp>
                      )}
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
            <div className="p-5">
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
