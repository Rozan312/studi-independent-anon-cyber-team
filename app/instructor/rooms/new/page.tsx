import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RoomBuilderForm } from "@/components/instructor/room-builder-form";
import { requireRole } from "@/lib/auth/guards";
import { listLearningPathsForManagement } from "@/lib/services/content-service";

export const metadata: Metadata = { title: "New room" };
export const dynamic = "force-dynamic";

export default async function NewInstructorRoomPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const profile = await requireRole(["INSTRUCTOR"]);
  const paths = await listLearningPathsForManagement();
  const requestedPath = Array.isArray(searchParams.pathId) ? searchParams.pathId[0] : searchParams.pathId;

  return (
    <AppShell
      title="New room"
      subtitle="Create a room with its first tasks. After you save it, the room editor opens so you can write the material and add an optional quiz."
      role={profile.role}
      actions={
        <Link href="/instructor/rooms" className="btn-secondary">
          All rooms
        </Link>
      }
    >
      <RoomBuilderForm
        defaultPathId={requestedPath ?? null}
        paths={paths.map((path) => ({ id: path.id, title: path.isPublished ? path.title : `${path.title} (draft)`, category: path.category }))}
      />
    </AppShell>
  );
}
