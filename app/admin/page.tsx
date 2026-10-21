import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, StatusPill } from "@/components/card";
import { StateTag } from "@/components/paper/state-tag";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getPlatformStatistics } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Member",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin"
};

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  STUDENT: "Members",
  INSTRUCTOR: "Instructors",
  ADMIN: "Admins"
};

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export default async function AdminPage() {
  const profile = await requireRole(["ADMIN"]);
  const now = new Date();

  // Angka tambahan (read-only) untuk ringkasan admin: komposisi role, konten terbit, jawaban task, dan item terbaru.
  const [stats, roleCounts, publishedPaths, publishedRooms, taskAnswers, correctTaskAnswers, publishedAnnouncements, recentUsers, recentAnnouncements] =
    await Promise.all([
      getPlatformStatistics(),
      prisma.profile.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.learningPath.count({ where: { isPublished: true } }),
      prisma.room.count({ where: { isPublished: true } }),
      prisma.userTaskSubmission.count(),
      prisma.userTaskSubmission.count({ where: { isCorrect: true } }),
      prisma.announcement.count({ where: { isPublished: true } }),
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, fullName: true, username: true, role: true, createdAt: true }
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, audience: true, isPublished: true, createdAt: true }
      })
    ]);

  const roleCount = (role: string) => roleCounts.find((row) => row.role === role)?._count._all ?? 0;
  const members = roleCount("STUDENT");
  const instructors = roleCount("INSTRUCTOR");
  const admins = roleCount("ADMIN");
  const draftAnnouncements = stats.announcements - publishedAnnouncements;

  const figures = [
    { label: "Members", value: formatNumber(members), note: `${plural(stats.users, "account")} in total` },
    { label: "Instructors", value: formatNumber(instructors), note: plural(admins, "admin") },
    { label: "Learning paths", value: formatNumber(stats.learningPaths), note: `${formatNumber(publishedPaths)} published` },
    { label: "Rooms", value: formatNumber(stats.rooms), note: `${formatNumber(publishedRooms)} published` },
    { label: "Rooms completed", value: formatNumber(stats.completedRooms), note: "Across all members" },
    { label: "Task answers", value: formatNumber(taskAnswers), note: `${formatNumber(correctTaskAnswers)} correct` },
    { label: "Announcements", value: formatNumber(stats.announcements), note: `${formatNumber(publishedAnnouncements)} published` },
    { label: "Lab sessions", value: formatNumber(stats.labSessions), note: "Placeholder records" }
  ];

  const adminPages = [
    {
      href: "/admin/users",
      title: "Users",
      description: "Change roles for members, instructors, and admins.",
      meta: plural(stats.users, "account")
    },
    {
      href: "/admin/platform",
      title: "Platform",
      description: "Platform stats, content status, and lab session records.",
      meta: null
    },
    {
      href: "/admin/announcements",
      title: "Announcements",
      description: "Write, edit, and publish announcements for the dashboard.",
      meta: draftAnnouncements > 0 ? plural(draftAnnouncements, "draft") : null
    }
  ];

  return (
    <AppShell
      title="Admin overview"
      subtitle={`${plural(stats.users, "account")} · ${formatNumber(publishedRooms)} of ${plural(stats.rooms, "room")} published`}
      role={profile.role}
    >
      <section className="sheet overflow-hidden" aria-label="Platform figures">
        <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-4">
          {figures.map((figure) => (
            <Figure key={figure.label} className="bg-sheet p-4" label={figure.label} value={figure.value} note={figure.note} />
          ))}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="sheet p-5 sm:p-6" aria-labelledby="newest-accounts-title">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="newest-accounts-title" className="text-lg font-bold text-ink">
              Newest accounts
            </h2>
            <Link href="/admin/users" className="text-link text-sm">
              All users
            </Link>
          </div>
          {recentUsers.length > 0 ? (
            <div className="-mx-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-left">
                      Name
                    </th>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-left">
                      Role
                    </th>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-right">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-well">
                      <td className="px-3 py-2.5">
                        <span className="block font-semibold text-ink">
                          {user.fullName || user.username}
                          {user.id === profile.id ? <span className="ml-1.5 font-normal text-ink-3">(you)</span> : null}
                        </span>
                        <span className="block text-xs text-ink-3">{user.username}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone="neutral">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                      </td>
                      <td className="figure whitespace-nowrap px-3 py-2.5 text-right text-ink-2">{formatShortDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No accounts yet" message="Accounts appear here as soon as people sign up." />
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="sheet p-4" aria-labelledby="admin-pages-title">
            <h2 id="admin-pages-title" className="px-1 font-semibold text-ink">
              Manage
            </h2>
            <ul className="mt-1 divide-y divide-line-soft">
              {adminPages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className="group -mx-1 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-well">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                          {page.title}
                        </span>
                        {page.meta ? <span className="figure text-xs text-ink-3">{page.meta}</span> : null}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-2">{page.description}</span>
                    </span>
                    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="sheet p-5" aria-labelledby="latest-announcements-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="latest-announcements-title" className="font-semibold text-ink">
                Latest announcements
              </h2>
              <Link href="/admin/announcements" className="text-link text-sm">
                View all
              </Link>
            </div>
            {recentAnnouncements.length > 0 ? (
              <ul className="mt-3 space-y-4">
                {recentAnnouncements.map((item) => (
                  <li key={item.id}>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      {item.isPublished ? (
                        <StatusPill tone="success">Published</StatusPill>
                      ) : (
                        <StateTag tone="muted">Draft</StateTag>
                      )}
                      <span>{AUDIENCE_LABEL[item.audience] ?? item.audience}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(item.createdAt, now)}</span>
                    </p>
                    <p className="mt-1 font-semibold leading-snug text-ink">{item.title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-3">No announcements yet. Write one from the Announcements page.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
