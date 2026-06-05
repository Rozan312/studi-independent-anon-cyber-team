import "server-only";

import { LeaderboardSourceType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function addLeaderboardPoints(input: {
  userId: string;
  points: number;
  sourceType: LeaderboardSourceType;
  sourceId?: string | null;
}) {
  if (input.points <= 0) return null;

  if (input.sourceId) {
    const existing = await prisma.leaderboardPoint.findFirst({
      where: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId
      }
    });

    if (existing) return existing;
  }

  return prisma.leaderboardPoint.create({
    data: {
      userId: input.userId,
      points: input.points,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null
    }
  });
}

export async function getGlobalLeaderboard(limit = 25) {
  const rows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: {
      _sum: {
        points: "desc"
      }
    },
    take: limit
  });

  const profiles = await prisma.profile.findMany({
    where: {
      id: {
        in: rows.map((row) => row.userId)
      }
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      avatarUrl: true
    }
  });

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row, index) => ({
    rank: index + 1,
    user: profileById.get(row.userId),
    points: row._sum.points ?? 0
  }));
}

export async function getClassLeaderboard(classId: string, limit = 25) {
  const members = await prisma.classMember.findMany({
    where: { classId },
    select: { userId: true }
  });

  const rows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    where: {
      userId: {
        in: members.map((member) => member.userId)
      }
    },
    _sum: { points: true },
    orderBy: {
      _sum: {
        points: "desc"
      }
    },
    take: limit
  });

  const profiles = await prisma.profile.findMany({
    where: { id: { in: rows.map((row) => row.userId) } },
    select: { id: true, username: true, fullName: true, avatarUrl: true }
  });

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row, index) => ({
    rank: index + 1,
    user: profileById.get(row.userId),
    points: row._sum.points ?? 0
  }));
}
