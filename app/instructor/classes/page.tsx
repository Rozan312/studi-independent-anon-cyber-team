import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/card";
import { listPanelClass, panelHeadClass, panelMetaClass, panelTitleClass } from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import { getInstructorClasses } from "@/lib/services/instructor-service";

export const metadata: Metadata = { title: "Classes" };
export const dynamic = "force-dynamic";

export default async function InstructorClassesPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const classes = await getInstructorClasses(profile.id);
  const memberTotal = classes.reduce((sum, classRecord) => sum + classRecord._count.members, 0);

  return (
    <AppShell
      title="Classes"
      subtitle="Classes assigned to you. Their members appear on the Members page."
      role={profile.role}
      actions={
        <Link href="/instructor/students" className="btn-secondary">
          View members
        </Link>
      }
    >
      <section className={listPanelClass} aria-labelledby="classes-title">
        <div className={panelHeadClass}>
          <h2 id="classes-title" className={panelTitleClass}>
            Your classes
          </h2>
          {classes.length > 0 ? (
            <p className={panelMetaClass}>
              {classes.length} {classes.length === 1 ? "class" : "classes"} · {formatNumber(memberTotal)} {memberTotal === 1 ? "member" : "members"}
            </p>
          ) : null}
        </div>

        {classes.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              title="No classes assigned yet"
              message="Classes can't be created in the app yet. Ask a platform admin to add you to a class; its members will then show up here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {classes.map((classRecord) => (
              <li key={classRecord.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-ink">{classRecord.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">{classRecord.description || "No description."}</p>
                  <p className="mt-1 text-xs text-ink-3">Created {formatShortDate(classRecord.createdAt)}</p>
                </div>
                {/* Jumlah member sebagai angka bersel di kanan, sejajar antarbaris. */}
                <div className="w-20 shrink-0 text-right">
                  <p className="field-label">Members</p>
                  <p className="figure mt-1 text-2xl font-bold leading-none text-ink">{formatNumber(classRecord._count.members)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-sm text-ink-3">Class names and memberships are managed outside the app for now; this page is read-only.</p>
    </AppShell>
  );
}
