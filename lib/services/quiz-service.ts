import "server-only";

import { LeaderboardSourceType, ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addLeaderboardPoints } from "@/lib/services/leaderboard-service";
import { quizAttemptSchema } from "@/lib/validation/platform";

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
          points: true
        }
      },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              label: true,
              questionId: true,
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

export async function submitQuizAttempt(userId: string, input: { quizId: string; answers: Record<string, string> }) {
  const data = quizAttemptSchema.parse(input);
  const quiz = await prisma.quiz.findUnique({
    where: { id: data.quizId },
    include: {
      room: true,
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  if (!quiz) throw new Error("Quiz not found.");

  const total = quiz.questions.length;
  const correct = quiz.questions.reduce((count, question) => {
    const selectedOptionId = data.answers[question.id];
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    return selectedOption?.isCorrect ? count + 1 : count;
  }, 0);

  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = score >= quiz.passingScore;

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

    await prisma.userRoomProgress.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId: quiz.roomId
        }
      },
      update: {
        progressPercentage: 100,
        status: ProgressStatus.COMPLETED,
        completedAt: new Date()
      },
      create: {
        userId,
        roomId: quiz.roomId,
        progressPercentage: 100,
        status: ProgressStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date()
      }
    });
  }

  return attempt;
}
