import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const profile = await requireRole(["STUDENT"]);
  const rows = await prisma.userRoomProgress.findMany({
    where: { userId: profile.id },
    include: { room: true },
    orderBy: { updatedAt: "desc" }
  });

  const totalRooms = rows.length;
  const completedRooms = rows.filter((row) => row.status === "COMPLETED" || row.progressPercentage === 100).length;
  const inProgressRooms = rows.filter((row) => row.status === "IN_PROGRESS").length;
  const avgProgress = totalRooms > 0 ? Math.round(rows.reduce((acc, row) => acc + row.progressPercentage, 0) / totalRooms) : 0;

  const stats = [
    { label: "Overall Progress", value: `${avgProgress}%`, tone: "primary" as const },
    { label: "Completed Rooms", value: completedRooms, tone: "success" as const },
    { label: "In Progress", value: inProgressRooms, tone: "warning" as const },
    { label: "Tracked Rooms", value: totalRooms, tone: "neutral" as const }
  ];

  return (
    <AppShell title="Learning Progress" subtitle="Pantau room yang sedang berjalan, progress task, dan histori sinkronisasi belajar." role={profile.role}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-h-32">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <StatusPill tone={stat.tone}>{stat.tone}</StatusPill>
            </div>
            <p className="mt-5 text-3xl font-black text-slate-100">{stat.value}</p>
            {stat.label === "Overall Progress" ? (
              <div className="mt-4">
                <ProgressBar value={avgProgress} />
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <SectionHeader eyebrow="history" title="Learning History" />
          {rows.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-6 text-center text-sm text-slate-400">
              Belum ada progress tersimpan. Mulai dari halaman{" "}
              <Link href="/rooms" className="font-bold text-primary hover:underline">
                Rooms
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-3 pr-4">Room</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="py-3 pl-4 text-right">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rows.map((row) => (
                    <tr key={row.id} className="text-slate-300">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-100">{row.room.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.room.category} / {row.room.difficulty}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill tone={row.status === "COMPLETED" ? "success" : "primary"}>{row.status}</StatusPill>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-40 items-center gap-3">
                          <div className="w-28">
                            <ProgressBar value={row.progressPercentage} />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-200">{row.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 pl-4 text-right text-xs text-slate-500">
                        {new Date(row.updatedAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader eyebrow="focus" title="Next Steps" />
          <div className="space-y-3 text-sm text-slate-400">
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4">
              <p className="font-semibold text-slate-100">Lanjutkan room aktif</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Room dengan status in progress akan memperbarui leaderboard setelah task atau quiz valid selesai.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4">
              <p className="font-semibold text-slate-100">Gunakan lab secara bertanggung jawab</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Lab saat ini masih placeholder lokal dan hanya untuk konten edukatif yang aman.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
