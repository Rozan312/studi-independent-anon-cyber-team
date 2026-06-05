import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getGlobalLeaderboard } from "@/lib/services/leaderboard-service";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireRole(["STUDENT"]);
  const leaderboard = await getGlobalLeaderboard(50);

  const myStanding = leaderboard.find((row) => row.user?.id === profile.id);
  const myRank = myStanding?.rank ?? null;
  const myPoints = myStanding?.points ?? 0;
  const topPoints = leaderboard[0]?.points ?? 0;
  const progressToTop = topPoints > 0 ? Math.round((myPoints / topPoints) * 100) : 0;

  return (
    <AppShell title="Global Leaderboard" subtitle="Peringkat dihitung dari task dan quiz completion yang valid di platform." role={profile.role}>
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <SectionHeader eyebrow="standing" title="Your Rank" />
          <div className="rounded-lg border border-primary-container/30 bg-primary-container/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">Current Position</p>
            <p className="mt-2 text-4xl font-black text-slate-100">{myRank ? `#${myRank}` : "-"}</p>
            <p className="mt-1 text-sm font-semibold text-primary">{myPoints.toLocaleString()} pts</p>
            <div className="mt-4">
              <ProgressBar value={Math.max(5, progressToTop)} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Selesaikan task dan quiz untuk menaikkan posisi secara otomatis.</p>
          </div>
        </Card>

        <Card>
          <SectionHeader
            eyebrow="ranking"
            title="Top Learners"
            action={<StatusPill tone="primary">{leaderboard.length} users</StatusPill>}
          />
          {leaderboard.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-6 text-center text-sm text-slate-400">
              Leaderboard belum memiliki poin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-3 pr-4 text-center">Rank</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="py-3 pl-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leaderboard.map((row) => {
                    const isMe = row.user?.id === profile.id;
                    const rankTone = row.rank === 1 ? "warning" : row.rank <= 3 ? "primary" : "neutral";

                    return (
                      <tr key={row.rank} className={isMe ? "bg-primary-container/10 text-slate-100" : "text-slate-300"}>
                        <td className="py-4 pr-4 text-center">
                          <StatusPill tone={rankTone}>#{row.rank}</StatusPill>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-xs font-black text-primary">
                              {(row.user?.fullName ?? row.user?.username ?? "??").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-100">
                                {row.user?.fullName ?? row.user?.username ?? "Learner"}
                                {isMe ? <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-black text-slate-950">YOU</span> : null}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">{row.user?.username ?? "local-user"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill tone="success">{row.rank <= 3 ? "Top performer" : "Active"}</StatusPill>
                        </td>
                        <td className="py-4 pl-4 text-right font-mono text-sm font-bold text-primary">
                          {row.points.toLocaleString()} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
