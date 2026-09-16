import { AppShell } from "@/components/app-shell";
import { RoomBuilderForm } from "@/components/instructor/room-builder-form";
import { requireRole } from "@/lib/auth/guards";
import { listLearningPathsForManagement } from "@/lib/services/content-service";

export const dynamic = "force-dynamic";

export default async function NewInstructorRoomPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const profile = await requireRole(["INSTRUCTOR"]);
  const paths = await listLearningPathsForManagement();
  const requestedPath = Array.isArray(searchParams.pathId) ? searchParams.pathId[0] : searchParams.pathId;

  return (
    <AppShell
      title="Room Builder"
      subtitle="Buat room baru dengan task awal. Setelah tersimpan, editor room terbuka untuk mengisi materi dan quiz."
      role={profile.role}
    >
      <RoomBuilderForm
        defaultPathId={requestedPath ?? null}
        paths={paths.map((path) => ({ id: path.id, title: path.isPublished ? path.title : `${path.title} (draft)`, category: path.category }))}
      />
    </AppShell>
  );
}
