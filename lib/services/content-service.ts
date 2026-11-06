import "server-only";

import { AnswerType, ContentFormat, ProgressStatus, Role } from "@prisma/client";
import { prepareRichHtmlForStorage } from "@/lib/content/rich-text";
import { prisma } from "@/lib/db/prisma";
import { UserFacingError } from "@/lib/errors";
import { taskChapterId } from "@/lib/learning/chapters";
import { recalculateRoomProgress } from "@/lib/services/progress-service";
import {
  addQuizQuestionSchema,
  addRoomTaskSchema,
  addRoomToPathSchema,
  chapterReferenceSchema,
  createRoomChapterSchema,
  learningPathSchema,
  moveQuizQuestionSchema,
  moveRoomChapterSchema,
  moveRoomInPathSchema,
  moveRoomTaskSchema,
  publishLearningPathSchema,
  publishRoomSchema,
  questionReferenceSchema,
  quizReferenceSchema,
  quizUpsertSchema,
  roomMetadataSchema,
  roomScheduleSchema,
  taskReferenceSchema,
  updateLearningPathSchema,
  updateQuizQuestionSchema,
  updateRoomChapterSchema,
  updateRoomTaskSchema
} from "@/lib/validation/platform";

/**
 * Service authoring konten (learning path, room, bab materi, task, quiz).
 *
 * Aturan kepemilikan:
 * - ADMIN boleh mengelola semua konten.
 * - INSTRUCTOR boleh mengelola konten yang dibuatnya sendiri, dan konten lama
 *   yang belum punya pemilik (createdById null, misalnya data seed).
 * Semua fungsi mutasi menerima `actor` yang harus diambil dari sesi server,
 * bukan dari request client.
 */

export type ContentActor = { id: string; role: Role };

export class ContentAccessError extends UserFacingError {
  constructor(message = "You don't have permission to manage this content.") {
    super(message);
    this.name = "ContentAccessError";
  }
}

export function canManageContent(actor: ContentActor, createdById: string | null) {
  if (actor.role === Role.ADMIN) return true;
  return createdById === null || createdById === actor.id;
}

const authorSelect = { select: { id: true, username: true, fullName: true } } as const;

// Pemeriksaan kepemilikan konten.

async function requireManagedPath(actor: ContentActor, pathId: string) {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    select: { id: true, slug: true, createdById: true }
  });

  if (!path) throw new UserFacingError("Learning path not found.");
  if (!canManageContent(actor, path.createdById)) throw new ContentAccessError();
  return path;
}

async function requireManagedRoom(actor: ContentActor, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, slug: true, title: true, createdById: true, learningPathId: true, learningPath: { select: { id: true, slug: true } } }
  });

  if (!room) throw new UserFacingError("Room not found.");
  if (!canManageContent(actor, room.createdById)) throw new ContentAccessError();
  return room;
}

/** Hak kelola bab mengikuti room-nya. */
async function requireManagedChapter(actor: ContentActor, chapterId: string) {
  const chapter = await prisma.roomChapter.findUnique({ where: { id: chapterId }, select: { id: true, roomId: true } });

  if (!chapter) throw new UserFacingError("Chapter not found.");
  const room = await requireManagedRoom(actor, chapter.roomId);
  return { id: chapter.id, roomId: chapter.roomId, room };
}

async function requireManagedTask(actor: ContentActor, taskId: string) {
  const task = await prisma.roomTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      roomId: true,
      chapterId: true,
      room: { select: { slug: true, createdById: true, learningPath: { select: { slug: true } } } }
    }
  });

  if (!task) throw new UserFacingError("Task not found.");
  if (!canManageContent(actor, task.room.createdById)) throw new ContentAccessError();
  return task;
}

async function requireManagedQuiz(actor: ContentActor, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      roomId: true,
      title: true,
      room: { select: { slug: true, createdById: true, learningPath: { select: { slug: true } } } }
    }
  });

  if (!quiz) throw new UserFacingError("Quiz not found.");
  if (!canManageContent(actor, quiz.room.createdById)) throw new ContentAccessError();
  return quiz;
}

async function requireManagedQuestion(actor: ContentActor, questionId: string) {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      quizId: true,
      quiz: {
        select: {
          roomId: true,
          room: { select: { slug: true, createdById: true, learningPath: { select: { slug: true } } } }
        }
      }
    }
  });

  if (!question) throw new UserFacingError("Question not found.");
  if (!canManageContent(actor, question.quiz.room.createdById)) throw new ContentAccessError();
  return question;
}

