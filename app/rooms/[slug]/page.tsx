import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/card";
import { ChapterTasks } from "@/components/rooms/chapter-tasks";
import { ForwardArrow, RoomChapterPanel, type AfterMaterial } from "@/components/rooms/room-chapter-panel";
import { RoomScheduleView } from "@/components/rooms/room-schedule-view";
import { chapterIndexFrom } from "@/lib/learning/chapters";
import { getRoomChapterForReader } from "@/lib/services/room-service";
import { publishedRoomMaterialTitle } from "@/lib/services/page-title-service";
import { RoomFrame } from "./room-frame";
import { loadMemberRoom } from "./room-view";

export const dynamic = "force-dynamic";

// Setiap halaman bab berjudul unik ("Bab · Room"), sehingga pengumum rute Next ikut membacakan perpindahan bab.
export async function generateMetadata({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { chapter?: string | string[] };
}): Promise<Metadata> {
  return { title: (await publishedRoomMaterialTitle(params.slug, searchParams.chapter)) ?? "Room" };
}

export default async function RoomMaterialPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { chapter?: string | string[] };
}) {
  const view = await loadMemberRoom(params.slug);

  if (view.access === "schedule") {
    return <RoomScheduleView room={view.room} availability={view.availability} totalPoints={view.points.total} role={view.profile.role} />;
  }

  const { room } = view;
  const index = chapterIndexFrom(searchParams.chapter, room.chapters.length);
  const current = room.chapters[index];
  // Hanya isi bab yang sedang dibaca yang dimuat; daftar bab dari getRoomBySlug tidak membawa isi.
  const chapter = current ? await getRoomChapterForReader(room.id, current.id) : null;

  // Task bab ini; room tanpa bab menaruh semua task di bawah catatan "No material yet".
  const tasks = view.chapterTasks.get(current?.id ?? null) ?? [];
  const quizHref = `/rooms/${room.slug}/quiz`;
  // Task terakhir room sudah benar dan quiz belum lulus: bagian Tasks menunjuk ke quiz.
  const quizNext = view.quizIsNextStep && tasks.length > 0 && room.quiz ? { href: quizHref, passingScore: room.quiz.passingScore } : null;
  const tasksSection =
    tasks.length > 0 ? (
      <ChapterTasks
        roomSlug={room.slug}
        tasks={tasks}
        wrongAttemptsByTask={view.wrongAttemptsByTask}
        headingLevel={current ? 3 : 2}
        quizNext={quizNext}
      />
    ) : null;

  const previewMessage =
    room.tasks.length > 0
      ? "Members can't open this room right now; you can see it because you have the instructor or admin role. Task answers, including yours, are rejected while the room isn't open."
      : undefined;

  if (!current) {
    return (
      <RoomFrame view={view} active="material" previewMessage={previewMessage}>
        {tasksSection ? (
          <div className="sheet">
            <p className="mx-5 mt-5 rounded-lg border border-dashed border-line-strong bg-paper/60 px-4 py-3.5 text-sm leading-relaxed text-ink-2 sm:mx-6">
              The instructor hasn&apos;t added material to this room yet. Work through the tasks using the instructions in each one.
            </p>
            <div className="mt-5 border-t border-line">{tasksSection}</div>
          </div>
        ) : (
          <section className="sheet p-5 md:p-6" aria-label="Material">
            <EmptyState
              title="No material yet"
              message={`The instructor hasn't added material to this room yet. ${room.quiz ? "You can still take the quiz." : "Check back later."}`}
              action={
                room.quiz ? (
                  <Link href={quizHref} className="btn-primary">
                    Go to the quiz
                    <ForwardArrow />
                  </Link>
                ) : null
              }
            />
          </section>
        )}
      </RoomFrame>
    );
  }

  // Sesudah bab terakhir: quiz yang belum lulus, lalu task terbuka di bab lain, selain itu kembali ke learning path.
  // Bagian Tasks yang sudah menunjuk ke quiz tidak diulang di sini.
  let afterMaterial: AfterMaterial | null = null;
  if (!quizNext) {
    if (room.quiz && !view.snapshot.quizPassed) {
      afterMaterial = { href: quizHref, label: "Go to the quiz", direction: "forward" };
    } else if (view.openTasksHref && view.openTaskChapterIndex !== index) {
      afterMaterial = { href: view.openTasksHref, label: "Go to open tasks", direction: "forward" };
    } else {
      afterMaterial = { href: `/learning-paths/${room.learningPath.slug}`, label: "Back to learning path", direction: "back" };
    }
  }

  const taskCounts = room.chapters.map((item) => {
    const group = view.chapterTasks.get(item.id) ?? [];
    return { solved: group.filter((task) => task.status === "completed").length, total: group.length };
  });

  return (
    <RoomFrame view={view} active="material" previewMessage={previewMessage}>
      <RoomChapterPanel
        slug={room.slug}
        roomTitle={room.title}
        chapters={room.chapters}
        index={index}
        chapter={chapter}
        taskCounts={taskCounts}
        tasks={tasksSection}
        forwardIsPrimary={!quizNext && !tasks.some((task) => task.status === "active")}
        afterMaterial={afterMaterial}
      />
    </RoomFrame>
  );
}
