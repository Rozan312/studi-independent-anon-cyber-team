import "server-only";

import { ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { roomProgressSchema } from "@/lib/validation/platform";

export async function listPublishedRooms() {
  return prisma.room.findMany({
    where: { isPublished: true },
    include: {
      learningPath: true,
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }]
  });
}

export async function getRoomBySlug(slug: string) {
  return prisma.room.findFirst({
    where: { slug, isPublished: true },
    include: {
      learningPath: true,
      tasks: {
        select: {
          id: true,
          roomId: true,
          title: true,
          description: true,
          orderIndex: true,
          answerType: true,
          points: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { orderIndex: "asc" }
      },
      quiz: true
    }
  });
}

export async function getRoomTasks(roomId: string) {
  return prisma.roomTask.findMany({
    where: { roomId },
    select: {
      id: true,
      roomId: true,
      title: true,
      description: true,
      orderIndex: true,
      answerType: true,
      points: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { orderIndex: "asc" }
  });
}

export async function updateRoomProgress(userId: string, input: { roomId: string; progressPercentage: number }) {
  const data = roomProgressSchema.parse(input);
  const now = new Date();
  const status = data.progressPercentage >= 100 ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;

  return prisma.userRoomProgress.upsert({
    where: {
      userId_roomId: {
        userId,
        roomId: data.roomId
      }
    },
    update: {
      progressPercentage: data.progressPercentage,
      status,
      completedAt: status === ProgressStatus.COMPLETED ? now : null
    },
    create: {
      userId,
      roomId: data.roomId,
      progressPercentage: data.progressPercentage,
      status,
      startedAt: now,
      completedAt: status === ProgressStatus.COMPLETED ? now : null
    }
  });
}
