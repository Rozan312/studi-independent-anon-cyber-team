import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getQuizByRoomSlug } from "@/lib/services/quiz-service";
import QuizView from "./quiz-view";

export const dynamic = "force-dynamic";

export default async function RoomQuizPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const quiz = await getQuizByRoomSlug(params.slug);
  if (!quiz) notFound();

  // Convert schema object to a matching frontend payload
  const convertedQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    room: {
      title: quiz.room.title,
      points: quiz.room.points
    },
    questions: quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      orderIndex: q.orderIndex,
      options: q.options.map(o => ({
        id: o.id,
        label: o.label,
        questionId: o.questionId
      }))
    }))
  };

  return (
    <AppShell title={`${quiz.title} - Assessment`} subtitle={`Test your vertical & horizontal capability models for ${quiz.room.title}`} role={profile.role}>
      <QuizView quiz={convertedQuiz} slug={params.slug} />
    </AppShell>
  );
}