/** Dipakai route API lama agar ikut menerapkan aturan kepemilikan. */
export async function assertCanManageRoom(actor: ContentActor, roomId: string) {
  return requireManagedRoom(actor, roomId);
}

export async function listLearningPathsForManagement() {
  return prisma.learningPath.findMany({
    include: {
      createdBy: authorSelect,
      _count: { select: { rooms: true } }
    },
    orderBy: [{ updatedAt: "desc" }]
  });
}

export async function getLearningPathForEditor(actor: ContentActor, pathId: string) {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      createdBy: authorSelect,
      rooms: {
        orderBy: { orderIndex: "asc" },
        include: {
          createdBy: authorSelect,
          _count: { select: { tasks: true } },
          quiz: { select: { id: true, _count: { select: { questions: true } } } }
        }
      }
    }
  });

  if (!path) return null;

  return { path, canManage: canManageContent(actor, path.createdById) };
}

export async function createLearningPath(actor: ContentActor, input: unknown) {
  const data = learningPathSchema.parse(input);

  return prisma.learningPath.create({
    data: { ...data, createdById: actor.id }
  });
}

export async function updateLearningPath(actor: ContentActor, input: unknown) {
  const { pathId, ...data } = updateLearningPathSchema.parse(input);
  await requireManagedPath(actor, pathId);

  return prisma.learningPath.update({ where: { id: pathId }, data });
}

export async function setLearningPathPublished(actor: ContentActor, input: unknown) {
  const { pathId, isPublished } = publishLearningPathSchema.parse(input);
  await requireManagedPath(actor, pathId);

  return prisma.learningPath.update({ where: { id: pathId }, data: { isPublished } });
}

// Komposisi path: room sebagai modul di dalam learning path.

async function renumberRoomsInPath(pathId: string, orderedIds?: string[]) {
  const ids =
    orderedIds ??
    (
      await prisma.room.findMany({
        where: { learningPathId: pathId },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        select: { id: true }
      })
    ).map((room) => room.id);

  await prisma.$transaction(ids.map((id, index) => prisma.room.update({ where: { id }, data: { orderIndex: index + 1 } })));
}

/** Room di luar path ini yang bisa dipilih untuk dimasukkan (dipindahkan dari path asalnya). */
export async function listRoomsOutsidePath(pathId: string) {
  return prisma.room.findMany({
    where: { learningPathId: { not: pathId } },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      createdById: true,
      learningPath: { select: { id: true, title: true } }
    },
    orderBy: [{ learningPath: { title: "asc" } }, { orderIndex: "asc" }]
  });
}

/**
 * Memasukkan room yang sudah ada ke path (room hanya bisa berada di satu path, sehingga ini
 * memindahkannya dari path asal). Membutuhkan hak kelola atas room dan path tujuan.
 */
export async function addRoomToLearningPath(actor: ContentActor, input: unknown) {
  const { pathId, roomId } = addRoomToPathSchema.parse(input);
  const path = await requireManagedPath(actor, pathId);
  const room = await requireManagedRoom(actor, roomId);

  if (room.learningPathId === pathId) {
    throw new UserFacingError("This room is already in that path.");
  }

  const { _max } = await prisma.room.aggregate({ where: { learningPathId: pathId }, _max: { orderIndex: true } });

  await prisma.room.update({
    where: { id: roomId },
    data: { learningPathId: pathId, orderIndex: (_max.orderIndex ?? 0) + 1 }
  });

  // Rapikan urutan kedua path agar selalu 1..n tanpa lubang.
  await renumberRoomsInPath(room.learningPathId);
  await renumberRoomsInPath(pathId);

  const updated = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });

  return { room: updated, path, previousPathSlug: room.learningPath.slug };
}

/** Mengubah urutan room di dalam path-nya. Membutuhkan hak kelola atas path tersebut. */
export async function moveRoomInPath(actor: ContentActor, input: unknown) {
  const { roomId, direction } = moveRoomInPathSchema.parse(input);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, slug: true, learningPathId: true, learningPath: { select: { id: true, slug: true, createdById: true } } }
  });

  if (!room) throw new UserFacingError("Room not found.");
  if (!canManageContent(actor, room.learningPath.createdById)) throw new ContentAccessError();

  const ordered = (
    await prisma.room.findMany({
      where: { learningPathId: room.learningPathId },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    })
  ).map((entry) => entry.id);

  const index = ordered.indexOf(roomId);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index >= 0 && target >= 0 && target < ordered.length) {
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  }

  await renumberRoomsInPath(room.learningPathId, ordered);

  return room;
}

