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

// Kolom materi lama Room (content, contentFormat) hanya cadangan beku dari sebelum bab; tidak pernah ikut
// dikirim, karena materi member dibaca per bab dengan cek terbit dan jadwal (lihat room-service.ts).
const legacyRoomMaterial = { content: true, contentFormat: true } as const;

/** Path terbit beserta room terbitnya (juga GET /api/learning-paths?slug=…). */
export async function getLearningPathBySlug(slug: string) {
  return prisma.learningPath.findFirst({
    where: { slug, isPublished: true },
    include: {
      rooms: {
        where: { isPublished: true },
        omit: legacyRoomMaterial,
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
        omit: legacyRoomMaterial,
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
