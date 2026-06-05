import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getUserList } from "@/lib/services/admin-service";
import { StatusPill } from "@/components/card";
import { UserRoleForm } from "@/components/admin/user-role-form";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await requireRole(["ADMIN"]);
  const users = await getUserList();

  return (
    <AppShell title="Users Management" subtitle="Manage the global registry, monitor authorization roles, and audit account access profiles." role={profile.role}>
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 bg-black/10">
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-black/15">
          <h3 className="text-base font-bold text-slate-100">Global Operative Registry</h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{users.length} profiles synchronized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-black/25 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Operative Profile</th>
                <th className="p-4 font-semibold">Security Role</th>
                <th className="p-4 font-semibold">Access Node</th>
                <th className="p-4 font-semibold text-right">Role Update</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-200 divide-y divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-primary">
                        {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "??"}
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-100">{user.fullName || "Unnamed Operative"}</span>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">UUID: {user.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusPill tone={user.role === "ADMIN" ? "warning" : user.role === "INSTRUCTOR" ? "primary" : "success"}>
                      {user.role}
                    </StatusPill>
                  </td>
                  <td className="p-4 text-slate-400 font-semibold">{user.email}</td>
                  <td className="p-4 text-right">
                    <UserRoleForm userId={user.id} currentRole={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
