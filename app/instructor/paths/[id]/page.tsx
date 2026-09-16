import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/card";
import { LearningPathForm } from "@/components/instructor/learning-path-form";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { panelClass } from "@/components/instructor/form-styles";
import { PageNotice } from "@/components/ui/page-notice";
import { toggleLearningPathPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { canManageContent, getLearningPathForEditor, listRoomsOutsidePath } from "@/lib/services/content-service";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";
import { PathRoomsEditor } from "@/components/instructor/path-rooms-editor";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

export default async function InstructorPathEditorPage({
  params,
  searchParams = {}
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireRole(["INSTRUCTOR"]);
  if (!UUID_PATTERN.test(params.id)) notFound();

  const [result, roomsOutside] = await Promise.all([getLearningPathForEditor(profile, params.id), listRoomsOutsidePath(params.id)]);
  if (!result) notFound();

  const { path, canManage } = result;
  const justCreated = searchParams.created === "1";

  const pathRooms = path.rooms.map((room) => {
    const availability = getRoomAvailability(room);
    return {
      id: room.id,
      title: room.title,
      orderIndex: room.orderIndex,
      isPublished: room.isPublished,
      points: room.points,
      taskCount: room._count.tasks,
      questionCount: room.quiz?._count.questions ?? 0,
      ownerLabel: room.createdBy?.username ?? "tanpa pemilik",
      scheduleLabel: room.isPublished && availability.isScheduled ? describeAvailability(availability) : null,
      coverImageUrl: room.coverImageUrl
    };
  });

  const candidateRooms = roomsOutside.map((room) => ({
    id: room.id,
    title: room.title,
    pathTitle: room.learningPath.title,
    isPublished: room.isPublished,
    canManage: canManageContent(profile, room.createdById)
  }));

  return (
    <AppShell title={path.title} subtitle={`Kelola metadata dan room di dalam learning path /learning-paths/${path.slug}`} role={profile.role}>
      {justCreated ? <PageNotice tone="success" title="Learning path dibuat" message="Sekarang tambahkan room ke path ini atau lengkapi deskripsinya." className="mb-6" /> : null}
      {!canManage ? (
        <PageNotice
          tone="warning"
          title="Mode baca saja"
          message={`Path ini dibuat oleh ${path.createdBy?.username ?? "instruktur lain"}. Hanya pembuatnya atau admin yang dapat mengubahnya.`}
          className="mb-6"
        />
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={path.isPublished ? "success" : "neutral"}>{path.isPublished ? "Published" : "Draft"}</StatusPill>
          <StatusPill tone="primary">{path.rooms.length} room</StatusPill>
          <span className="text-xs text-slate-500">Pemilik: {path.createdBy?.username ?? "seed / tanpa pemilik"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/instructor/paths" className="text-xs font-bold text-slate-400 hover:text-primary">
            Kembali ke daftar
          </Link>
          {path.isPublished ? (
            <Link href={`/learning-paths/${path.slug}`} className="text-xs font-bold text-primary hover:underline">
              Lihat sebagai student
            </Link>
          ) : null}
          <PublishToggleForm action={toggleLearningPathPublishAction} idField="pathId" id={path.id} isPublished={path.isPublished} disabled={!canManage} compact />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Metadata</p>
          <h3 className="mb-5 mt-1 text-lg font-semibold text-slate-100">Informasi learning path</h3>
          <LearningPathForm
            mode="edit"
            disabled={!canManage}
            path={{
              id: path.id,
              title: path.title,
              slug: path.slug,
              description: path.description,
              category: path.category,
              difficulty: path.difficulty,
              estimatedHours: path.estimatedHours,
              coverImageUrl: path.coverImageUrl
            }}
          />
        </section>

        <aside className={panelClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Modul</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Room di path ini ({path.rooms.length})</h3>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-slate-400">
            Setiap room adalah satu modul di path. Urutan di sini menentukan urutan yang dilihat student. Student hanya melihat room yang sudah
            dipublish dan sedang dibuka.
          </p>
          <PathRoomsEditor pathId={path.id} rooms={pathRooms} candidates={candidateRooms} canManagePath={canManage} />
        </aside>
      </div>
    </AppShell>
  );
}
