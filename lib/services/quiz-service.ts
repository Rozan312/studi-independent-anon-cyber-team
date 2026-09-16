import "server-only";

import { LeaderboardSourceType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addLeaderboardPoints } from "@/lib/services/leaderboard-service";
import { recalculateRoomProgress } from "@/lib/services/progress-service";
import { quizAttemptSchema } from "@/lib/validation/platform";
import { availabilityErrorMessage, getRoomAvailability } from "@/lib/learning/availability";

export async function getQuizByRoomSlug(roomSlug: string) {
  const quiz = await prisma.quiz.findFirst({
    where: {
      room: {
        slug: roomSlug,
        isPublished: true
      }
    },
    include: {
      room: {
        select: {
          id: true,
          title: true,
          slug: true,
          points: true,
          isPublished: true,
          availableFrom: true,
          availableUntil: true
        }
      },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true,
              questionId: true,
              orderIndex: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }
    }
  });

  return quiz;
}

export type QuizReviewItem = {
  questionId: string;
  orderIndex: number;
  question: string;
  explanation: string;
  selectedOptionId: string | null;
  selectedLabel: string | null;
  correctOptionId: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
};

/**
 * Menilai attempt, mencatatnya, memberi poin room saat lulus, lalu menghitung ulang
 * progress room dengan aturan tunggal. Review per pertanyaan dikembalikan agar
 * peserta bisa belajar dari penjelasan jawaban.
 */
export async function submitQuizAttempt(userId: string, input: { quizId: string; answers: Record<string, string> }) {
  const data = quizAttemptSchema.parse(input);
  const quiz = await prisma.quiz.findUnique({
    where: { id: data.quizId },
    include: {
      room: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: true
        }
      }
    }
  });

  if (!quiz) throw new Error("Quiz not found.");

  const availability = getRoomAvailability(quiz.room);
  if (!availability.isOpen) throw new Error(availabilityErrorMessage(availability));

  const review: QuizReviewItem[] = quiz.questions.map((question) => {
    const selectedOptionId = data.answers[question.id] ?? null;
    const selected = question.options.find((option) => option.id === selectedOptionId) ?? null;
    const correct = question.options.find((option) => option.isCorrect) ?? null;

    return {
      questionId: question.id,
      orderIndex: question.orderIndex,
      question: question.question,
      explanation: question.explanation,
      selectedOptionId,
      selectedLabel: selected?.label ?? null,
      correctOptionId: correct?.id ?? null,
      correctLabel: correct?.label ?? null,
      isCorrect: Boolean(selected?.isCorrect)
    };
  });

  const total = quiz.questions.length;
  const correctCount = review.filter((item) => item.isCorrect).length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const passed = total > 0 && score >= quiz.passingScore;

  const attempt = await prisma.userQuizAttempt.create({
    data: {
      userId,
      quizId: quiz.id,
      score,
      passed,
      completedAt: new Date()
    }
  });

  if (passed) {
    await addLeaderboardPoints({
      userId,
      points: Math.max(quiz.room.points, 0),
      sourceType: LeaderboardSourceType.QUIZ_COMPLETION,
      sourceId: quiz.id
    });
  }

  const { progress } = await recalculateRoomProgress(userId, quiz.roomId);

  return {
    ...attempt,
    review,
    correctCount,
    totalQuestions: total,
    passingScore: quiz.passingScore,
    progressPercentage: progress.progressPercentage,
    roomCompleted: progress.status === "COMPLETED"
  };
}
