import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StateTag } from "@/components/paper/state-tag";
import { PageNotice } from "@/components/ui/page-notice";
import { RESPONSIBLE_LAB_USE_TEXT, getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";
import { publishedRoomTitle } from "@/lib/services/page-title-service";
import { loadMemberRoom } from "../room-view";

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
  const view = await loadMemberRoom(params.slug);

  // Room yang belum dibuka atau sudah ditutup hanya bisa dipreview instruktur/admin.
  if (view.access === "schedule") redirect(`/rooms/${view.room.slug}`);

  const { profile, room } = view;
  const session = await getLatestLabSessionForRoom(profile.id, room.id);

  // Lab belum terhubung ke VM/VPN: semua nilai sesi di bawah adalah catatan placeholder, bukan status langsung.
  const sessionFields = [
    { label: "Lab", value: session && session.status !== "READY" ? humanize(session.status) : "Not connected", mono: false },
    { label: "VPN", value: humanize(session?.vpnStatus ?? "DISCONNECTED"), mono: false },
    { label: "Machine", value: humanize(session?.machineStatus ?? "OFFLINE"), mono: false },
    { label: "Target IP", value: session?.targetIp ?? "Not assigned", mono: Boolean(session?.targetIp) }
  ];

  // Pratinjau mengikuti urutan baca: task bab pertama dulu (task tanpa bab tampil di bab terakhir).
  const readingOrder = room.chapters.length > 0 ? room.chapters.flatMap((chapter) => view.chapterTasks.get(chapter.id) ?? []) : room.tasks;
  const previewTasks = readingOrder.slice(0, 3);
  const remainingTasks = room.tasks.length - previewTasks.length;

  return (
    <AppShell
      title={`${room.title} lab`}
      subtitle="Lab workspace placeholder. No virtual machines or VPN are connected yet."
      role={profile.role}
      actions={
        // Saklar tema sudah ada di rail dan bar atas ponsel, jadi header lab hanya membawa jalan kembali ke room.
        <Link href={`/rooms/${room.slug}`} className="btn-secondary">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to room
        </Link>
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
          <section className="sheet overflow-hidden" aria-labelledby="lab-target-title">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-5 pb-3 pt-4 sm:px-6">
              <h2 id="lab-target-title" className="text-base font-bold text-ink">
                Target
              </h2>
              <StateTag tone="muted">Not connected</StateTag>
            </div>
            {/* Area target kosong yang jujur: tidak ada mesin, jadi tidak ada tombol start atau alamat palsu. */}
            <div className="flex min-h-[240px] flex-col items-center justify-center bg-paper/60 px-5 py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-line-strong text-ink-3" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
                  <path d="M9 20h6M12 16.5V20" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 font-display font-semibold text-ink">No target running</p>
              <p className="mt-1 max-w-sm text-sm text-ink-3">
                The training target opens here once a lab machine is connected to this room. Until then there is nothing to browse or scan.
              </p>
            </div>
          </section>

          <section className="sheet overflow-hidden" aria-labelledby="lab-tasks-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
              <h2 id="lab-tasks-title" className="text-base font-bold text-ink">
                Tasks in this room
              </h2>
              <p className="figure text-sm text-ink-3">
                {room.tasks.length} {room.tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
            {previewTasks.length > 0 ? (
              <ol className="divide-y divide-line">
                {previewTasks.map((task, index) => (
                  <li key={task.id} className="flex items-start gap-3.5 px-5 py-4 sm:px-6">
                    <span
                      aria-hidden="true"
                      className="figure mt-px grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong text-[0.6875rem] font-bold text-ink-3"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="pt-0.5 font-display font-semibold leading-snug text-ink">{task.title}</p>
                      <p className="mt-0.5 max-w-[68ch] text-sm leading-relaxed text-ink-2">{task.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-4 text-sm text-ink-3 sm:px-6">This room has no tasks yet.</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line px-5 py-4 sm:px-6">
              <Link href={view.tasksHref} className="btn-primary">
                Answer tasks in the room
              </Link>
              {remainingTasks > 0 ? (
                <p className="text-sm text-ink-3">
                  {remainingTasks} more {remainingTasks === 1 ? "task" : "tasks"} in the room&apos;s chapters.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="sheet overflow-hidden" aria-labelledby="lab-session-title">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-5 pb-3 pt-4">
              <h2 id="lab-session-title" className="text-base font-bold text-ink">
                Session record
              </h2>
              <StateTag tone="muted">Placeholder</StateTag>
            </div>
            {/* Baris bergaris label kiri, nilai kanan, sama dengan fakta room di halaman room. */}
            <dl className="divide-y divide-line text-sm">
              {sessionFields.map((field) => (
                <div key={field.label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="shrink-0 text-ink-2">{field.label}</dt>
                  <dd className={`min-w-0 break-words text-right font-semibold text-ink-2 ${field.mono ? "font-mono" : "font-display"}`}>{field.value}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-ink-3">
              {session
                ? "Values come from your latest lab session record for this room. They are placeholders, not live machine status."
                : "No lab session has been recorded for this room. These are default placeholder values, not live machine status."}
            </p>
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
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
            <h2 id="lab-use-title" className="text-base font-bold text-ink">
              Responsible use
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{RESPONSIBLE_LAB_USE_TEXT}</p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
