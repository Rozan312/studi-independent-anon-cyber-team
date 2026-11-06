import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SectionHeader } from "@/components/card";
import { BackArrow, ForwardArrow } from "@/components/rooms/room-chapter-panel";
import { PageNotice } from "@/components/ui/page-notice";
import { prisma } from "@/lib/db/prisma";
import { describeAvailability } from "@/lib/learning/availability";
import { getQuizByRoomSlug } from "@/lib/services/quiz-service";
import { publishedRoomTitle } from "@/lib/services/page-title-service";
import { RoomFrame } from "../room-frame";
import { loadMemberRoom, type OpenMemberRoomView } from "../room-view";
import QuizView from "./quiz-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const room = await publishedRoomTitle(params.slug);
  return { title: room ? `${room} quiz` : "Quiz" };
}

/**
 * Room tanpa quiz: keadaan tenang di bawah strip room, dengan jalan ke task terbuka atau kembali ke materi.
 * Riwayat percobaan hanya disebut bila peserta memang pernah mengerjakan quiz room ini (quiz yang sudah dihapus).
 */
function NoQuiz({ view, pastAttempts }: { view: OpenMemberRoomView; pastAttempts: number }) {
  const progressNote =
    view.totalTasks === 0
      ? "Read the material at your own pace."
      : view.openTasksHref
        ? "Room progress counts the tasks only, so solve every task to complete the room."
        : "Room progress counts the tasks only, and every task is solved.";
  const historyNote = pastAttempts > 0 ? " Your earlier quiz attempts are still listed on your profile." : "";

  return (
    <RoomFrame view={view} active="quiz">
      <section className="sheet p-5 md:p-6" aria-label="Quiz">
        <EmptyState
          title="This room has no quiz"
          message={`${progressNote}${historyNote}`}
          action={
            view.openTasksHref ? (
              <Link href={view.openTasksHref} className="btn-primary">
                Go to open tasks
                <ForwardArrow />
              </Link>
            ) : (
              <Link href={`/rooms/${view.room.slug}`} className="btn-secondary">
                <BackArrow />
                Back to material
              </Link>
            )
          }
        />
      </section>
    </RoomFrame>
  );
}

export default async function RoomQuizPage({ params }: { params: { slug: string } }) {
  const view = await loadMemberRoom(params.slug);
  const quiz = await getQuizByRoomSlug(params.slug);

  // Room tanpa quiz (belum dibuat, atau dihapus instruktur sesudah tautan ini tersimpan). Peserta di luar jadwal
  // ke halaman room, yang menampilkan jadwalnya.
  if (!quiz) {
    if (view.access === "schedule") redirect(`/rooms/${view.room.slug}`);
    const pastAttempts = await prisma.userQuizAttempt.count({ where: { userId: view.profile.id, roomId: view.room.id } });
    return <NoQuiz view={view} pastAttempts={pastAttempts} />;
  }

  const quizTitle = quiz.title.trim() || "Quiz";

  // Peserta di luar jadwal room: hanya penjelasan dan jalan kembali ke halaman room (yang menampilkan jadwalnya).
  if (view.access === "schedule") {
    const upcoming = view.availability.state === "upcoming";

    return (
      <AppShell title={quiz.title.trim() || `Quiz: ${quiz.room.title}`} subtitle={`${quiz.room.title} · Score ${quiz.passingScore}% or higher to pass.`} role={view.profile.role}>
        <PageNotice
          tone={upcoming ? "info" : "warning"}
          title={upcoming ? "This quiz isn't open yet" : "This quiz is closed"}
          message={
            upcoming
              ? `${describeAvailability(view.availability)}. You can take the quiz once the room opens.`
              : `${describeAvailability(view.availability)}. New attempts can't be submitted outside the room's schedule.`
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

  // Hanya field yang aman untuk browser: isCorrect dan explanation tidak dikirim.
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

  const description = quiz.description.trim();
  const descriptionLead = description ? `${description}${/[.!?]$/.test(description) ? "" : "."} ` : "";
  // Langkah sesudah quiz lulus: bab dengan task terbuka pertama, atau kembali ke learning path bila room sudah selesai.
  const nextSteps = {
    tasksHref: view.openTasksHref,
    pathHref: `/learning-paths/${view.room.learningPath.slug}`
  };

  return (
    <RoomFrame
      view={view}
      active="quiz"
      previewMessage="Members can't take this quiz right now. Submissions, including yours, are rejected while the room isn't open."
    >
      <SectionHeader title={quizTitle} description={`${descriptionLead}Score ${quiz.passingScore}% or higher to pass.`} />
      <QuizView quiz={convertedQuiz} nextSteps={nextSteps} />
    </RoomFrame>
  );
}