/** `_count.chapters` hanya menghitung bab yang berisi materi, untuk penanda "No material yet". */
export async function listRoomsForManagement() {
  return prisma.room.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      points: true,
      isPublished: true,
      availableFrom: true,
      availableUntil: true,
      createdById: true,
      learningPath: { select: { id: true, title: true, slug: true, isPublished: true } },
      createdBy: authorSelect,
      _count: { select: { tasks: true, chapters: { where: { NOT: { content: "" } } } } },
      quiz: { select: { id: true, _count: { select: { questions: true } } } }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getRoomForEditor(actor: ContentActor, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    omit: { content: true, contentFormat: true },
    include: {
      learningPath: { select: { id: true, title: true, slug: true } },
      createdBy: authorSelect,
      chapters: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, title: true, orderIndex: true, content: true, contentFormat: true, updatedAt: true }
      },
      tasks: { orderBy: { orderIndex: "asc" } },
      quiz: {
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { options: { orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] } }
          },
          _count: { select: { attempts: true } }
        }
      }
    }
  });

  if (!room) return null;

  return { room, canManage: canManageContent(actor, room.createdById) };
}

export async function updateRoomMetadata(actor: ContentActor, input: unknown) {
  const { roomId, ...data } = roomMetadataSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  const path = await prisma.learningPath.findUnique({ where: { id: data.learningPathId }, select: { id: true } });
  if (!path) throw new UserFacingError("The target learning path wasn't found.");

  return prisma.room.update({ where: { id: roomId }, data });
}

/** Jadwal buka/tutup room, disimpan terpisah dari Details agar simpan salah satunya tidak menimpa yang lain. */
export async function updateRoomSchedule(actor: ContentActor, input: unknown) {
  const { roomId, availableFrom, availableUntil } = roomScheduleSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  return prisma.room.update({
    where: { id: roomId },
    data: { availableFrom, availableUntil },
    select: { id: true, slug: true, learningPath: { select: { slug: true } } }
  });
}

// Bab materi: urutan 0..n-1 tanpa lubang. Setiap perubahan bab ikut memperbarui updatedAt room
// agar daftar "terakhir diubah" instruktur tetap akurat seperti saat materi masih satu dokumen.

const chapterRoomSelect = { select: { id: true, slug: true, learningPath: { select: { slug: true } } } } as const;

function touchRoom(roomId: string) {
  return prisma.room.update({ where: { id: roomId }, data: { updatedAt: new Date() }, select: { id: true } });
}

type ChapterOrderRow = { id: string; orderIndex: number; updatedAt: Date };

function listChapterOrder(roomId: string): Promise<ChapterOrderRow[]> {
  return prisma.roomChapter.findMany({
    where: { roomId },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    select: { id: true, orderIndex: true, updatedAt: true }
  });
}

/**
 * Menulis urutan 0..n-1 sesuai urutan `rows`. Hanya baris yang urutannya berubah yang ditulis, dan updatedAt
 * lamanya dikirim ulang: memindah atau menghapus bab bukan suntingan isi, jadi label "Edited …" tiap bab tetap.
 */
async function renumberChapters(roomId: string, rows: ChapterOrderRow[]) {
  const changed = rows.flatMap((row, index) => (row.orderIndex === index ? [] : [{ ...row, orderIndex: index }]));

  await prisma.$transaction([
    ...changed.map((row) => prisma.roomChapter.update({ where: { id: row.id }, data: { orderIndex: row.orderIndex, updatedAt: row.updatedAt } })),
    touchRoom(roomId)
  ]);
}

/** Bab baru selalu ditambahkan di akhir dengan isi kosong. */
export async function createRoomChapter(actor: ContentActor, input: unknown) {
  const { roomId, title } = createRoomChapterSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  const { _max } = await prisma.roomChapter.aggregate({ where: { roomId }, _max: { orderIndex: true } });

  const [chapter] = await prisma.$transaction([
    prisma.roomChapter.create({
      data: { roomId, title, orderIndex: (_max.orderIndex ?? -1) + 1 },
      include: { room: chapterRoomSelect }
    }),
    touchRoom(roomId)
  ]);

  return chapter;
}

