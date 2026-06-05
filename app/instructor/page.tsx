import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getInstructorClasses, getStudentProgress } from "@/lib/services/instructor-service";

export const dynamic = "force-dynamic";

export default async function InstructorPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const [classes, progress] = await Promise.all([
    getInstructorClasses(profile.id),
    getStudentProgress(profile.id)
  ]);

  const activeStudentsCount = new Set(progress.map((row) => row.userId)).size;
  const avgCompletion = progress.length > 0 ? Math.round(progress.reduce((acc, row) => acc + row.progressPercentage, 0) / progress.length) : 0;
  const completedRows = progress.filter((row) => row.status === "COMPLETED").length;

  const stats = [
    { label: "Classes", value: classes.length, tone: "primary" as const },
    { label: "Tracked Students", value: activeStudentsCount, tone: "success" as const },
    { label: "Avg Completion", value: `${avgCompletion}%`, tone: "warning" as const },
    { label: "Completed Rooms", value: completedRows, tone: "success" as const }
  ];

  return (
    <AppShell title="Instructor Overview" subtitle="Monitor cohort progress, room activity, and student completion status." role={profile.role}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <StatusPill tone={stat.tone}>{stat.tone}</StatusPill>
            </div>
            <p className="mt-5 text-3xl font-black text-slate-100">{stat.value}</p>
            {stat.label === "Avg Completion" ? (
              <div className="mt-4">
                <ProgressBar value={avgCompletion} />
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <SectionHeader
            eyebrow="students"
            title="Recent Student Progress"
            action={
              <Link href="/instructor/students" className="text-xs font-bold text-primary hover:underline">
                View students
              </Link>
            }
          />
          {progress.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-6 text-center text-sm text-slate-400">
              Belum ada progress dari class yang ditugaskan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-3 pr-4">Student</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="py-3 pl-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {progress.slice(0, 8).map((row) => (
                    <tr key={row.id} className="text-slate-300">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-100">{row.user.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.user.username}</p>
                      </td>
                      <td className="px-4 py-4">{row.room.title}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-40 items-center gap-3">
                          <div className="w-28">
                            <ProgressBar value={row.progressPercentage} />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-200">{row.progressPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <StatusPill tone={row.status === "COMPLETED" ? "success" : "primary"}>{row.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader eyebrow="actions" title="Instructor Tools" />
          <div className="space-y-3">
            <Link className="block rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/instructor/classes">
              <p className="text-sm font-semibold text-slate-100">Classrooms</p>
              <p className="mt-1 text-xs text-slate-500">Review assigned cohorts.</p>
            </Link>
            <Link className="block rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/instructor/rooms">
              <p className="text-sm font-semibold text-slate-100">Room Management</p>
              <p className="mt-1 text-xs text-slate-500">Inspect published and draft rooms.</p>
            </Link>
            <Link className="block rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/instructor/rooms/new">
              <p className="text-sm font-semibold text-slate-100">New Room Draft</p>
              <p className="mt-1 text-xs text-slate-500">UI scaffold only, server action pending.</p>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
