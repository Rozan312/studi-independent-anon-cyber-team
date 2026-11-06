import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { requireRole } from "@/lib/auth/guards";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { getRoomAvailability } from "@/lib/learning/availability";
import { chapterTaskStatuses, taskChapterId, type ChapterTaskStatus } from "@/lib/learning/chapters";
import { earnablePoints } from "@/lib/learning/points";
import { getRoomCompletionSnapshot } from "@/lib/services/progress-service";
import { getRoomBySlug } from "@/lib/services/room-service";
import { getWrongAttemptCounts } from "@/lib/services/task-service";

/** Room yang baru selesai (15 menit terakhir): tanda centangnya digambar sekali. */
const FRESH_COMPLETION_MS = 15 * 60 * 1000;

type ReaderRoom = NonNullable<Awaited<ReturnType<typeof getRoomBySlug>>>;

/** Task room beserta status bukanya, tanpa jawaban (getRoomBySlug hanya membawa answerPattern). */
export type ChapterTask = ReaderRoom["tasks"][number] & { status: ChapterTaskStatus };

/**
 * Tautan ke bab yang memuat task: `?chapter=N` (N mulai 1) dengan #tasks bila bab itu punya task.
 * Room tanpa bab menampilkan task-nya langsung di halaman Material.
 */
function chapterTasksHref(slug: string, chapterIndex: number | null, hasTasks: boolean) {
  const query = chapterIndex === null ? "" : `?chapter=${chapterIndex + 1}`;
  const anchor = hasTasks ? "#tasks" : chapterIndex === null ? "" : "#chapter";
  return `/rooms/${slug}${query}${anchor}`;
}

/**
 * Data bersama halaman room member (Material dan Quiz): room terbit, jadwal, dan progres peserta.
 * Dibungkus cache() agar pemanggilan berulang dalam satu request memakai hasil yang sama.
 *
 * - access "schedule": peserta membuka room yang belum dibuka atau sudah ditutup; hanya ringkasan jadwal
 *   yang boleh tampil, jadi progres tidak dimuat.
 * - access "open": room terbuka, atau instruktur/admin melihat preview room yang tidak terbuka (isPreview).
 */
export const loadMemberRoom = cache(async (slug: string) => {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const availability = getRoomAvailability(room);
  const points = earnablePoints(room);

  if (!availability.isOpen && !hasRoleAccess(profile.role, ["INSTRUCTOR"])) {
    return { access: "schedule" as const, profile, room, availability, points };
  }

  // Sesi lab tidak dimuat di sini: strip hanya menautkan halaman lab, yang memuat catatan sesinya sendiri.
  const [solvedSubmissions, wrongAttemptsByTask, snapshot, roomProgress] = await Promise.all([
    prisma.userTaskSubmission.findMany({
      where: { userId: profile.id, task: { roomId: room.id }, isCorrect: true },
      select: { taskId: true }
    }),
    getWrongAttemptCounts(profile.id, room.id),
    getRoomCompletionSnapshot(profile.id, room.id),
    // Tanggal selesai untuk penanda "Room passed".
    prisma.userRoomProgress.findUnique({
      where: { userId_roomId: { userId: profile.id, roomId: room.id } },
      select: { completedAt: true }
    })
  ]);

  const solvedTaskIds = new Set(solvedSubmissions.map((submission) => submission.taskId));
  const solvedTasks = room.tasks.filter((task) => solvedTaskIds.has(task.id)).length;
  const totalTasks = room.tasks.length;
  const allTasksSolved = solvedTasks >= totalTasks;

  // Task dikelompokkan per bab tempatnya tampil (tanpa bab → bab terakhir), urut orderIndex di dalam bab.
  // Kunci null hanya dipakai room yang belum punya bab. Status buka dihitung per bab.
  const statuses = chapterTaskStatuses(room.tasks, room.chapters, solvedTaskIds);
  const chapterTasks = new Map<string | null, ChapterTask[]>();
  for (const task of room.tasks) {
    const key = taskChapterId(task.chapterId, room.chapters);
    const group = chapterTasks.get(key) ?? [];
    group.push({ ...task, status: statuses.get(task.id) ?? "locked" });
    chapterTasks.set(key, group);
  }

  // Task terbuka berikutnya dalam urutan baca: bab paling awal yang masih punya task belum benar.
  const openIndex = room.chapters.findIndex((chapter) => chapterTasks.get(chapter.id)?.some((task) => task.status !== "completed"));
  const openTaskChapterIndex = openIndex >= 0 ? openIndex : null;
  const openTasksHref = allTasksSolved ? null : chapterTasksHref(room.slug, openTaskChapterIndex, true);

  // Bila semua task sudah benar: bab terakhir yang punya task, lalu bab terakhir.
  let lastTaskChapterIndex = -1;
  room.chapters.forEach((chapter, index) => {
    if (chapterTasks.has(chapter.id)) lastTaskChapterIndex = index;
  });
  const fallbackIndex = room.chapters.length === 0 ? null : lastTaskChapterIndex >= 0 ? lastTaskChapterIndex : room.chapters.length - 1;
  const tasksHref = openTasksHref ?? chapterTasksHref(room.slug, fallbackIndex, totalTasks > 0);

  // Satu aturan penyelesaian untuk seluruh aplikasi: semua task benar + quiz lulus (jika ada).
  const completedAt = snapshot.isComplete ? roomProgress?.completedAt ?? null : null;

  return {
    access: "open" as const,
    /** Instruktur/admin melihat room yang sedang tidak terbuka untuk member. */
    isPreview: !availability.isOpen,
    profile,
    room,
    availability,
    points,
    snapshot,
    solvedTaskIds,
    solvedTasks,
    totalTasks,
    wrongAttemptsByTask,
    /** Task per bab tampil (kunci id bab; null untuk room tanpa bab), masing-masing dengan status bukanya. */
    chapterTasks,
    /** Posisi bab (mulai 0) yang memuat task terbuka pertama; null bila semua task benar atau room tanpa bab. */
    openTaskChapterIndex,
    /** Tautan ke task terbuka pertama; null bila semua task sudah benar. */
    openTasksHref,
    /** Tautan task yang selalu ada (pengganti halaman Tasks lama): task terbuka, atau bab terakhir yang punya task. */
    tasksHref,
    completedAt,
    freshCompletion: completedAt ? Date.now() - completedAt.getTime() < FRESH_COMPLETION_MS : false,
    /** Quiz menjadi langkah berikutnya: semua task sudah benar tetapi quiz belum lulus. */
    quizIsNextStep: Boolean(room.quiz) && allTasksSolved && !snapshot.quizPassed
  };
});

export type MemberRoomView = Awaited<ReturnType<typeof loadMemberRoom>>;
export type OpenMemberRoomView = Extract<MemberRoomView, { access: "open" }>;
