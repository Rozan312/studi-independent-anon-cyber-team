import "server-only";

import { prisma } from "@/lib/db/prisma";
import { recalculateRoomProgress } from "@/lib/services/progress-service";
import { roomStartSchema } from "@/lib/validation/platform";

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
          hint: true,
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

/**
 * Menandai room dimulai oleh peserta dan menghitung ulang progress dengan aturan tunggal
 * (lihat progress-service.ts). Persentase tidak lagi diterima dari client.
 */
export async function startRoomProgress(userId: string, input: { roomId: string }) {
  const { roomId } = roomStartSchema.parse(input);
  const room = await prisma.room.findFirst({ where: { id: roomId, isPublished: true }, select: { id: true } });
  if (!room) throw new Error("Room not found or unpublished.");

  return recalculateRoomProgress(userId, room.id);
}
