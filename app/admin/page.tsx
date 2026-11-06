import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { PublishPill } from "@/components/instructor/publish-state";
import {
  bodyCellClass,
  headCellClass,
  listPanelClass,
  panelHeadClass,
  panelTitleClass,
  rowLinkClass,
  tableRowClass
} from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getPlatformStatistics } from "@/lib/services/admin-service";

export const metadata: Metadata = { title: "Admin overview" };
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

  // Jumlah baris genap agar dua kolom ringkasan sama panjang.
  const summaryRows: { label: string; value: string; note?: string }[] = [
    { label: "Accounts", value: formatNumber(stats.users) },
    { label: "Members", value: formatNumber(members) },
    { label: "Instructors", value: formatNumber(instructors) },
    { label: "Admins", value: formatNumber(admins) },
    { label: "Learning paths", value: formatNumber(stats.learningPaths), note: `${formatNumber(publishedPaths)} published` },
    { label: "Rooms", value: formatNumber(stats.rooms), note: `${formatNumber(publishedRooms)} published` },
    { label: "Rooms completed", value: formatNumber(stats.completedRooms), note: "all members" },
    { label: "Task answers", value: formatNumber(taskAnswers), note: `${formatNumber(correctTaskAnswers)} correct` },
    { label: "Announcements", value: formatNumber(stats.announcements), note: `${formatNumber(publishedAnnouncements)} published` },
    { label: "Lab sessions", value: formatNumber(stats.labSessions), note: "placeholders" }
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
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/*
            Ringkasan bergaris (label kiri, nilai kanan) dalam dua kolom; strip angka besar hanya ada di dasbor member.
            -mt-px menyembunyikan garis atas baris pertama tiap kolom di balik tepi panel (panel memotong luapan).
          */}
          <section className="sheet overflow-hidden px-5 sm:px-6" aria-label="Platform figures">
            <dl className="-mt-px grid text-sm md:grid-cols-2 md:gap-x-10">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
                  <dt className="shrink-0 text-ink-2">{row.label}</dt>
                  <dd className="min-w-0 text-right">
                    <span className="figure font-semibold text-ink">{row.value}</span>
                    {row.note ? <span className="text-ink-3"> · {row.note}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={listPanelClass} aria-labelledby="newest-accounts-title">
            <div className={panelHeadClass}>
              <h2 id="newest-accounts-title" className={panelTitleClass}>
                Newest accounts
              </h2>
              <Link href="/admin/users" className="text-link text-sm">
                All users
              </Link>
            </div>
            {recentUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={headCellClass}>
                        Name
                      </th>
                      <th scope="col" className={headCellClass}>
                        Role
                      </th>
                      <th scope="col" className={`${headCellClass} text-right`}>
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className={tableRowClass}>
                        <td className={bodyCellClass}>
                          <span className="block font-display font-semibold text-ink">
                            {user.fullName || user.username}
                            {user.id === profile.id ? <span className="ml-1.5 font-sans font-normal text-ink-3">(you)</span> : null}
                          </span>
                          <span className="block text-xs text-ink-3">{user.username}</span>
                        </td>
                        <td className={bodyCellClass}>
                          <StatusPill tone="neutral">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                        </td>
                        <td className={`${bodyCellClass} figure whitespace-nowrap text-right text-ink-2`}>{formatShortDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <EmptyState title="No accounts yet" message="Accounts appear here as soon as people sign up." />
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className={listPanelClass} aria-labelledby="admin-pages-title">
            <div className={panelHeadClass}>
              <h2 id="admin-pages-title" className={panelTitleClass}>
                Manage
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {adminPages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={rowLinkClass}>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink">{page.title}</span>
                        {page.meta ? <span className="figure text-xs text-ink-3">{page.meta}</span> : null}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-2">{page.description}</span>
                    </span>
                    <svg
                      viewBox="0 0 16 16"
                      className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-cyan-ink"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="m6 3.5 4.5 4.5L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={listPanelClass} aria-labelledby="latest-announcements-title">
            <div className={panelHeadClass}>
              <h2 id="latest-announcements-title" className={panelTitleClass}>
                Latest announcements
              </h2>
              <Link href="/admin/announcements" className="text-link text-sm">
                All announcements
              </Link>
            </div>
            {recentAnnouncements.length > 0 ? (
              <ul className="divide-y divide-line">
                {recentAnnouncements.map((item) => (
                  <li key={item.id} className="px-5 py-3 sm:px-6">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      <PublishPill published={item.isPublished} />
                      <span>{AUDIENCE_LABEL[item.audience] ?? item.audience}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(item.createdAt, now)}</span>
                    </p>
                    <p className="mt-1 font-display font-semibold leading-snug text-ink">{item.title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-ink-3 sm:px-6">No announcements yet. Write one from the Announcements page.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
