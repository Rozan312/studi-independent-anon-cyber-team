import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getInstructorClasses } from "@/lib/services/instructor-service";

export const dynamic = "force-dynamic";

export default async function InstructorClassesPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const classes = await getInstructorClasses(profile.id);

  return (
    <AppShell title="Your Classrooms" subtitle="Manage your assigned classes, review memberships and overview curriculum distribution." role={profile.role}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-2 glass-panel p-8 text-center text-slate-500 text-sm">
            No classes assigned yet. Contact administrators to set up your cohort!
          </div>
        ) : (
          classes.map((classRecord) => (
            <div key={classRecord.id} className="glass-panel rounded-xl p-5 hover:border-primary-container/40 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary-container/5 rounded-full blur-2xl group-hover:bg-primary-container/10 transition-all" />
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{classRecord.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{classRecord.description || "No curriculum description set."}</p>
                </div>
                <StatusPill tone="primary">
                  Classroom
                </StatusPill>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{classRecord._count.members} Members enrolled</span>
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Operational</span>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
