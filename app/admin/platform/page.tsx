import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getPlatformStatistics } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPlatformPage() {
  const profile = await requireRole(["ADMIN"]);
  const stats = await getPlatformStatistics();

  return (
    <AppShell title="Platform Statistics" subtitle="Active telemetry, cluster memory arrays, and transaction allocations." role={profile.role}>
      
      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="glass-panel rounded-xl p-5 hover:border-primary-container/40 transition-colors relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(78,222,163,0.7)]" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-100 font-mono text-glow">{value}</h3>
            
            <div className="w-full bg-slate-950 rounded-full h-1 mt-4 border border-white/[0.04] overflow-hidden">
              <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, Number(value) * 10))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Cluster Nodes Mock Allocation */}
      <div className="glass-panel rounded-xl p-6 bg-black/10">
        <h3 className="text-base font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Active VM Node Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="font-semibold text-slate-200 block">node-a-sgp-01</span>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Gateway Core · Linux Server</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">CPU load</span>
                <span className="text-xs font-bold text-primary block">42%</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-emerald-400 block">HEALTHY</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap border-t border-slate-800/60 pt-4">
            <div>
              <span className="font-semibold text-slate-200 block">node-b-hkg-02</span>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">AD Server · Windows Subnet</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">CPU load</span>
                <span className="text-xs font-bold text-primary block">88%</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Status</span>
                <span className="text-xs font-bold text-emerald-400 block">HEALTHY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </AppShell>
  );
}
