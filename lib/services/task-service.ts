import "server-only";

import { LeaderboardSourceType, ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addLeaderboardPoints } from "@/lib/services/leaderboard-service";
import { taskSubmissionSchema } from "@/lib/validation/platform";

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

export async function submitTaskAnswer(userId: string, input: { taskId: string; answer: string }) {
  const data = taskSubmissionSchema.parse(input);
  const task = await prisma.roomTask.findUnique({
    where: { id: data.taskId },
    include: { room: true }
  });

  if (!task) throw new Error("Task not found.");

  const isCorrect = task.expectedAnswer ? normalizeAnswer(data.answer) === normalizeAnswer(task.expectedAnswer) : false;

  const submission = await prisma.userTaskSubmission.create({
    data: {
      userId,
      taskId: task.id,
      answer: data.answer,
      isCorrect
    }
  });

  if (isCorrect) {
    await addLeaderboardPoints({
      userId,
      points: task.points,
      sourceType: LeaderboardSourceType.TASK_COMPLETION,
      sourceId: task.id
    });

    const [taskCount, completedTaskCount] = await Promise.all([
      prisma.roomTask.count({ where: { roomId: task.roomId } }),
      prisma.roomTask.count({
        where: {
          roomId: task.roomId,
          userSubmissions: {
            some: {
              userId,
              isCorrect: true
            }
          }
        }
      })
    ]);

    const progressPercentage = taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100);

    await prisma.userRoomProgress.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId: task.roomId
        }
      },
      update: {
        progressPercentage,
        status: progressPercentage >= 100 ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        completedAt: progressPercentage >= 100 ? new Date() : null
      },
      create: {
        userId,
        roomId: task.roomId,
        progressPercentage,
        status: progressPercentage >= 100 ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        completedAt: progressPercentage >= 100 ? new Date() : null
      }
    });
  }

  return submission;
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
