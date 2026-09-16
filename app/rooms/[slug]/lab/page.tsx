import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { getRoomAvailability } from "@/lib/learning/availability";
import { RESPONSIBLE_LAB_USE_TEXT, getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";
import { getRoomBySlug } from "@/lib/services/room-service";

export const dynamic = "force-dynamic";

export default async function RoomLabPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  // Room yang belum dibuka atau sudah ditutup hanya bisa dipreview instruktur/admin.
  if (!getRoomAvailability(room).isOpen && !hasRoleAccess(profile.role, ["INSTRUCTOR"])) {
    redirect(`/rooms/${room.slug}`);
  }

  const session = await getLatestLabSessionForRoom(profile.id, room.id);

  return (
    <main className="cyber-grid min-h-screen bg-background text-slate-100">
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/rooms/${room.slug}`} className="rounded-md border border-border bg-white/[0.03] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.07]">
              Back
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Lab workspace</p>
              <h1 className="text-lg font-semibold text-slate-50">{room.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="success">VPN {session?.vpnStatus ?? "DISCONNECTED"}</StatusPill>
            <StatusPill tone={session?.machineStatus === "ONLINE" ? "success" : "neutral"}>Target {session?.machineStatus ?? "OFFLINE"}</StatusPill>
            <StatusPill tone="primary">{session?.status ?? "READY"}</StatusPill>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-73px)] gap-4 p-4 xl:grid-cols-[340px_1fr_380px]">
        <aside className="space-y-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Instructions</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">Task 1 of {room.tasks.length}</h2>
            <p className="mt-2 text-sm text-slate-400">{room.description}</p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-50">Current task</p>
            <div className="mt-3 space-y-3">
              {room.tasks.slice(0, 3).map((task) => (
                <article key={task.id} className="rounded-md border border-border bg-black/20 p-3">
                  <p className="text-sm font-medium text-slate-100">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{task.description}</p>
                </article>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-50">Responsible use</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{RESPONSIBLE_LAB_USE_TEXT}</p>
          </Card>
        </aside>

        <section className="glass-panel overflow-hidden rounded-lg">
          <div className="flex items-center justify-between border-b border-border bg-[#f6f8fb] px-4 py-3 text-slate-900">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="rounded-md bg-white px-3 py-1 text-xs text-slate-500">http://safe-training.local/{room.slug}</div>
            <span className="text-xs text-slate-400">SafeShop</span>
          </div>
          <div className="min-h-[560px] bg-white p-8 text-slate-900">
            <nav className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
              <p className="text-lg font-semibold text-blue-700">SafeShop</p>
              <div className="flex gap-5 text-sm text-slate-500">
                <span>Home</span>
                <span>Products</span>
                <span className="font-medium text-blue-700">My Account</span>
              </div>
            </nav>
            <section className="max-w-md rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-lg font-semibold">User Profile</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">JS</span>
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-slate-500">Student User (ID: 1001)</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd>john.smith@training.local</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Role</dt>
                  <dd>Standard User</dd>
                </div>
              </dl>
              <div className="mt-5 rounded-md border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-400">No recent orders found.</div>
            </section>
          </div>
        </section>

        <aside className="glass-panel flex min-h-[560px] flex-col rounded-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Terminal</p>
            <p className="text-sm font-semibold text-slate-50">training-shell</p>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden p-4 font-mono text-xs leading-5 text-slate-300">
            <p className="text-slate-500">Welcome to Anon Cyber Team Interactive Lab Environment.</p>
            <p className="text-slate-500">Use only approved educational actions inside this placeholder lab.</p>
            <p><span className="text-success">student@cyber-lab</span>:~$ session status</p>
            <p>Lab: {session?.status ?? "READY"}</p>
            <p>VPN: {session?.vpnStatus ?? "DISCONNECTED"}</p>
            <p>Machine: {session?.machineStatus ?? "OFFLINE"}</p>
            <p>Target: {session?.targetIp ?? "not assigned"}</p>
            <p className="pt-4 text-slate-500">No real VM orchestration is connected yet.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
            <button className="rounded-md border border-border bg-white/[0.03] px-3 py-2 text-sm text-slate-300">Reset lab</button>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white">Submit flag</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
