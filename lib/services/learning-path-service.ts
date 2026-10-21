import "server-only";

import { prisma } from "@/lib/db/prisma";
import { sortByDifficulty } from "@/lib/learning/difficulty";

export async function listPublishedLearningPaths() {
  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: { rooms: true }
      }
    },
    orderBy: { title: "asc" }
  });
  return sortByDifficulty(paths);
}

export async function getLearningPathBySlug(slug: string) {
  return prisma.learningPath.findFirst({
    where: { slug, isPublished: true },
    include: {
      rooms: {
        where: { isPublished: true },
        orderBy: { orderIndex: "asc" }
      }
    }
  });
}

export async function getLearningPathProgressForCurrentUser(userId: string, slug: string) {
  const path = await prisma.learningPath.findFirst({
    where: { slug, isPublished: true },
    include: {
      rooms: {
        where: { isPublished: true },
        include: {
          userProgress: {
            where: { userId }
          }
        },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!path) return null;

  const totalRooms = path.rooms.length;
  const completedRooms = path.rooms.filter((room) => room.userProgress[0]?.status === "COMPLETED").length;
  const percentage = totalRooms === 0 ? 0 : Math.round((completedRooms / totalRooms) * 100);

  return {
    path,
    totalRooms,
    completedRooms,
    percentage
  };
}
