import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getLabSessionOverview, getPlatformStatistics } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

const statLabels: Record<string, string> = {
  users: "Users",
  learningPaths: "Learning Paths",
  rooms: "Rooms",
  completedRooms: "Completed Rooms",
  labSessions: "Lab Sessions",
  announcements: "Announcements"
};

const labStatusTone: Record<string, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  READY: "primary",
  STARTING: "warning",
  RUNNING: "success",
  STOPPED: "neutral",
  EXPIRED: "neutral",
  ERROR: "danger"
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AdminPlatformPage() {
  const profile = await requireRole(["ADMIN"]);
  const [stats, labs] = await Promise.all([getPlatformStatistics(), getLabSessionOverview(6)]);
  const maxStat = Math.max(1, ...Object.values(stats));

  return (
    <AppShell
      title="Platform Statistics"
      subtitle="Ringkasan pengguna, konten, dan status lab session placeholder dari database."
      role={profile.role}
    >
      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="glass-panel rounded-xl p-5 hover:border-primary-container/40 transition-colors relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{statLabels[key] ?? key}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(78,222,163,0.7)]" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-100 font-mono text-glow">{value}</h3>

            <div className="w-full bg-slate-950 rounded-full h-1 mt-4 border border-white/[0.04] overflow-hidden">
              <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.max(4, Math.round((value / maxStat) * 100))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Lab session placeholder overview */}
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="glass-panel rounded-xl p-6 bg-black/10">
          <h3 className="text-base font-bold text-slate-100 mb-1 border-b border-slate-800 pb-2">Lab Sessions by Status</h3>
          <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
            Status berasal dari tabel LabSession. Belum ada VM, VPN, atau container sungguhan yang dipantau.
          </p>
          {labs.byStatus.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada lab session tercatat.</p>
          ) : (
            <ul className="space-y-3">
              {labs.byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-3">
                  <StatusPill tone={labStatusTone[row.status] ?? "neutral"}>{row.status}</StatusPill>
                  <span className="font-mono text-sm font-bold text-slate-100">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 bg-black/10">
          <h3 className="text-base font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Recent Lab Sessions</h3>
          {labs.recent.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada lab session tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-2 pr-4">User</th>
                    <th className="px-4 py-2">Room</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Target IP</th>
                    <th className="py-2 pl-4 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {labs.recent.map((session) => (
                    <tr key={session.id}>
                      <td className="py-3 pr-4">
                        <span className="block font-semibold text-slate-100">{session.user.username}</span>
                        <span className="block text-[11px] text-slate-500">{session.user.fullName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/rooms/${session.room.slug}`} className="text-slate-200 hover:text-primary">
                          {session.room.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusPill tone={labStatusTone[session.status] ?? "neutral"}>{session.status}</StatusPill>
                          <StatusPill tone="neutral">VPN {session.vpnStatus}</StatusPill>
                          <StatusPill tone="neutral">{session.machineStatus}</StatusPill>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{session.targetIp ?? "-"}</td>
                      <td className="py-3 pl-4 text-right text-xs text-slate-400">{formatDateTime(session.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
