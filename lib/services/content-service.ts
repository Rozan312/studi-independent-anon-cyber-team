import "server-only";

import { AnswerType, ContentFormat, Role } from "@prisma/client";
import { prepareRichHtmlForStorage } from "@/lib/content/rich-text";
import { prisma } from "@/lib/db/prisma";
import {
  addQuizQuestionSchema,
  addRoomTaskSchema,
  addRoomToPathSchema,
  learningPathSchema,
  moveQuizQuestionSchema,
  moveRoomInPathSchema,
  moveRoomTaskSchema,
  publishLearningPathSchema,
  publishRoomSchema,
  questionReferenceSchema,
  quizUpsertSchema,
  roomContentSchema,
  roomMetadataSchema,
  taskReferenceSchema,
  updateLearningPathSchema,
  updateQuizQuestionSchema,
  updateRoomTaskSchema
} from "@/lib/validation/platform";

/**
 * Service authoring konten (learning path, room, materi, task, quiz).
 *
 * Aturan kepemilikan:
 * - ADMIN boleh mengelola semua konten.
 * - INSTRUCTOR boleh mengelola konten yang dibuatnya sendiri, dan konten lama
 *   yang belum punya pemilik (createdById null, misalnya data seed).
 * Semua fungsi mutasi menerima `actor` yang harus diambil dari sesi server,
 * bukan dari request client.
 */

export type ContentActor = { id: string; role: Role };

export class ContentAccessError extends Error {
  constructor(message = "Anda tidak memiliki akses untuk mengelola konten ini.") {
    super(message);
    this.name = "ContentAccessError";
  }
}

export function canManageContent(actor: ContentActor, createdById: string | null) {
  if (actor.role === Role.ADMIN) return true;
  return createdById === null || createdById === actor.id;
}

const authorSelect = { select: { id: true, username: true, fullName: true } } as const;

// ---------------------------------------------------------------------------
// Ownership guards
// ---------------------------------------------------------------------------

async function requireManagedPath(actor: ContentActor, pathId: string) {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    select: { id: true, slug: true, createdById: true }
  });

  if (!path) throw new Error("Learning path tidak ditemukan.");
  if (!canManageContent(actor, path.createdById)) throw new ContentAccessError();
  return path;
}

async function requireManagedRoom(actor: ContentActor, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, slug: true, title: true, createdById: true, learningPathId: true, learningPath: { select: { id: true, slug: true } } }
  });

  if (!room) throw new Error("Room tidak ditemukan.");
  if (!canManageContent(actor, room.createdById)) throw new ContentAccessError();
  return room;
}

async function requireManagedTask(actor: ContentActor, taskId: string) {
  const task = await prisma.roomTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      roomId: true,
      room: { select: { slug: true, createdById: true, learningPath: { select: { slug: true } } } }
    }
  });

  if (!task) throw new Error("Task tidak ditemukan.");
  if (!canManageContent(actor, task.room.createdById)) throw new ContentAccessError();
  return task;
}

async function requireManagedQuiz(actor: ContentActor, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      roomId: true,
      room: { select: { slug: true, createdById: true, learningPath: { select: { slug: true } } } }
    }
  });

  if (!quiz) throw new Error("Quiz tidak ditemukan.");
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

  if (!question) throw new Error("Pertanyaan tidak ditemukan.");
  if (!canManageContent(actor, question.quiz.room.createdById)) throw new ContentAccessError();
  return question;
}

/** Dipakai route API lama agar ikut menerapkan aturan kepemilikan. */
export async function assertCanManageRoom(actor: ContentActor, roomId: string) {
  return requireManagedRoom(actor, roomId);
}

