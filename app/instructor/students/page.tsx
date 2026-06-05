import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getStudentProgress } from "@/lib/services/instructor-service";
import { StatusPill } from "@/components/card";

export const dynamic = "force-dynamic";

export default async function InstructorStudentsPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const progress = await getStudentProgress(profile.id);

  return (
    <AppShell title="Student Telemetry" subtitle="Monitor real-time progress ratios, completion thresholds, and sandbox status." role={profile.role}>
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 bg-black/10">
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-black/15">
          <h3 className="text-base font-bold text-slate-100 font-headline-xl">Operative Active Telemetry</h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{progress.length} active sessions</span>
        </div>

        {progress.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active student tracking logs recorded for your classrooms.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-black/25 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Operative</th>
                  <th className="p-4 font-semibold">Training Module</th>
                  <th className="p-4 font-semibold">Progress Percentage</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Last Synchronized</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-200 divide-y divide-slate-800/50">
                {progress.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-primary">
                          {row.user.fullName ? row.user.fullName.substring(0, 2).toUpperCase() : "??"}
                        </div>
                        <div>
                          <span className="font-semibold block text-slate-100">{row.user.fullName}</span>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">ID: {row.user.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-300">{row.room.title}</span>
                      <span className="text-slate-500 text-xs block mt-0.5">{row.room.category}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-950 border border-white/[0.04]">
                            <div className={`h-full rounded-full transition-all ${row.status === "COMPLETED" ? "bg-emerald-400" : "bg-primary-container"}`} style={{ width: `${row.progressPercentage}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold">{row.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusPill tone={row.status === "COMPLETED" ? "success" : "primary"}>
                        {row.status}
                      </StatusPill>
                    </td>
                    <td className="p-4 text-right text-xs text-slate-500 font-mono">
                      {new Date(row.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
