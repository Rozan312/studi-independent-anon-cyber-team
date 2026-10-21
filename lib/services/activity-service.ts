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

/** Jumlah aktivitas (submission task + attempt quiz) per hari dalam 120 hari terakhir, kunci hari lokal server. */
async function loadDailyActivity(userId: string, now: Date) {
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

  const counts = new Map<string, number>();
  const add = (date: Date) => counts.set(toDayKey(date), (counts.get(toDayKey(date)) ?? 0) + 1);
  for (const row of submissions) add(row.submittedAt);
  for (const row of attempts) add(row.startedAt);
  return counts;
}

/**
 * Streak belajar = jumlah hari berturut-turut (sampai hari ini atau kemarin)
 * dengan minimal satu submission task atau attempt quiz. Hanya melihat 120 hari terakhir.
 */
export async function getLearningStreak(userId: string, now = new Date()) {
  const counts = await loadDailyActivity(userId, now);
  const dayKeys = new Set(counts.keys());

  return {
    streakDays: countConsecutiveDays(dayKeys, now),
    activeDays: dayKeys.size
  };
}

/** Jumlah minggu di kalender aktivitas; 17 minggu (maks. 119 hari) tetap di dalam jendela 120 hari. */
export const ACTIVITY_CALENDAR_WEEKS = 17;

export type ActivityDay = { date: Date; count: number };

export type ActivityCalendar = {
  /** Kolom per minggu (Senin–Minggu); minggu berjalan berhenti di hari ini. */
  weeks: ActivityDay[][];
  total: number;
  activeDays: number;
  longestStreak: number;
  /** 0 = Senin … 6 = Minggu; null jika belum ada aktivitas. */
  busiestWeekday: number | null;
};

/** Streak plus kalender aktivitas harian untuk heatmap di halaman Progress dan Profile. */
export async function getLearningActivity(userId: string, now = new Date()) {
  const counts = await loadDailyActivity(userId, now);
  const dayKeys = new Set(counts.keys());

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (ACTIVITY_CALENDAR_WEEKS - 1) * 7);

  const weeks: ActivityDay[][] = [];
  const weekdayTotals = new Array<number>(7).fill(0);
  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;

  // Iterasi per tanggal kalender (bukan per 24 jam) agar aman terhadap pergantian jam musiman.
  for (let offset = 0; ; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    if (date > today) break;
    const count = counts.get(toDayKey(date)) ?? 0;
    if (offset % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({ date, count });

    total += count;
    weekdayTotals[offset % 7] += count;
    if (count > 0) {
      activeDays += 1;
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  const busiest = Math.max(...weekdayTotals);

  return {
    streakDays: countConsecutiveDays(dayKeys, now),
    /** Hari aktif dalam 120 hari terakhir (sama dengan getLearningStreak). */
    windowActiveDays: dayKeys.size,
    calendar: {
      weeks,
      total,
      activeDays,
      longestStreak,
      busiestWeekday: busiest > 0 ? weekdayTotals.indexOf(busiest) : null
    } satisfies ActivityCalendar
  };
}
