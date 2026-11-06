import type { Metadata } from "next";
import { SectionHeader } from "@/components/card";
import { QuizEditor } from "@/components/instructor/quiz-editor";
import { panelClass } from "@/components/instructor/form-styles";
import { loadRoomEditor } from "../editor-data";

export const metadata: Metadata = { title: "Room quiz" };
export const dynamic = "force-dynamic";

export default async function RoomQuizPage({ params }: { params: { id: string } }) {
  const { room, canManage } = await loadRoomEditor(params.id);
  const roomPoints = `${room.points} ${room.points === 1 ? "point" : "points"}`;

  // Quiz opsional: deskripsi menjelaskan aturan selesai room untuk keadaan yang sedang berlaku.
  const description = room.quiz
    ? `Optional, one per room. A member's first pass adds the room's ${roomPoints}, once per room even if the quiz is replaced. While the room has a quiz, it is complete once every task is solved and the quiz is passed. Every attempt's score is recorded on the member's profile.`
    : `Optional, one per room. Without a quiz, the room is complete once every task is solved and members earn the task points only. A quiz adds the room's ${roomPoints} the first time a member passes one here. Adding a quiz reopens the room for members who completed it, until they pass the quiz.`;

  return (
    <section aria-labelledby="room-quiz-heading" className={panelClass}>
      <SectionHeader id="room-quiz-heading" title="Quiz" description={description} />
      <QuizEditor
        roomId={room.id}
        taskCount={room.tasks.length}
        disabled={!canManage}
        quiz={
          room.quiz
            ? {
                id: room.quiz.id,
                title: room.quiz.title,
                description: room.quiz.description,
                passingScore: room.quiz.passingScore,
                attemptsCount: room.quiz._count.attempts,
                questions: room.quiz.questions.map((question) => ({
                  id: question.id,
                  question: question.question,
                  explanation: question.explanation,
                  orderIndex: question.orderIndex,
                  options: question.options.map((option) => ({ id: option.id, label: option.label, isCorrect: option.isCorrect }))
                }))
              }
            : null
        }
      />
    </section>
  );
}
