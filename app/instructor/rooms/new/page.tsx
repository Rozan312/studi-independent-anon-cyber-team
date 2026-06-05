import { AppShell } from "@/components/app-shell";
import { RoomBuilderForm } from "@/components/instructor/room-builder-form";
import { requireRole } from "@/lib/auth/guards";
import { listPublishedLearningPaths } from "@/lib/services/learning-path-service";

export const dynamic = "force-dynamic";

export default async function NewInstructorRoomPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const paths = await listPublishedLearningPaths();

  return (
    <AppShell title="Room Builder" subtitle="Create safe educational rooms, task checks, and publish-ready learning modules." role={profile.role}>
      <RoomBuilderForm paths={paths.map((path) => ({ id: path.id, title: path.title, category: path.category }))} />
    </AppShell>
  );
}
