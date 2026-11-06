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

/**
 * Competition ranking ("1, 2, 2, 4"): total poin yang sama mendapat rank yang sama, sama seperti
 * getUserLeaderboardStanding, sehingga tabel dan angka "Your rank" selalu cocok.
 * Baris harus sudah urut menurun berdasarkan poin.
 */
function withCompetitionRank<T extends { points: number }>(rows: T[]) {
  let previousPoints: number | null = null;
  let previousRank = 0;

  return rows.map((row, index) => {
    const rank = previousPoints !== null && row.points === previousPoints ? previousRank : index + 1;
    previousPoints = row.points;
    previousRank = rank;
    return { ...row, rank };
  });
}

export async function getGlobalLeaderboard(limit = 25) {
  const rows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    _sum: { points: true },
    // userId sebagai urutan kedua agar baris dengan poin sama punya urutan tetap antar request.
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
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

  return withCompetitionRank(
    rows.map((row) => ({
      user: profileById.get(row.userId),
      points: row._sum.points ?? 0
    }))
  );
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
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
    take: limit
  });

  const profiles = await prisma.profile.findMany({
    where: { id: { in: rows.map((row) => row.userId) } },
    select: { id: true, username: true, fullName: true, avatarUrl: true }
  });

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return withCompetitionRank(
    rows.map((row) => ({
      user: profileById.get(row.userId),
      points: row._sum.points ?? 0
    }))
  );
}

/**
 * Posisi user pada leaderboard global. Rank dihitung dari jumlah user lain
 * yang total poinnya lebih besar (competition ranking), tanpa dibatasi top-N.
 */
export async function getUserLeaderboardStanding(userId: string) {
  const rows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    _sum: { points: true }
  });

  const totals = rows.map((row) => ({ userId: row.userId, points: row._sum.points ?? 0 }));
  const mine = totals.find((row) => row.userId === userId);

  if (!mine) {
    return { rank: null as number | null, points: 0, totalRanked: totals.length };
  }

  const higher = totals.filter((row) => row.points > mine.points).length;

  return {
    rank: higher + 1,
    points: mine.points,
    totalRanked: totals.length
  };
}
