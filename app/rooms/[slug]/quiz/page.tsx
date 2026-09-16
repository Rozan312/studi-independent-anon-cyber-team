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

  if (!availability.isOpen && !canPreviewClosedRoom) {
    return (
      <AppShell title={`${quiz.title} - Assessment`} subtitle={quiz.room.title} role={profile.role}>
        <PageNotice
          tone={availability.state === "upcoming" ? "info" : "warning"}
          title={availability.state === "upcoming" ? "Quiz belum dibuka" : "Quiz sudah ditutup"}
          message={`${describeAvailability(availability)}. Attempt baru tidak dapat dikirim di luar jadwal room.`}
          className="mb-6"
        />
        <Link href={`/rooms/${quiz.room.slug}`} className="inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300">
          Kembali ke room
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
    <AppShell title={`${quiz.title} - Assessment`} subtitle={`Cek pemahaman untuk room ${quiz.room.title}`} role={profile.role}>
      {!availability.isOpen ? (
        <PageNotice
          tone="warning"
          title="Preview instruktur"
          message={`${describeAvailability(availability)}. Student belum bisa mengerjakan quiz ini; submit dari akun instruktur juga akan ditolak server.`}
          className="mb-6"
        />
      ) : null}
      <QuizView quiz={convertedQuiz} slug={params.slug} />
    </AppShell>
  );
}
