import "server-only";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { announcementSchema, updateAnnouncementSchema, updateUserRoleSchema } from "@/lib/validation/platform";

export async function getUserList() {
  return prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function updateUserRole(input: unknown) {
  const data = updateUserRoleSchema.parse(input);

  return prisma.profile.update({
    where: { id: data.userId },
    data: { role: data.role as Role }
  });
}

export async function getPlatformStatistics() {
  const [users, learningPaths, rooms, completedRooms, labSessions, announcements] = await Promise.all([
    prisma.profile.count(),
    prisma.learningPath.count(),
    prisma.room.count(),
    prisma.userRoomProgress.count({ where: { status: "COMPLETED" } }),
    prisma.labSession.count(),
    prisma.announcement.count()
  ]);

  return {
    users,
    learningPaths,
    rooms,
    completedRooms,
    labSessions,
    announcements
  };
}

export async function createAnnouncement(createdById: string, input: unknown) {
  const data = announcementSchema.parse(input);

  return prisma.announcement.create({
    data: {
      ...data,
      createdById
    }
  });
}

export async function updateAnnouncement(input: unknown) {
  const { announcementId, ...data } = updateAnnouncementSchema.parse(input);

  return prisma.announcement.update({
    where: { id: announcementId },
    data
  });
}

export async function publishAnnouncement(announcementId: string, isPublished: boolean) {
  return prisma.announcement.update({
    where: { id: announcementId },
    data: { isPublished }
  });
}

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
