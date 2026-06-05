import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { getPlatformStatistics } from "@/lib/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireRole(["ADMIN"]);
  const stats = await getPlatformStatistics();

  const statRows = Object.entries(stats).map(([label, value]) => ({
    label,
    value,
    percent: Math.min(100, Math.max(8, Number(value) * 10))
  }));

  return (
    <AppShell title="Admin Platform Overview" subtitle="Pantau users, konten, announcement, dan lab session placeholder dari satu overview." role={profile.role}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statRows.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <StatusPill tone="success">Stable</StatusPill>
            </div>
            <p className="mt-5 text-3xl font-black text-slate-100">{stat.value}</p>
            <div className="mt-4">
              <ProgressBar value={stat.percent} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <SectionHeader eyebrow="operations" title="Platform Work Queue" />
          <div className="grid gap-3 md:grid-cols-3">
            <Link className="rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/admin/users">
              <p className="text-sm font-semibold text-slate-100">Manage Users</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Review profile registry and update roles through admin-only flows.</p>
            </Link>
            <Link className="rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/admin/platform">
              <p className="text-sm font-semibold text-slate-100">Platform Stats</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Inspect local development counts and lab placeholder records.</p>
            </Link>
            <Link className="rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40 hover:bg-primary-container/10" href="/admin/announcements">
              <p className="text-sm font-semibold text-slate-100">Announcements</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Prepare platform-wide learning and maintenance updates.</p>
            </Link>
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="security" title="Admin Notes" />
          <div className="space-y-3 text-xs leading-relaxed text-slate-500">
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">Role checks tetap server-side melalui guard dan middleware.</p>
            <p className="rounded-lg border border-white/[0.06] bg-black/20 p-3">Local mode aktif untuk development. Supabase Auth structure tetap tersedia untuk deployment.</p>
            <p className="rounded-lg border border-white/[0.06] bg-black/20 p-3">Lab orchestration belum menjalankan VM nyata. Semua status masih placeholder aman.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