/**
 * Menyimpan judul dan isi satu bab. HTML dari editor visual selalu disanitasi dan dikosongkan bila tidak
 * berisi apa pun (editor kosong menghasilkan "<p></p>"), agar cek "materi ada" tetap akurat.
 */
export async function updateRoomChapter(actor: ContentActor, input: unknown) {
  const { chapterId, title, content, contentFormat } = updateRoomChapterSchema.parse(input);
  const existing = await requireManagedChapter(actor, chapterId);

  const stored = contentFormat === ContentFormat.HTML ? prepareRichHtmlForStorage(content) : content.trim();

  const [chapter] = await prisma.$transaction([
    prisma.roomChapter.update({
      where: { id: chapterId },
      data: { title, content: stored, contentFormat },
      include: { room: chapterRoomSelect }
    }),
    touchRoom(existing.roomId)
  ]);

  return chapter;
}

export async function moveRoomChapter(actor: ContentActor, input: unknown) {
  const { chapterId, direction } = moveRoomChapterSchema.parse(input);
  const existing = await requireManagedChapter(actor, chapterId);

  const ordered = await listChapterOrder(existing.roomId);
  const index = ordered.findIndex((chapter) => chapter.id === chapterId);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index >= 0 && target >= 0 && target < ordered.length) {
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await renumberChapters(existing.roomId, ordered);
  }

  return existing;
}

/** Task di bab yang dihapus tidak ikut terhapus: chapterId-nya menjadi null (FK SET NULL) dan task tampil di bab terakhir. */
export async function deleteRoomChapter(actor: ContentActor, input: unknown) {
  const { chapterId } = chapterReferenceSchema.parse(input);
  const existing = await requireManagedChapter(actor, chapterId);

  await prisma.roomChapter.delete({ where: { id: chapterId } });
  await renumberChapters(existing.roomId, await listChapterOrder(existing.roomId));

  return existing;
}

export async function setRoomPublished(actor: ContentActor, input: unknown) {
  const { roomId, isPublished } = publishRoomSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  return prisma.room.update({ where: { id: roomId }, data: { isPublished } });
}

async function renumberTasks(roomId: string, orderedIds?: string[]) {
  const ids =
    orderedIds ??
    (await prisma.roomTask.findMany({ where: { roomId }, orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }], select: { id: true } })).map(
      (task) => task.id
    );

  await prisma.$transaction(ids.map((id, index) => prisma.roomTask.update({ where: { id }, data: { orderIndex: index + 1 } })));
}

/** Bab yang dipilih untuk task harus milik room yang sama; null berarti tanpa bab. */
async function requireChapterInRoom(roomId: string, chapterId: string | null) {
  if (!chapterId) return null;

  const chapter = await prisma.roomChapter.findFirst({ where: { id: chapterId, roomId }, select: { id: true } });
  if (!chapter) throw new UserFacingError("That chapter isn't part of this room. Reload the page and pick another chapter.");
  return chapter.id;
}

function listRoomChapterIds(roomId: string) {
  return prisma.roomChapter.findMany({
    where: { roomId },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    select: { id: true }
  });
}

/** Task baru masuk di akhir urutan room, jadi juga menjadi task terakhir di babnya. */
export async function addRoomTask(actor: ContentActor, input: unknown) {
  const { roomId, chapterId, ...task } = addRoomTaskSchema.parse(input);
  const room = await requireManagedRoom(actor, roomId);
  const taskChapter = await requireChapterInRoom(room.id, chapterId);

  const { _max } = await prisma.roomTask.aggregate({ where: { roomId }, _max: { orderIndex: true } });

  const created = await prisma.roomTask.create({
    data: {
      roomId: room.id,
      chapterId: taskChapter,
      title: task.title,
      description: task.description,
      expectedAnswer: task.expectedAnswer ?? null,
      acceptedAnswers: task.acceptedAnswers,
      hint: task.hint?.trim() ? task.hint.trim() : null,
      points: task.points,
      answerType: AnswerType.TEXT,
      orderIndex: (_max.orderIndex ?? 0) + 1
    }
  });

  return { task: created, room };
}

/**
 * Menyimpan task. Bila task pindah ke bab lain (menurut bab tampilnya, jadi tanpa bab dan bab terakhir dianggap
 * sama), task diletakkan di akhir urutan room agar menjadi task terakhir di bab tujuannya.
 */
