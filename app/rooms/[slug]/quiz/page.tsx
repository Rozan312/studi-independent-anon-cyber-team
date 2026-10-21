import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageNotice } from "@/components/ui/page-notice";
import { requireRole } from "@/lib/auth/guards";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { describeAvailability, getRoomAvailability } from "@/lib/learning/availability";
import { getQuizByRoomSlug } from "@/lib/services/quiz-service";
import QuizView from "./quiz-view";

export const dynamic = "force-dynamic";

export default async function RoomQuizPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const quiz = await getQuizByRoomSlug(params.slug);
  if (!quiz) notFound();

  const availability = getRoomAvailability(quiz.room);
  const canPreviewClosedRoom = hasRoleAccess(profile.role, ["INSTRUCTOR"]);

  const pageTitle = quiz.title.trim() || `Quiz: ${quiz.room.title}`;
  const pageSubtitle = `${quiz.room.title} · Score ${quiz.passingScore}% or higher to pass.`;

  if (!availability.isOpen && !canPreviewClosedRoom) {
    const upcoming = availability.state === "upcoming";

    return (
      <AppShell title={pageTitle} subtitle={pageSubtitle} role={profile.role}>
        <PageNotice
          tone={upcoming ? "info" : "warning"}
          title={upcoming ? "This quiz isn't open yet" : "This quiz is closed"}
          message={
            upcoming
              ? `${describeAvailability(availability)}. You can take the quiz once the room opens.`
              : `${describeAvailability(availability)}. New attempts can't be submitted outside the room's schedule.`
          }
          className="mb-6"
        />
        <Link href={`/rooms/${quiz.room.slug}`} className="btn-secondary">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to room
        </Link>
      </AppShell>
    );
  }

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
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      orderIndex: q.orderIndex,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        questionId: o.questionId
      }))
    }))
  };

  return (
    <AppShell title={pageTitle} subtitle={pageSubtitle} role={profile.role}>
      {!availability.isOpen ? (
        <PageNotice
          tone="warning"
          title="Instructor preview"
          message={`${describeAvailability(availability)}. Members can't take this quiz right now. Submissions, including yours, are rejected while the room isn't open.`}
          className="mb-6"
        />
      ) : null}
      <QuizView quiz={convertedQuiz} slug={params.slug} />
    </AppShell>
  );
}
