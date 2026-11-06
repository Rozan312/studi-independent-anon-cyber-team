import "server-only";

import { ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Satu aturan penyelesaian room untuk seluruh aplikasi:
 * - setiap task bernilai satu unit; quiz (bila ada) bernilai satu unit;
 * - unit task terpenuhi jika peserta pernah menjawab benar;
 * - unit quiz terpenuhi jika peserta pernah lulus;
 * - room selesai (COMPLETED, 100%) hanya jika seluruh unit terpenuhi.
 *
 * Fungsi ini dipanggil setelah jawaban task benar, setelah attempt quiz, dan saat
 * peserta menandai room dimulai. Jangan menulis UserRoomProgress dari tempat lain.
 */

export type RoomProgressInput = {
  taskCount: number;
  correctTaskCount: number;
  hasQuiz: boolean;
  quizPassed: boolean;
};

export function computeRoomProgress(input: RoomProgressInput) {
  const totalUnits = input.taskCount + (input.hasQuiz ? 1 : 0);
  const doneUnits = Math.min(input.correctTaskCount, input.taskCount) + (input.hasQuiz && input.quizPassed ? 1 : 0);
  const isComplete = totalUnits > 0 && doneUnits >= totalUnits;
  const rawPercentage = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);

  return {
    percentage: isComplete ? 100 : Math.min(rawPercentage, 99),
    isComplete,
    totalUnits,
    doneUnits
  };
}

export async function getRoomCompletionSnapshot(userId: string, roomId: string) {
  const [taskCount, correctTaskCount, quiz] = await Promise.all([
    prisma.roomTask.count({ where: { roomId } }),
    prisma.roomTask.count({
      where: {
        roomId,
        userSubmissions: { some: { userId, isCorrect: true } }
      }
    }),
    prisma.quiz.findUnique({
      where: { roomId },
      select: {
        id: true,
        attempts: { where: { userId, passed: true }, take: 1, select: { id: true } }
      }
    })
  ]);

  const hasQuiz = Boolean(quiz);
  const quizPassed = Boolean(quiz?.attempts.length);

  return {
    taskCount,
    correctTaskCount,
    hasQuiz,
    quizPassed,
    ...computeRoomProgress({ taskCount, correctTaskCount, hasQuiz, quizPassed })
  };
}

export async function recalculateRoomProgress(userId: string, roomId: string) {
  const snapshot = await getRoomCompletionSnapshot(userId, roomId);
  const now = new Date();
  const status = snapshot.isComplete ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;

  const existing = await prisma.userRoomProgress.findUnique({
    where: { userId_roomId: { userId, roomId } },
    select: { startedAt: true, completedAt: true }
  });

  const progress = await prisma.userRoomProgress.upsert({
    where: { userId_roomId: { userId, roomId } },
    update: {
      progressPercentage: snapshot.percentage,
      status,
      startedAt: existing?.startedAt ?? now,
      completedAt: snapshot.isComplete ? existing?.completedAt ?? now : null
    },
    create: {
      userId,
      roomId,
      progressPercentage: snapshot.percentage,
      status,
      startedAt: now,
      completedAt: snapshot.isComplete ? now : null
    }
  });

  return { progress, snapshot };
}