export async function updateRoomTask(actor: ContentActor, input: unknown) {
  const { taskId, chapterId, ...task } = updateRoomTaskSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);
  const taskChapter = await requireChapterInRoom(existing.roomId, chapterId);

  const chapters = await listRoomChapterIds(existing.roomId);
  const changesChapter = taskChapterId(existing.chapterId, chapters) !== taskChapterId(taskChapter, chapters);
  const orderIndex = changesChapter
    ? ((await prisma.roomTask.aggregate({ where: { roomId: existing.roomId }, _max: { orderIndex: true } }))._max.orderIndex ?? 0) + 1
    : undefined;

  const updated = await prisma.roomTask.update({
    where: { id: taskId },
    data: {
      chapterId: taskChapter,
      title: task.title,
      description: task.description,
      expectedAnswer: task.expectedAnswer ?? null,
      acceptedAnswers: task.acceptedAnswers,
      hint: task.hint?.trim() ? task.hint.trim() : null,
      points: task.points,
      orderIndex
    }
  });

  if (!changesChapter) return { task: updated, room: existing.room };

  await renumberTasks(existing.roomId);
  return { task: await prisma.roomTask.findUniqueOrThrow({ where: { id: taskId } }), room: existing.room };
}

/** Menghapus task juga menghapus riwayat jawaban peserta untuk task tersebut (cascade). */
export async function deleteRoomTask(actor: ContentActor, input: unknown) {
  const { taskId } = taskReferenceSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);

  await prisma.roomTask.delete({ where: { id: taskId } });
  await renumberTasks(existing.roomId);

  return existing;
}

/**
 * Naik/turun di dalam bab tampil task: bertukar tempat dengan task terdekat di bab yang sama, sehingga task di bab
 * lain tidak bergeser. Task pertama/terakhir di babnya tidak berpindah ke bab lain lewat aksi ini.
 */
export async function moveRoomTask(actor: ContentActor, input: unknown) {
  const { taskId, direction } = moveRoomTaskSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);

  const [ordered, chapters] = await Promise.all([
    prisma.roomTask.findMany({
      where: { roomId: existing.roomId },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      select: { id: true, chapterId: true }
    }),
    listRoomChapterIds(existing.roomId)
  ]);

  const index = ordered.findIndex((task) => task.id === taskId);
  const chapter = taskChapterId(existing.chapterId, chapters);
  const step = direction === "up" ? -1 : 1;
  let target = index + step;
  while (target >= 0 && target < ordered.length && taskChapterId(ordered[target].chapterId, chapters) !== chapter) target += step;

  if (index >= 0 && target >= 0 && target < ordered.length) {
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await renumberTasks(
      existing.roomId,
      ordered.map((task) => task.id)
    );
  }

  return existing;
}

async function renumberQuestions(quizId: string, orderedIds?: string[]) {
  const ids =
    orderedIds ??
    (
      await prisma.quizQuestion.findMany({
        where: { quizId },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        select: { id: true }
      })
    ).map((question) => question.id);

  await prisma.$transaction(ids.map((id, index) => prisma.quizQuestion.update({ where: { id }, data: { orderIndex: index + 1 } })));
}

/** Menghitung ulang progress setiap peserta yang sudah mulai room, setelah unit room berubah (quiz ditambah/dihapus). */
async function recalculateRoomLearners(roomId: string) {
  const learners = await prisma.userRoomProgress.findMany({
    where: { roomId, status: { not: ProgressStatus.NOT_STARTED } },
    select: { userId: true }
  });
  for (const learner of learners) {
    await recalculateRoomProgress(learner.userId, roomId);
  }
  return learners.length;
}

/**
 * Membuat atau menyimpan pengaturan quiz room. Quiz baru menambah satu unit room, jadi progress peserta yang sudah
 * mulai dihitung ulang dengan aturan tunggal (yang sudah COMPLETED kembali IN_PROGRESS sampai lulus quiz baru).
 */
export async function upsertRoomQuiz(actor: ContentActor, input: unknown) {
  const { roomId, ...data } = quizUpsertSchema.parse(input);
  const room = await requireManagedRoom(actor, roomId);

  const existing = await prisma.quiz.findUnique({ where: { roomId }, select: { id: true } });
  const quiz = await prisma.quiz.upsert({
    where: { roomId },
    update: data,
    create: { roomId, ...data }
  });

  const created = !existing;
  const recalculatedProgress = created ? await recalculateRoomLearners(roomId) : 0;

  return { quiz, room, created, recalculatedProgress };
}

