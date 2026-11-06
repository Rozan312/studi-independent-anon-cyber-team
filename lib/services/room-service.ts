import "server-only";

import { hasRoleAccess, type AppRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { UserFacingError } from "@/lib/errors";
import { answerPattern } from "@/lib/learning/answer-pattern";
import { getRoomAvailability } from "@/lib/learning/availability";
import { recalculateRoomProgress } from "@/lib/services/progress-service";
import { roomStartSchema, uuidSchema } from "@/lib/validation/platform";

/** Katalog room terbit (juga GET /api/rooms). Kolom materi lama tidak ikut; materi kini ada di RoomChapter. */
export async function listPublishedRooms() {
  return prisma.room.findMany({
    where: { isPublished: true },
    omit: { content: true, contentFormat: true },
    include: {
      learningPath: true,
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }]
  });
}

/**
 * Room terbit untuk halaman member. Daftar bab tanpa isi; isi bab diambil per bab lewat getRoomChapterForReader.
 * Jawaban task (expectedAnswer, acceptedAnswers) tidak pernah ikut; yang dikirim hanya pola petunjuknya
 * (answerPattern). Bab tampil task dihitung dengan taskChapterId (lib/learning/chapters.ts).
 */
export async function getRoomBySlug(slug: string) {
  const room = await prisma.room.findFirst({
    where: { slug, isPublished: true },
    omit: { content: true, contentFormat: true },
    include: {
      learningPath: true,
      chapters: {
        select: { id: true, title: true, orderIndex: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }]
      },
      tasks: {
        select: {
          id: true,
          roomId: true,
          chapterId: true,
          title: true,
          description: true,
          orderIndex: true,
          answerType: true,
          expectedAnswer: true,
          hint: true,
          points: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }]
      },
      quiz: true
    }
  });
  if (!room) return null;

  return {
    ...room,
    tasks: room.tasks.map(({ expectedAnswer, ...task }) => ({ ...task, answerPattern: answerPattern(expectedAnswer) }))
  };
}

/**
 * Room untuk GET /api/rooms?slug=…, dengan aturan yang sama seperti halaman room member:
 * - hint task tidak pernah ikut; hint dibuka per peserta setelah salah menjawab (lihat task-service.ts);
 * - jawaban task juga tidak; hanya pola petunjuknya (answerPattern), yang memang tampil di kolom jawaban;
 * - room yang belum dibuka atau sudah ditutup hanya mengembalikan ringkasan dan jadwal (tanpa bab, task,
 *   dan quiz), kecuali untuk instruktur/admin yang boleh melihat preview.
 * getRoomBySlug sendiri tetap memuat hint karena halaman room menerapkan aturan buka hint di server (task di bawah bab).
 */
export async function getRoomForMemberApi(slug: string, role: AppRole) {
  const room = await getRoomBySlug(slug);
  if (!room) return null;

  const { tasks, chapters, quiz, ...summary } = room;
  const availability = getRoomAvailability(room);
  const schedule = { state: availability.state, opensAt: availability.opensAt, closesAt: availability.closesAt };

  if (!availability.isOpen && !hasRoleAccess(role, ["INSTRUCTOR"])) {
    return { ...summary, availability: schedule, taskCount: tasks.length, hasQuiz: Boolean(quiz) };
  }

  return {
    ...summary,
    availability: schedule,
    chapters,
    tasks: tasks.map(({ hint, ...task }) => ({ ...task, hasHint: Boolean(hint) })),
    quiz
  };
}

/** Isi satu bab, hanya bila bab itu milik room tersebut dan room-nya sudah terbit. */
export async function getRoomChapterForReader(roomId: string, chapterId: string) {
  if (!uuidSchema.safeParse(roomId).success || !uuidSchema.safeParse(chapterId).success) return null;

  return prisma.roomChapter.findFirst({
    where: { id: chapterId, roomId, room: { isPublished: true } },
    select: { id: true, title: true, content: true, contentFormat: true }
  });
}

/**
 * Task room untuk GET /api/rooms?roomId=…, dengan aturan yang sama seperti getRoomForMemberApi: hanya room terbit
 * (selain itu null), dan room yang belum dibuka atau sudah ditutup mengembalikan daftar kosong untuk member;
 * instruktur/admin tetap mendapat daftarnya sebagai preview. Jawaban dan hint tidak pernah ikut.
 */
export async function getRoomTasks(roomId: string, role: AppRole) {
  if (!uuidSchema.safeParse(roomId).success) return null;

  const room = await prisma.room.findFirst({
    where: { id: roomId, isPublished: true },
    select: { isPublished: true, availableFrom: true, availableUntil: true }
  });
  if (!room) return null;
  if (!getRoomAvailability(room).isOpen && !hasRoleAccess(role, ["INSTRUCTOR"])) return [];

  return prisma.roomTask.findMany({
    where: { roomId },
    select: {
      id: true,
      roomId: true,
      chapterId: true,
      title: true,
      description: true,
      orderIndex: true,
      answerType: true,
      points: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }]
  });
}

/**
 * Menandai room dimulai oleh peserta dan menghitung ulang progress dengan aturan tunggal
 * (lihat progress-service.ts). Persentase dihitung di server, tidak diterima dari client.
 */
export async function startRoomProgress(userId: string, input: { roomId: string }) {
  const { roomId } = roomStartSchema.parse(input);
  const room = await prisma.room.findFirst({ where: { id: roomId, isPublished: true }, select: { id: true } });
  if (!room) throw new UserFacingError("Room not found or unpublished.");

  return recalculateRoomProgress(userId, room.id);
}
