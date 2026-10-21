import { AppShell } from "@/components/app-shell";
import { EmptyState, StatusPill } from "@/components/card";
import { UserRoleForm } from "@/components/admin/user-role-form";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { getUserList } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Member",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin"
};

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

const headerCell = "field-label border-b border-line px-3 py-2.5 text-left";

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
      {users.length > 0 ? (
        <section className="sheet overflow-hidden" aria-label="All accounts">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">All accounts, newest first, with a form to change each role</caption>
              <thead className="bg-well">
                <tr>
                  <th scope="col" className={`${headerCell} pl-5`}>
                    Name
                  </th>
                  <th scope="col" className={headerCell}>
                    Username
                  </th>
                  <th scope="col" className={headerCell}>
                    Email
                  </th>
                  <th scope="col" className={headerCell}>
                    Role
                  </th>
                  <th scope="col" className={headerCell}>
                    Joined
                  </th>
                  <th scope="col" className={`${headerCell} pr-5`}>
                    Change role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {users.map((user) => {
                  const isSelf = user.id === profile.id;
                  const name = user.fullName || user.username;

                  return (
                    <tr key={user.id} className="hover:bg-well">
                      <td className="whitespace-nowrap py-2.5 pl-5 pr-3 font-semibold text-ink">
                        {name}
                        {isSelf ? <span className="ml-1.5 font-normal text-ink-3">(you)</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{user.username}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{user.email}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone="neutral">{ROLE_LABEL[user.role] ?? user.role}</StatusPill>
                      </td>
                      <td className="figure whitespace-nowrap px-3 py-2.5 text-ink-2">{formatShortDate(user.createdAt)}</td>
                      <td className="py-2.5 pl-3 pr-5">
                        <UserRoleForm userId={user.id} currentRole={user.role} userName={name} isSelf={isSelf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState title="No accounts yet" message="Accounts appear here as soon as people sign up." />
      )}
    </AppShell>
  );
}