/**
 * Menghapus quiz room (pertanyaan dan opsinya ikut terhapus). Attempt peserta tetap tersimpan sebagai riwayat:
 * quizId menjadi null (FK SET NULL), sedangkan roomId dan judul terakhir quiz disalin ke attempt lebih dulu.
 * Poin yang sudah diberikan tetap. Progress setiap peserta yang sudah mulai room dihitung ulang dengan aturan
 * tunggal, jadi room tanpa quiz selesai begitu semua task benar.
 *
 * Room tanpa task menolak penghapusan: tanpa task dan quiz room tidak punya unit, sehingga progress yang sudah
 * COMPLETED akan menjadi 0% dan tanggal selesainya hilang, dan tidak ada peserta yang bisa menyelesaikannya lagi.
 */
export async function deleteRoomQuiz(actor: ContentActor, input: unknown) {
  const { quizId } = quizReferenceSchema.parse(input);
  const quiz = await requireManagedQuiz(actor, quizId);

  const taskCount = await prisma.roomTask.count({ where: { roomId: quiz.roomId } });
  if (taskCount === 0) {
    throw new UserFacingError("Add at least one task before removing the quiz. Without tasks or a quiz, members can't complete this room.");
  }

  await prisma.$transaction([
    prisma.userQuizAttempt.updateMany({ where: { quizId }, data: { roomId: quiz.roomId, quizTitle: quiz.title } }),
    prisma.quiz.delete({ where: { id: quizId } })
  ]);

  const recalculatedProgress = await recalculateRoomLearners(quiz.roomId);

  return { quizId, roomId: quiz.roomId, room: quiz.room, recalculatedProgress };
}

export async function addQuizQuestion(actor: ContentActor, input: unknown) {
  const { quizId, options, ...question } = addQuizQuestionSchema.parse(input);
  const quiz = await requireManagedQuiz(actor, quizId);

  const { _max } = await prisma.quizQuestion.aggregate({ where: { quizId }, _max: { orderIndex: true } });

  const created = await prisma.quizQuestion.create({
    data: {
      quizId,
      question: question.question,
      explanation: question.explanation,
      orderIndex: (_max.orderIndex ?? 0) + 1,
      options: {
        create: options.map((option, index) => ({
          label: option.label,
          isCorrect: option.isCorrect,
          orderIndex: index + 1
        }))
      }
    }
  });

  return { question: created, room: quiz.room };
}

/**
 * Mengganti seluruh opsi pertanyaan. Attempt lama tetap tersimpan karena
 * UserQuizAttempt hanya menyimpan skor, bukan opsi yang dipilih.
 */
export async function updateQuizQuestion(actor: ContentActor, input: unknown) {
  const { questionId, options, ...question } = updateQuizQuestionSchema.parse(input);
  const existing = await requireManagedQuestion(actor, questionId);

  await prisma.$transaction([
    prisma.quizQuestion.update({
      where: { id: questionId },
      data: { question: question.question, explanation: question.explanation }
    }),
    prisma.quizOption.deleteMany({ where: { questionId } }),
    prisma.quizOption.createMany({
      data: options.map((option, index) => ({
        questionId,
        label: option.label,
        isCorrect: option.isCorrect,
        orderIndex: index + 1
      }))
    })
  ]);

  return existing;
}

export async function deleteQuizQuestion(actor: ContentActor, input: unknown) {
  const { questionId } = questionReferenceSchema.parse(input);
  const existing = await requireManagedQuestion(actor, questionId);

  await prisma.quizQuestion.delete({ where: { id: questionId } });
  await renumberQuestions(existing.quizId);

  return existing;
}

export async function moveQuizQuestion(actor: ContentActor, input: unknown) {
  const { questionId, direction } = moveQuizQuestionSchema.parse(input);
  const existing = await requireManagedQuestion(actor, questionId);

  const ordered = (
    await prisma.quizQuestion.findMany({
      where: { quizId: existing.quizId },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    })
  ).map((question) => question.id);

  const index = ordered.indexOf(questionId);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index >= 0 && target >= 0 && target < ordered.length) {
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await renumberQuestions(existing.quizId, ordered);
  }

  return existing;
}
