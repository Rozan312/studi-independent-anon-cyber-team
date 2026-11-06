import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { UserRoleForm } from "@/components/admin/user-role-form";
import { bodyCellClass, headCellClass, listPanelClass, panelHeadClass, panelMetaClass, panelTitleClass, tableRowClass } from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { getUserList } from "@/lib/services/admin-service";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Member",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin"
};

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

export default async function AdminUsersPage() {
  const profile = await requireRole(["ADMIN"]);
  const users = await getUserList();

  const countRole = (role: string) => users.filter((user) => user.role === role).length;
  const subtitle = `${plural(users.length, "account")} · ${plural(countRole("STUDENT"), "member")}, ${plural(
    countRole("INSTRUCTOR"),
    "instructor"
  )}, ${plural(countRole("ADMIN"), "admin")}`;

  return (
    <AppShell title="Users" subtitle={subtitle} role={profile.role}>
      <section className={listPanelClass} aria-labelledby="accounts-title">
        <div className={panelHeadClass}>
          <h2 id="accounts-title" className={panelTitleClass}>
            All accounts
          </h2>
          {users.length > 0 ? <p className={panelMetaClass}>Newest first</p> : null}
        </div>

        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">All accounts, newest first, with a form to change each role</caption>
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Name
                  </th>
                  <th scope="col" className={headCellClass}>
                    Username
                  </th>
                  <th scope="col" className={headCellClass}>
                    Email
                  </th>
                  <th scope="col" className={headCellClass}>
                    Role
                  </th>
                  <th scope="col" className={headCellClass}>
                    Joined
                  </th>
                  <th scope="col" className={headCellClass}>
                    Change role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => {
                  const isSelf = user.id === profile.id;
                  const name = user.fullName || user.username;

                  return (
                    <tr key={user.id} className={tableRowClass}>
                      <td className={`${bodyCellClass} whitespace-nowrap font-display font-semibold text-ink`}>
                        {name}
                        {isSelf ? <span className="ml-1.5 font-sans font-normal text-ink-3">(you)</span> : null}
                      </td>
                      <td className={`${bodyCellClass} whitespace-nowrap text-ink-2`}>{user.username}</td>
                      <td className={`${bodyCellClass} whitespace-nowrap text-ink-2`}>{user.email}</td>
                      <td className={bodyCellClass}>
                        <StatusPill tone="neutral">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                      </td>
                      <td className={`${bodyCellClass} figure whitespace-nowrap text-ink-2`}>{formatShortDate(user.createdAt)}</td>
                      <td className={bodyCellClass}>
                        <UserRoleForm userId={user.id} currentRole={user.role} userName={name} isSelf={isSelf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <EmptyState title="No accounts yet" message="Accounts appear here as soon as people sign up." />
          </div>
        )}
      </section>
    </AppShell>
  );
}
