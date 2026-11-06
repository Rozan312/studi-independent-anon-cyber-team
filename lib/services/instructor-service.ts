import "server-only";

import { AnswerType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { roomBuilderSchema, roomDraftSchema, updateRoomDraftSchema } from "@/lib/validation/platform";

export async function getInstructorClasses(instructorId: string) {
  return prisma.class.findMany({
    where: { instructorId },
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getClassMembers(instructorId: string, classId: string) {
  return prisma.class.findFirst({
    where: { id: classId, instructorId },
    include: {
      members: {
        include: {
          user: true
        },
        orderBy: { joinedAt: "desc" }
      }
    }
  });
}

export async function getStudentProgress(instructorId: string, studentId?: string) {
  const classes = await prisma.class.findMany({
    where: { instructorId },
    include: {
      members: {
        where: studentId ? { userId: studentId } : undefined,
        select: { userId: true }
      }
    }
  });

  const studentIds = Array.from(new Set(classes.flatMap((classRecord) => classRecord.members.map((member) => member.userId))));

  return prisma.userRoomProgress.findMany({
    where: {
      userId: { in: studentIds }
    },
    include: {
      user: true,
      room: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createRoomDraft(input: unknown, createdById?: string) {
  const data = roomDraftSchema.parse(input);

  return prisma.room.create({
    data: {
      ...data,
      createdById: createdById ?? null,
      isPublished: false
    }
  });
}

export async function createRoomWithTasks(input: unknown, createdById?: string) {
  const data = roomBuilderSchema.parse(input);
  const { tasks, isPublished, ...roomData } = data;

  return prisma.room.create({
    data: {
      ...roomData,
      createdById: createdById ?? null,
      isPublished,
      tasks: {
        create: tasks.map((task, index) => ({
          title: task.title,
          description: task.description,
          orderIndex: index + 1,
          answerType: AnswerType.TEXT,
          expectedAnswer: task.expectedAnswer ?? null,
          acceptedAnswers: task.acceptedAnswers ?? [],
          hint: task.hint?.trim() ? task.hint.trim() : null,
          points: task.points
        }))
      }
    },
    include: {
      tasks: true
    }
  });
}

export async function updateRoomDraft(input: unknown) {
  const { roomId, ...data } = updateRoomDraftSchema.parse(input);

  return prisma.room.update({
    where: { id: roomId },
    data: {
      ...data,
      isPublished: false
    }
  });
}

export async function publishRoom(roomId: string) {
  return prisma.room.update({
    where: { id: roomId },
    data: { isPublished: true }
  });
}
