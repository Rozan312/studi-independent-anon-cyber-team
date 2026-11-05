import "server-only";

import { LeaderboardSourceType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { UserFacingError } from "@/lib/errors";
import { addLeaderboardPoints } from "@/lib/services/leaderboard-service";
import { recalculateRoomProgress } from "@/lib/services/progress-service";
import { taskSubmissionSchema } from "@/lib/validation/platform";
import { HINT_UNLOCK_AFTER_WRONG_ATTEMPTS, isHintUnlocked } from "@/lib/learning/hints";
import { availabilityErrorMessage, getRoomAvailability } from "@/lib/learning/availability";

/** Huruf besar/kecil, spasi di tepi, dan spasi ganda diabaikan saat menilai. */
export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isAnswerAccepted(answer: string, task: { expectedAnswer: string | null; acceptedAnswers: string[] }) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;

  const candidates = [task.expectedAnswer, ...task.acceptedAnswers].filter((value): value is string => Boolean(value && value.trim()));
  return candidates.some((candidate) => normalizeAnswer(candidate) === normalized);
}

export async function submitTaskAnswer(userId: string, input: { taskId: string; answer: string }) {
  const data = taskSubmissionSchema.parse(input);
  const task = await prisma.roomTask.findUnique({
    where: { id: data.taskId },
    include: { room: { select: { id: true, isPublished: true, availableFrom: true, availableUntil: true } } }
  });

  if (!task) throw new UserFacingError("Task not found.");

  const availability = getRoomAvailability(task.room);
  if (!availability.isOpen) throw new UserFacingError(availabilityErrorMessage(availability));

  const isCorrect = isAnswerAccepted(data.answer, task);

  const submission = await prisma.userTaskSubmission.create({
    data: {
      userId,
      taskId: task.id,
      answer: data.answer,
      isCorrect
    }
  });

  let progressPercentage: number | null = null;

  if (isCorrect) {
    await addLeaderboardPoints({
      userId,
      points: task.points,
      sourceType: LeaderboardSourceType.TASK_COMPLETION,
      sourceId: task.id
    });

    const { progress } = await recalculateRoomProgress(userId, task.roomId);
    progressPercentage = progress.progressPercentage;
  }

  const wrongAttempts = await prisma.userTaskSubmission.count({
    where: { userId, taskId: task.id, isCorrect: false }
  });

  const hasHint = Boolean(task.hint && task.hint.trim());

  return {
    ...submission,
    wrongAttempts,
    hasHint,
    hintUnlocked: hasHint && isHintUnlocked(wrongAttempts),
    hintUnlockAfter: HINT_UNLOCK_AFTER_WRONG_ATTEMPTS,
    progressPercentage
  };
}

/** Jumlah percobaan salah per task untuk satu user di satu room; dipakai untuk membuka hint. */
export async function getWrongAttemptCounts(userId: string, roomId: string) {
  const rows = await prisma.userTaskSubmission.groupBy({
    by: ["taskId"],
    where: { userId, isCorrect: false, task: { roomId } },
    _count: { _all: true }
  });

  return Object.fromEntries(rows.map((row) => [row.taskId, row._count._all])) as Record<string, number>;
}

export async function checkTaskCompletion(userId: string, taskId: string) {
  const submission = await prisma.userTaskSubmission.findFirst({
    where: { userId, taskId, isCorrect: true },
    orderBy: { submittedAt: "desc" }
  });

  return Boolean(submission);
}

export async function getUserTaskSubmissions(userId: string, taskId?: string) {
  return prisma.userTaskSubmission.findMany({
    where: {
      userId,
      ...(taskId ? { taskId } : {})
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          roomId: true
        }
      }
    },
    orderBy: { submittedAt: "desc" }
  });
}
