import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/card";
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
      <section className="sheet p-5 sm:p-6" aria-labelledby="classes-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="classes-title" className="text-lg font-bold text-ink">
            Your classes
          </h2>
          {classes.length > 0 ? (
            <p className="text-sm text-ink-3">
              {classes.length} {classes.length === 1 ? "class" : "classes"} · {formatNumber(memberTotal)} {memberTotal === 1 ? "member" : "members"}
            </p>
          ) : null}
        </div>

        {classes.length === 0 ? (
          <EmptyState
            title="No classes assigned yet"
            message="Classes can't be created in the app yet. Ask a platform admin to add you to a class; its members will then show up here."
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {classes.map((classRecord) => (
              <li key={classRecord.id} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink">{classRecord.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">{classRecord.description || "No description."}</p>
                  <p className="mt-1 text-xs text-ink-3">Created {formatShortDate(classRecord.createdAt)}</p>
                </div>
                <div className="shrink-0 sm:text-right">
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
