import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StateTag } from "@/components/paper/state-tag";
import { NightModeToggle } from "@/components/theme/night-mode";
import { PageNotice } from "@/components/ui/page-notice";
import { requireRole } from "@/lib/auth/guards";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { getRoomAvailability } from "@/lib/learning/availability";
import { RESPONSIBLE_LAB_USE_TEXT, getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";
import { getRoomBySlug } from "@/lib/services/room-service";
import { publishedRoomTitle } from "@/lib/services/page-title-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const room = await publishedRoomTitle(params.slug);
  return { title: room ? `${room} lab` : "Lab" };
}

/** Nilai enum status (READY, DISCONNECTED, ...) ditampilkan dalam huruf kalimat. */
function humanize(value: string) {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function RoomLabPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  // Room yang belum dibuka atau sudah ditutup hanya bisa dipreview instruktur/admin.
  if (!getRoomAvailability(room).isOpen && !hasRoleAccess(profile.role, ["INSTRUCTOR"])) {
    redirect(`/rooms/${room.slug}`);
  }

  const session = await getLatestLabSessionForRoom(profile.id, room.id);

  // Lab belum terhubung ke VM/VPN: semua nilai sesi di bawah adalah catatan placeholder, bukan status langsung.
  const sessionFields = [
    { label: "Lab", value: session && session.status !== "READY" ? humanize(session.status) : "Not connected", mono: false },
    { label: "VPN", value: humanize(session?.vpnStatus ?? "DISCONNECTED"), mono: false },
    { label: "Machine", value: humanize(session?.machineStatus ?? "OFFLINE"), mono: false },
    { label: "Target IP", value: session?.targetIp ?? "Not assigned", mono: Boolean(session?.targetIp) }
  ];

  const previewTasks = room.tasks.slice(0, 3);
  const remainingTasks = room.tasks.length - previewTasks.length;

  return (
    <AppShell
      title={`${room.title} lab`}
      subtitle="Lab workspace placeholder. No virtual machines or VPN are connected yet."
      role={profile.role}
      actions={
        <>
          <NightModeToggle />
          <Link href={`/rooms/${room.slug}`} className="btn-secondary">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to room
          </Link>
        </>
      }
    >
      <PageNotice
        tone="info"
        title="Labs aren't connected yet"
        message="This page shows where the hands-on lab will live. There is no machine to start and no VPN to join, so the lab controls stay off. Answer the room's tasks from the material for now."
        className="mb-6"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="sheet p-5 sm:p-6" aria-labelledby="lab-target-title">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h2 id="lab-target-title" className="text-lg font-bold text-ink">
                Target
              </h2>
              <StateTag tone="muted">Not connected</StateTag>
            </div>
            <p className="mt-1 text-sm text-ink-2">The training target will open here once a lab machine is connected to this room.</p>
            <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-well px-5 py-10 text-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
                <path d="M9 20h6M12 16.5V20" strokeLinecap="round" />
              </svg>
              <p className="mt-3 font-semibold text-ink">No target running</p>
              <p className="mt-1 max-w-sm text-sm text-ink-3">Nothing is connected to this room yet, so there is nothing to browse or scan.</p>
            </div>
          </section>

          <section className="sheet p-5 sm:p-6" aria-labelledby="lab-tasks-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="lab-tasks-title" className="text-lg font-bold text-ink">
                Tasks in this room
              </h2>
              <p className="figure text-sm text-ink-3">
                {room.tasks.length} {room.tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            {previewTasks.length > 0 ? (
              <ol className="mt-3 divide-y divide-line-soft border-y border-line-soft">
                {previewTasks.map((task, index) => (
                  <li key={task.id} className="flex items-start gap-3 py-3">
                    <span
                      aria-hidden="true"
                      className="figure flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs font-bold text-ink-3"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-ink">{task.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{task.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-ink-3">This room has no tasks yet.</p>
            )}
            {remainingTasks > 0 ? (
              <p className="mt-3 text-sm text-ink-3">
                {remainingTasks} more {remainingTasks === 1 ? "task" : "tasks"} on the room page.
              </p>
            ) : null}
            <div className="mt-5">
              <Link href={`/rooms/${room.slug}#tasks`} className="btn-primary">
                Answer tasks in the room
              </Link>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="sheet overflow-hidden" aria-labelledby="lab-session-title">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pb-3 pt-4">
              <h2 id="lab-session-title" className="font-semibold text-ink">
                Session record
              </h2>
              <StateTag tone="muted">Placeholder</StateTag>
            </div>
            <dl className="grid grid-cols-2 border-t border-line-soft">
              {sessionFields.map((field, index) => (
                <div
                  key={field.label}
                  className={`min-w-0 p-4 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b" : ""} border-line-soft`}
                >
                  <dt className="field-label">{field.label}</dt>
                  <dd className={`mt-1 truncate text-sm font-semibold text-ink-2 ${field.mono ? "font-mono" : ""}`}>{field.value}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-line-soft px-4 py-3 text-xs leading-relaxed text-ink-3">
              {session
                ? "Values come from your latest lab session record for this room. They are placeholders, not live machine status."
                : "No lab session has been recorded for this room. These are default placeholder values, not live machine status."}
            </p>
            <div className="flex flex-wrap gap-2 border-t border-line-soft p-4">
              {/* TODO: aktifkan "Reset lab" dan "Submit flag" saat integrasi VM/VPN lab tersedia; sampai saat itu
                  keduanya nonaktif dengan penjelasan yang terlihat di bawahnya. */}
              <button type="button" disabled className="btn-secondary flex-1">
                Reset lab
              </button>
              <button type="button" disabled className="btn-secondary flex-1">
                Submit flag
              </button>
              <p className="w-full text-xs text-ink-3">These controls turn on once a lab machine is connected.</p>
            </div>
          </section>

          <section className="sheet p-5" aria-labelledby="lab-use-title">
            <h2 id="lab-use-title" className="font-semibold text-ink">
              Responsible use
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{RESPONSIBLE_LAB_USE_TEXT}</p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
