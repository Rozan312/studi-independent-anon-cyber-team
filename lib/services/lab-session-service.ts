import "server-only";

import { LabStatus, MachineStatus, VpnStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { labSessionCreateSchema, labSessionStatusSchema } from "@/lib/validation/platform";
import { availabilityErrorMessage, getRoomAvailability } from "@/lib/learning/availability";

export const RESPONSIBLE_LAB_USE_TEXT =
  "This lab session is a placeholder for authorized education only. Do not target real systems, do not run harmful procedures, and keep all practice inside approved training environments.";

export async function createLabSessionPlaceholder(userId: string, input: { roomId: string }) {
  const data = labSessionCreateSchema.parse(input);

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });

  if (!room) throw new Error("Room not found.");

  const availability = getRoomAvailability(room);
  if (!availability.isOpen) throw new Error(availabilityErrorMessage(availability));

  return prisma.labSession.create({
    data: {
      userId,
      roomId: room.id,
      status: LabStatus.READY,
      vpnStatus: VpnStatus.DISCONNECTED,
      machineStatus: MachineStatus.OFFLINE
    }
  });
}

export async function getLabSessionStatus(userId: string, sessionId: string) {
  return prisma.labSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      room: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });
}

export async function getLatestLabSessionForRoom(userId: string, roomId: string) {
  return prisma.labSession.findFirst({
    where: { userId, roomId },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateLabSessionStatus(input: unknown) {
  const { sessionId, ...data } = labSessionStatusSchema.parse(input);

  return prisma.labSession.update({
    where: { id: sessionId },
    data
  });
}

export async function stopLabSession(userId: string, sessionId: string) {
  const session = await prisma.labSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true }
  });

  if (!session) throw new Error("Lab session not found.");

  return prisma.labSession.update({
    where: { id: session.id },
    data: {
      status: LabStatus.STOPPED,
      vpnStatus: VpnStatus.DISCONNECTED,
      machineStatus: MachineStatus.OFFLINE,
      endedAt: new Date()
    }
  });
}
