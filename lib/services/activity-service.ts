import "server-only";

import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function countConsecutiveDays(dayKeys: Set<string>, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Streak tetap hidup jika aktivitas terakhir adalah hari ini atau kemarin.
  let cursor = dayKeys.has(toDayKey(today)) ? today : new Date(today.getTime() - DAY_MS);
  if (!dayKeys.has(toDayKey(cursor))) return 0;

  let streak = 0;
  while (dayKeys.has(toDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
}

/**
 * Streak belajar = jumlah hari berturut-turut (sampai hari ini atau kemarin)
 * dengan minimal satu submission task atau attempt quiz. Hanya melihat 120 hari terakhir.
 */
export async function getLearningStreak(userId: string, now = new Date()) {
  const since = new Date(now.getTime() - 120 * DAY_MS);

  const [submissions, attempts] = await Promise.all([
    prisma.userTaskSubmission.findMany({
      where: { userId, submittedAt: { gte: since } },
      select: { submittedAt: true }
    }),
    prisma.userQuizAttempt.findMany({
      where: { userId, startedAt: { gte: since } },
      select: { startedAt: true }
    })
  ]);

  const dayKeys = new Set<string>();
  for (const row of submissions) dayKeys.add(toDayKey(row.submittedAt));
  for (const row of attempts) dayKeys.add(toDayKey(row.startedAt));

  return {
    streakDays: countConsecutiveDays(dayKeys, now),
    activeDays: dayKeys.size
  };
}
