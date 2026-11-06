import type { Metadata } from "next";
import { SectionHeader } from "@/components/card";
import { TaskEditor } from "@/components/instructor/task-editor";
import { panelClass } from "@/components/instructor/form-styles";
import { loadRoomEditor } from "../editor-data";

export const metadata: Metadata = { title: "Room tasks" };
export const dynamic = "force-dynamic";

export default async function RoomTasksPage({ params }: { params: { id: string } }) {
  const { room, canManage } = await loadRoomEditor(params.id);

  return (
    <section aria-labelledby="room-tasks-heading" className={panelClass}>
      <SectionHeader
        id="room-tasks-heading"
        focusable
        title={`Tasks (${room.tasks.length})`}
        description="Members find each task below its chapter's material. Within a chapter, a task opens once the one before it is solved; other chapters aren't held back. A correct answer awards the task's points and moves the member's room progress forward."
      />
      <TaskEditor
        roomId={room.id}
        headingId="room-tasks-heading"
        disabled={!canManage}
        chapters={room.chapters.map((chapter) => ({ id: chapter.id, title: chapter.title }))}
        tasks={room.tasks.map((task) => ({
          id: task.id,
          chapterId: task.chapterId,
          title: task.title,
          description: task.description,
          expectedAnswer: task.expectedAnswer,
          acceptedAnswers: task.acceptedAnswers,
          hint: task.hint,
          points: task.points,
          orderIndex: task.orderIndex
        }))}
      />
    </section>
  );
}
