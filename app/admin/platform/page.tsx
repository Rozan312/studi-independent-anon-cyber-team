import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill, type StatusTone } from "@/components/card";
import { bodyCellClass, headCellClass, listPanelClass, panelHeadClass, panelTitleClass, tableRowClass } from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getLabSessionOverview, getPlatformStatistics } from "@/lib/services/admin-service";

export const metadata: Metadata = { title: "Platform" };
export const dynamic = "force-dynamic";

// Warna status menurut makna: hijau berjalan, merah gagal, amber sedang disiapkan; sisanya netral (cyan khusus langkah berikutnya).
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

/**
 * Bilah horizontal jujur: lebar = bagian sebenarnya dari total, tanpa lebar minimum.
 * Netral untuk pembagian akun/lab; hijau untuk konten terbit, sama dengan pill Published.
 */
function ShareBar({ count, total, tone = "ink", label }: { count: number; total: number; tone?: "green" | "ink"; label: string }) {
  const percent = percentOf(count, total);

  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${label}: ${formatNumber(count)} of ${formatNumber(total)}`}>
      <div className={`h-full rounded-full ${tone === "green" ? "bg-green" : "bg-ink-3"}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default async function AdminPlatformPage() {
  const profile = await requireRole(["ADMIN"]);
  const now = new Date();

  const [stats, labs, roleCounts, publishedPaths, publishedRooms] = await Promise.all([
    getPlatformStatistics(),
    getLabSessionOverview(6),
    prisma.profile.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.learningPath.count({ where: { isPublished: true } }),
    prisma.room.count({ where: { isPublished: true } })
  ]);

  const roleCount = (role: string) => roleCounts.find((row) => row.role === role)?._count._all ?? 0;
  const labTotal = labs.byStatus.reduce((sum, row) => sum + row.count, 0);

  // Enam baris: dua kolom (md) dan tiga kolom (xl) sama panjang.
  const summaryRows: { label: string; value: number; note?: string }[] = [
    { label: "Accounts", value: stats.users },
    { label: "Learning paths", value: stats.learningPaths, note: `${formatNumber(publishedPaths)} published` },
    { label: "Rooms", value: stats.rooms, note: `${formatNumber(publishedRooms)} published` },
    { label: "Rooms completed", value: stats.completedRooms, note: "all members" },
    { label: "Lab sessions", value: stats.labSessions, note: "placeholders" },
    { label: "Announcements", value: stats.announcements }
  ];

  const contentRows = [
    { label: "Learning paths", published: publishedPaths, total: stats.learningPaths },
    { label: "Rooms", published: publishedRooms, total: stats.rooms }
  ];

  return (
    <AppShell title="Platform" subtitle="Accounts, content, and lab session records, counted from the database." role={profile.role}>
      {/*
        Ringkasan bergaris (label kiri, nilai kanan); strip angka besar hanya ada di dasbor member. Jumlah kolom per
        breakpoint sama dengan panel pembagian di bawahnya. -mt-px menyembunyikan garis atas baris pertama tiap kolom
        di balik tepi panel (panel memotong luapan).
      */}
      <section className="sheet overflow-hidden px-5 sm:px-6" aria-label="Platform figures">
        <dl className="-mt-px grid text-sm md:grid-cols-2 md:gap-x-12 xl:grid-cols-3">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
              <dt className="shrink-0 text-ink-2">{row.label}</dt>
              <dd className="min-w-0 text-right">
                <span className="figure font-semibold text-ink">{formatNumber(row.value)}</span>
                {row.note ? <span className="text-ink-3"> · {row.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Tiga pembagian dalam satu panel bergaris, bukan tiga kartu terpisah. */}
      <section className="sheet mt-5 overflow-hidden" aria-label="Breakdowns">
        <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
          <div className="bg-sheet p-5 sm:p-6" role="group" aria-labelledby="accounts-by-role-title">
            <h2 id="accounts-by-role-title" className={panelTitleClass}>
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
          </div>

          <div className="bg-sheet p-5 sm:p-6" role="group" aria-labelledby="content-status-title">
            <h2 id="content-status-title" className={panelTitleClass}>
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
                  <ShareBar count={row.published} total={row.total} tone="green" label={`Published ${row.label.toLowerCase()}`} />
                  <p className="mt-1 text-xs text-ink-3">
                    {row.total - row.published === 0 ? "No drafts" : `${formatNumber(row.total - row.published)} in draft`}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-sheet p-5 sm:p-6 md:col-span-2 xl:col-span-1" role="group" aria-labelledby="lab-status-title">
            <h2 id="lab-status-title" className={panelTitleClass}>
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
          </div>
        </div>
      </section>

      <section className={`${listPanelClass} mt-5`} aria-labelledby="recent-labs-title">
        <div className={panelHeadClass}>
          <div className="min-w-0">
            <h2 id="recent-labs-title" className={panelTitleClass}>
              Recent lab sessions
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">Up to six records, most recently updated first.</p>
          </div>
        </div>
        {labs.recent.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-3 sm:px-6">No lab sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Member
                  </th>
                  <th scope="col" className={headCellClass}>
                    Room
                  </th>
                  <th scope="col" className={headCellClass}>
                    Status
                  </th>
                  <th scope="col" className={headCellClass}>
                    VPN
                  </th>
                  <th scope="col" className={headCellClass}>
                    Machine
                  </th>
                  <th scope="col" className={headCellClass}>
                    Target IP
                  </th>
                  <th scope="col" className={`${headCellClass} text-right`}>
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {labs.recent.map((session) => (
                  <tr key={session.id} className={tableRowClass}>
                    <td className={`${bodyCellClass} whitespace-nowrap`}>
                      <span className="block font-display font-semibold text-ink">{session.user.username}</span>
                      <span className="block text-xs text-ink-3">{session.user.fullName}</span>
                    </td>
                    <td className={bodyCellClass}>
                      <Link href={`/rooms/${session.room.slug}`} className="text-link">
                        {session.room.title}
                      </Link>
                    </td>
                    <td className={bodyCellClass}>
                      <StatusPill tone={labStatusTone[session.status] ?? "neutral"}>{sentenceCase(session.status)}</StatusPill>
                    </td>
                    <td className={`${bodyCellClass} whitespace-nowrap text-ink-2`}>{sentenceCase(session.vpnStatus)}</td>
                    <td className={`${bodyCellClass} whitespace-nowrap text-ink-2`}>{sentenceCase(session.machineStatus)}</td>
                    <td className={`${bodyCellClass} whitespace-nowrap font-mono text-xs text-ink-2`}>{session.targetIp ?? "–"}</td>
                    <td className={`${bodyCellClass} figure whitespace-nowrap text-right text-ink-2`}>
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