// ---------------------------------------------------------------------------
// Learning paths
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Path composition: rooms as modules inside a learning path
// ---------------------------------------------------------------------------

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
    throw new Error("Room ini sudah berada di path tersebut.");
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

  if (!room) throw new Error("Room tidak ditemukan.");
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

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function listRoomsForManagement() {
  return prisma.room.findMany({
    include: {
      learningPath: { select: { id: true, title: true, slug: true, isPublished: true } },
      createdBy: authorSelect,
      _count: { select: { tasks: true } },
      quiz: { select: { id: true, _count: { select: { questions: true } } } }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getRoomForEditor(actor: ContentActor, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      learningPath: { select: { id: true, title: true, slug: true } },
      createdBy: authorSelect,
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
  if (!path) throw new Error("Learning path tujuan tidak ditemukan.");

  return prisma.room.update({ where: { id: roomId }, data });
}

/**
 * Menyimpan materi room. HTML dari editor visual selalu disanitasi dan dikosongkan bila tidak
 * berisi apa pun (editor kosong menghasilkan "<p></p>"), agar cek "materi ada" tetap akurat.
 */
export async function updateRoomContent(actor: ContentActor, input: unknown) {
  const { roomId, content, contentFormat } = roomContentSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  const stored = contentFormat === ContentFormat.HTML ? prepareRichHtmlForStorage(content) : content.trim();

  return prisma.room.update({ where: { id: roomId }, data: { content: stored, contentFormat } });
}

export async function setRoomPublished(actor: ContentActor, input: unknown) {
  const { roomId, isPublished } = publishRoomSchema.parse(input);
  await requireManagedRoom(actor, roomId);

  return prisma.room.update({ where: { id: roomId }, data: { isPublished } });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

async function renumberTasks(roomId: string, orderedIds?: string[]) {
  const ids =
    orderedIds ??
    (await prisma.roomTask.findMany({ where: { roomId }, orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }], select: { id: true } })).map(
      (task) => task.id
    );

  await prisma.$transaction(ids.map((id, index) => prisma.roomTask.update({ where: { id }, data: { orderIndex: index + 1 } })));
}

export async function addRoomTask(actor: ContentActor, input: unknown) {
  const { roomId, ...task } = addRoomTaskSchema.parse(input);
  const room = await requireManagedRoom(actor, roomId);

  const { _max } = await prisma.roomTask.aggregate({ where: { roomId }, _max: { orderIndex: true } });

  const created = await prisma.roomTask.create({
    data: {
      roomId: room.id,
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

export async function updateRoomTask(actor: ContentActor, input: unknown) {
  const { taskId, ...task } = updateRoomTaskSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);

  const updated = await prisma.roomTask.update({
    where: { id: taskId },
    data: {
      title: task.title,
      description: task.description,
      expectedAnswer: task.expectedAnswer ?? null,
      acceptedAnswers: task.acceptedAnswers,
      hint: task.hint?.trim() ? task.hint.trim() : null,
      points: task.points
    }
  });

  return { task: updated, room: existing.room };
}

/** Menghapus task juga menghapus riwayat jawaban peserta untuk task tersebut (cascade). */
export async function deleteRoomTask(actor: ContentActor, input: unknown) {
  const { taskId } = taskReferenceSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);

  await prisma.roomTask.delete({ where: { id: taskId } });
  await renumberTasks(existing.roomId);

  return existing;
}

export async function moveRoomTask(actor: ContentActor, input: unknown) {
  const { taskId, direction } = moveRoomTaskSchema.parse(input);
  const existing = await requireManagedTask(actor, taskId);

  const ordered = (
    await prisma.roomTask.findMany({
      where: { roomId: existing.roomId },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    })
  ).map((task) => task.id);

  const index = ordered.indexOf(taskId);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index >= 0 && target >= 0 && target < ordered.length) {
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await renumberTasks(existing.roomId, ordered);
  }

  return existing;
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

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

export async function upsertRoomQuiz(actor: ContentActor, input: unknown) {
  const { roomId, ...data } = quizUpsertSchema.parse(input);
  const room = await requireManagedRoom(actor, roomId);

  const quiz = await prisma.quiz.upsert({
    where: { roomId },
    update: data,
    create: { roomId, ...data }
  });

  return { quiz, room };
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
