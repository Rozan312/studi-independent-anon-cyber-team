import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Figure, StatusPill, type StatusTone } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getLabSessionOverview, getPlatformStatistics } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

// Tinta stempel menurut makna: hijau berjalan, merah gagal, amber sedang disiapkan; sisanya netral (cyan khusus langkah berikutnya).
const labStatusTone: Record<string, StatusTone> = {
  READY: "neutral",
  STARTING: "warning",
  RUNNING: "success",
  STOPPED: "neutral",
  EXPIRED: "neutral",
  ERROR: "danger"
};

const ROLE_ROWS = [
  { role: "STUDENT", label: "Members" },
  { role: "INSTRUCTOR", label: "Instructors" },
  { role: "ADMIN", label: "Admins" }
] as const;

/** "RUNNING" -> "Running", "DISCONNECTED" -> "Disconnected". */
function sentenceCase(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function percentOf(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

/** Bilah horizontal jujur: lebar = bagian sebenarnya dari total, tanpa lebar minimum. */
function ShareBar({ count, total, tone = "ink", label }: { count: number; total: number; tone?: "violet" | "ink"; label: string }) {
  const percent = percentOf(count, total);

  return (
    <div
      className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft"
      role="img"
      aria-label={`${label}: ${formatNumber(count)} of ${formatNumber(total)}`}
    >
      <div className={`h-full rounded-full ${tone === "violet" ? "bg-violet" : "bg-ink-3"}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

const headerCell = "field-label border-b border-line px-3 py-2.5 text-left";

export default async function AdminPlatformPage() {
  const profile = await requireRole(["ADMIN"]);
  const now = new Date();

  // Distribusi tambahan (read-only): role akun dan status terbit konten.
  const [stats, labs, roleCounts, publishedPaths, publishedRooms] = await Promise.all([
    getPlatformStatistics(),
    getLabSessionOverview(6),
    prisma.profile.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.learningPath.count({ where: { isPublished: true } }),
    prisma.room.count({ where: { isPublished: true } })
  ]);

  const roleCount = (role: string) => roleCounts.find((row) => row.role === role)?._count._all ?? 0;
  const labTotal = labs.byStatus.reduce((sum, row) => sum + row.count, 0);

  const figures = [
    { label: "Accounts", value: stats.users },
    { label: "Learning paths", value: stats.learningPaths, note: `${formatNumber(publishedPaths)} published` },
    { label: "Rooms", value: stats.rooms, note: `${formatNumber(publishedRooms)} published` },
    { label: "Rooms completed", value: stats.completedRooms, note: "Across all members" },
    { label: "Lab sessions", value: stats.labSessions, note: "Placeholder records" },
    { label: "Announcements", value: stats.announcements }
  ];

  const contentRows = [
    { label: "Learning paths", published: publishedPaths, total: stats.learningPaths },
    { label: "Rooms", published: publishedRooms, total: stats.rooms }
  ];

  return (
    <AppShell title="Platform" subtitle="Accounts, content, and lab session records, counted from the database." role={profile.role}>
      <section className="sheet overflow-hidden" aria-label="Platform figures">
        <div className="grid grid-cols-2 gap-px bg-line-soft sm:grid-cols-3">
          {figures.map((figure) => (
            <Figure key={figure.label} className="bg-sheet p-4" label={figure.label} value={formatNumber(figure.value)} note={figure.note} />
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <section className="sheet p-5" aria-labelledby="accounts-by-role-title">
          <h2 id="accounts-by-role-title" className="font-semibold text-ink">
            Accounts by role
          </h2>
          <ul className="mt-4 space-y-3.5">
            {ROLE_ROWS.map((row) => {
              const count = roleCount(row.role);
              return (
                <li key={row.role}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">{row.label}</span>
                    <span className="figure text-ink-2">
                      <span className="font-semibold text-ink">{formatNumber(count)}</span>
                      <span className="ml-1.5 text-ink-3">{Math.round(percentOf(count, stats.users))}%</span>
                    </span>
                  </div>
                  <ShareBar count={count} total={stats.users} label={row.label} />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="sheet p-5" aria-labelledby="content-status-title">
          <h2 id="content-status-title" className="font-semibold text-ink">
            Published content
          </h2>
          <ul className="mt-4 space-y-3.5">
            {contentRows.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">{row.label}</span>
                  <span className="figure text-ink-2">
                    <span className="font-semibold text-ink">{formatNumber(row.published)}</span> of {formatNumber(row.total)}
                  </span>
                </div>
                <ShareBar count={row.published} total={row.total} tone="violet" label={`Published ${row.label.toLowerCase()}`} />
                <p className="mt-1 text-xs text-ink-3">
                  {row.total - row.published === 0 ? "No drafts" : `${formatNumber(row.total - row.published)} in draft`}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sheet p-5 md:col-span-2 xl:col-span-1" aria-labelledby="lab-status-title">
          <h2 id="lab-status-title" className="font-semibold text-ink">
            Lab sessions by status
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Lab sessions are placeholder records. No real machines, VPN connections, or containers are monitored.
          </p>
          {labs.byStatus.length === 0 ? (
            <p className="mt-4 text-sm text-ink-3">No lab sessions recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {labs.byStatus.map((row) => (
                <li key={row.status}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">{sentenceCase(row.status)}</span>
                    <span className="figure text-ink-2">
                      <span className="font-semibold text-ink">{formatNumber(row.count)}</span>
                      <span className="ml-1.5 text-ink-3">{Math.round(percentOf(row.count, labTotal))}%</span>
                    </span>
                  </div>
                  <ShareBar count={row.count} total={labTotal} label={sentenceCase(row.status)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="sheet mt-5 overflow-hidden" aria-labelledby="recent-labs-title">
        <div className="px-5 pb-3 pt-5">
          <h2 id="recent-labs-title" className="text-lg font-bold text-ink">
            Recent lab sessions
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">Up to six records, most recently updated first.</p>
        </div>
        {labs.recent.length === 0 ? (
          <p className="border-t border-line-soft px-5 py-4 text-sm text-ink-3">No lab sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-well">
                <tr>
                  <th scope="col" className={`${headerCell} pl-5`}>
                    Member
                  </th>
                  <th scope="col" className={headerCell}>
                    Room
                  </th>
                  <th scope="col" className={headerCell}>
                    Status
                  </th>
                  <th scope="col" className={headerCell}>
                    VPN
                  </th>
                  <th scope="col" className={headerCell}>
                    Machine
                  </th>
                  <th scope="col" className={headerCell}>
                    Target IP
                  </th>
                  <th scope="col" className={`${headerCell} pr-5 text-right`}>
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {labs.recent.map((session) => (
                  <tr key={session.id} className="hover:bg-well">
                    <td className="whitespace-nowrap py-2.5 pl-5 pr-3">
                      <span className="block font-semibold text-ink">{session.user.username}</span>
                      <span className="block text-xs text-ink-3">{session.user.fullName}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/rooms/${session.room.slug}`} className="text-link">
                        {session.room.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill tone={labStatusTone[session.status] ?? "neutral"}>{sentenceCase(session.status)}</StatusPill>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{sentenceCase(session.vpnStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{sentenceCase(session.machineStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-ink-2">{session.targetIp ?? "–"}</td>
                    <td className="figure whitespace-nowrap py-2.5 pl-3 pr-5 text-right text-ink-2">
                      <time dateTime={session.updatedAt.toISOString()} title={formatShortDate(session.updatedAt)}>
                        {formatRelativeTime(session.updatedAt, now)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
