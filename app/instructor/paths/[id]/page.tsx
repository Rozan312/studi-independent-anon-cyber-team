import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/card";
import { LearningPathForm } from "@/components/instructor/learning-path-form";
import { PublishToggleForm } from "@/components/instructor/publish-toggle-form";
import { PublishPill } from "@/components/instructor/publish-state";
import { panelClass } from "@/components/instructor/form-styles";
import { PageNotice } from "@/components/ui/page-notice";
import { toggleLearningPathPublishAction } from "@/lib/actions/content-actions";
import { requireRole } from "@/lib/auth/guards";
import { formatShortDate } from "@/lib/format/date";
import { canManageContent, getLearningPathForEditor, listRoomsOutsidePath } from "@/lib/services/content-service";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";
import { PathRoomsEditor } from "@/components/instructor/path-rooms-editor";
import { EntityLogo } from "@/components/paper/entity-logo";

// Judul statis: halaman editor bisa memuat path yang belum terbit, jadi namanya tidak ditaruh di <title>.
export const metadata: Metadata = { title: "Path editor" };
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
  const publishedRoomCount = path.rooms.filter((room) => room.isPublished).length;

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
      ownerLabel: room.createdBy?.username ?? "No owner",
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

  const facts = [
    {
      label: "Rooms",
      value: (
        <>
          <span className="font-semibold">{path.rooms.length}</span>
          <span className="text-sm text-ink-3"> · {publishedRoomCount} published</span>
        </>
      ),
      figure: true
    },
    { label: "Difficulty", value: path.difficulty },
    { label: "Estimated time", value: `${path.estimatedHours} h`, figure: true },
    { label: "Category", value: path.category },
    { label: "Owner", value: path.createdBy ? `@${path.createdBy.username}` : "No owner" }
  ];

  return (
    <AppShell
      title={path.title}
      subtitle="Edit the path details and choose which rooms it contains, in order."
      role={profile.role}
      actions={
        <>
          <Link href="/instructor/paths" className="btn-secondary">
            All paths
          </Link>
          {path.isPublished ? (
            <Link href={`/learning-paths/${path.slug}`} className="btn-secondary">
              Preview as member
            </Link>
          ) : null}
        </>
      }
    >
      {justCreated ? (
        <PageNotice tone="success" title="Learning path created" message="Now add rooms to this path, or finish its description." className="mb-5" />
      ) : null}
      {!canManage ? (
        <PageNotice
          tone="warning"
          title="Read-only"
          message={`This path belongs to ${path.createdBy?.username ?? "another instructor"}. Only its owner or an admin can change it.`}
          className="mb-5"
        />
      ) : null}

      {/* Ringkasan path: identitas dan status di atas, fakta di strip bergaris di bawahnya. */}
      <section className="sheet overflow-hidden" aria-label="Path summary">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
          <EntityLogo name={path.title} src={path.logoUrl} size="lg" className="mx-auto sm:mx-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PublishPill published={path.isPublished} />
              <span className="text-sm text-ink-3">Updated {formatShortDate(path.updatedAt)}</span>
            </div>
            {path.description ? <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-ink-2">{path.description}</p> : null}
            <p className="mt-2 text-xs text-ink-3">
              Members find it at <span className="font-mono text-ink-2">/learning-paths/{path.slug}</span>
            </p>
          </div>
          <div className="shrink-0">
            <PublishToggleForm action={toggleLearningPathPublishAction} idField="pathId" id={path.id} isPublished={path.isPublished} disabled={!canManage} compact showState={false} />
          </div>
        </div>
        {/* Lima fakta: dua kolom di layar sempit (fakta terakhir selebar strip agar tidak ada sel kosong), satu baris mulai md. */}
        <dl className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-5">
          {facts.map((fact, index) => (
            <div key={fact.label} className={`min-w-0 bg-sheet px-5 py-3.5 ${index === facts.length - 1 ? "col-span-2 md:col-span-1" : ""}`}>
              <dt className="field-label">{fact.label}</dt>
              <dd className={`mt-1 truncate text-ink ${fact.figure ? "figure" : ""}`}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start">
        <section className={panelClass} aria-label="Path details">
          <SectionHeader title="Path details" description="Title, URL, description, and level shown on the learning path page." />
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
              coverImageUrl: path.coverImageUrl,
              logoUrl: path.logoUrl
            }}
          />
        </section>

        <section className={panelClass} aria-label="Rooms in this path">
          <SectionHeader
            title={`Rooms in this path (${path.rooms.length})`}
            description="Members follow the rooms in this order. Every published room is listed; scheduled and closed rooms keep their place with their dates but can't be opened. Draft rooms are hidden."
          />
          <PathRoomsEditor pathId={path.id} rooms={pathRooms} candidates={candidateRooms} canManagePath={canManage} />
        </section>
      </div>
    </AppShell>
  );
}
