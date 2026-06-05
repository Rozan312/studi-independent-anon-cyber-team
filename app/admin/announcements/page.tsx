import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { listAnnouncements } from "@/lib/services/admin-service";
import { StatusPill } from "@/components/card";
import { AnnouncementCreateForm, AnnouncementEditForm } from "@/components/admin/announcement-forms";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const profile = await requireRole(["ADMIN"]);
  const announcements = await listAnnouncements();

  return (
    <AppShell title="Platform Bulletins" subtitle="Create, update, and publish global platform announcements and system updates." role={profile.role}>
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-slate-400">{announcements.length} active announcements</h3>
        <StatusPill tone="primary">Admin only</StatusPill>
      </div>

      <div className="mb-6">
        <AnnouncementCreateForm />
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="glass-panel rounded-xl p-5 hover:border-primary-container/40 transition-colors relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
            
            <div className="flex justify-between items-start gap-4 mb-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 group-hover:text-primary transition-colors">{announcement.title}</h4>
                <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider font-mono">BULLETIN ID: {announcement.id.substring(0, 8)}</p>
              </div>
              <StatusPill tone={announcement.isPublished ? "success" : "neutral"}>
                {announcement.isPublished ? "Published" : "Draft"}
              </StatusPill>
            </div>

            <AnnouncementEditForm
              announcement={{
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                audience: announcement.audience,
                isPublished: announcement.isPublished
              }}
            />

            <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span>By {announcement.createdBy.username} · Admin Operative</span>
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Synchronized</span>
            </div>
          </div>
        ))}
      </div>

    </AppShell>
  );
}
