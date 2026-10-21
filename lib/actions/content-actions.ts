"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import type { ActionMessageState } from "@/components/ui/action-message";
import {
  ContentAccessError,
  addQuizQuestion,
  addRoomTask,
  addRoomToLearningPath,
  createLearningPath,
  deleteQuizQuestion,
  deleteRoomTask,
  moveQuizQuestion,
  moveRoomInPath,
  moveRoomTask,
  setLearningPathPublished,
  setRoomPublished,
  updateLearningPath,
  updateQuizQuestion,
  updateRoomContent,
  updateRoomMetadata,
  updateRoomTask,
  upsertRoomQuiz
} from "@/lib/services/content-service";

export type ContentActionState = ActionMessageState;

// ---------------------------------------------------------------------------
// FormData helpers
// ---------------------------------------------------------------------------

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? value : undefined;
}

/** Textarea "satu nilai per baris" menjadi array unik tanpa baris kosong. */
function lines(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (typeof raw !== "string") return [];

  return Array.from(
    new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )
  );
}

function integer(formData: FormData, key: string) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function parseOptions(formData: FormData) {
  const labels = formData.getAll("optionLabel").map((entry) => (typeof entry === "string" ? entry.trim() : ""));
  const correctIndex = Number.parseInt(text(formData, "correctOption"), 10);

  return labels
    .map((label, index) => ({ label, isCorrect: index === correctIndex }))
    .filter((option) => option.label.length > 0);
}

function fail(error: unknown, fallback: string): ContentActionState {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return { tone: "error", message: `${field}${issue?.message ?? fallback}` };
  }

  if (error instanceof ContentAccessError) {
    return { tone: "error", message: error.message };
  }

  return { tone: "error", message: error instanceof Error && error.message ? error.message : fallback };
}

function revalidateRoomPaths(room: { id?: string; slug: string; learningPath?: { slug: string } | null }, roomId?: string) {
  revalidatePath("/instructor/rooms");
  revalidatePath(`/instructor/rooms/${roomId ?? room.id}`);
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${room.slug}`);
  revalidatePath(`/rooms/${room.slug}/quiz`);
  revalidatePath(`/rooms/${room.slug}/lab`);
  revalidatePath("/learning-paths");
  if (room.learningPath?.slug) revalidatePath(`/learning-paths/${room.learningPath.slug}`);
  revalidatePath("/dashboard");
}

function revalidatePathPages(pathId: string, slug?: string) {
  revalidatePath("/instructor/paths");
  revalidatePath(`/instructor/paths/${pathId}`);
  revalidatePath("/instructor/rooms/new");
  revalidatePath("/learning-paths");
  if (slug) revalidatePath(`/learning-paths/${slug}`);
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Learning paths
// ---------------------------------------------------------------------------

export async function createLearningPathAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  let createdId: string | null = null;

  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const path = await createLearningPath(actor, {
      title: text(formData, "title"),
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      category: text(formData, "category"),
      difficulty: text(formData, "difficulty"),
      estimatedHours: integer(formData, "estimatedHours"),
      coverImageUrl: text(formData, "coverImageUrl"),
      isPublished: bool(formData, "isPublished")
    });

    createdId = path.id;
    revalidatePathPages(path.id, path.slug);
  } catch (error) {
    return fail(error, "Learning path belum berhasil dibuat.");
  }

  redirect(`/instructor/paths/${createdId}?created=1`);
}

export async function updateLearningPathAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const path = await updateLearningPath(actor, {
      pathId: text(formData, "pathId"),
      title: text(formData, "title"),
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      category: text(formData, "category"),
      difficulty: text(formData, "difficulty"),
      estimatedHours: integer(formData, "estimatedHours"),
      coverImageUrl: text(formData, "coverImageUrl")
    });

    revalidatePathPages(path.id, path.slug);
    return { tone: "success", message: "Learning path berhasil disimpan." };
  } catch (error) {
    return fail(error, "Learning path belum berhasil disimpan.");
  }
}

export async function toggleLearningPathPublishAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const path = await setLearningPathPublished(actor, {
      pathId: text(formData, "pathId"),
      isPublished: bool(formData, "isPublished")
    });

    revalidatePathPages(path.id, path.slug);
    return {
      tone: "success",
      message: path.isPublished ? "Learning path dipublish dan terlihat oleh student." : "Learning path dikembalikan ke draft."
    };
  } catch (error) {
    return fail(error, "Status publish belum berhasil diubah.");
  }
}

// ---------------------------------------------------------------------------
// Path composition
// ---------------------------------------------------------------------------

export async function addRoomToPathAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const { room, path, previousPathSlug } = await addRoomToLearningPath(actor, {
      pathId: text(formData, "pathId"),
      roomId: text(formData, "roomId")
    });

    revalidatePathPages(path.id, path.slug);
    revalidatePath(`/learning-paths/${previousPathSlug}`);
    revalidateRoomPaths({ id: room.id, slug: room.slug });

    return { tone: "success", message: `Room "${room.title}" ditambahkan sebagai modul ke-${room.orderIndex} di path ini.` };
  } catch (error) {
    return fail(error, "Room belum berhasil ditambahkan ke path.");
  }
}

export async function moveRoomInPathAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const room = await moveRoomInPath(actor, {
      roomId: text(formData, "roomId"),
      direction: text(formData, "direction")
    });

    revalidatePathPages(room.learningPath.id, room.learningPath.slug);
    revalidatePath("/rooms");
    revalidatePath("/instructor/rooms");

    return { tone: "idle", message: "" };
  } catch (error) {
    return fail(error, "Urutan room belum berhasil diubah.");
  }
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function updateRoomMetadataAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const room = await updateRoomMetadata(actor, {
      roomId: text(formData, "roomId"),
      learningPathId: text(formData, "learningPathId"),
      title: text(formData, "title"),
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      category: text(formData, "category"),
      difficulty: text(formData, "difficulty"),
      estimatedMinutes: integer(formData, "estimatedMinutes"),
      points: integer(formData, "points"),
      orderIndex: integer(formData, "orderIndex"),
      coverImageUrl: text(formData, "coverImageUrl"),
      availableFrom: text(formData, "availableFrom"),
      availableUntil: text(formData, "availableUntil")
    });

    revalidateRoomPaths({ id: room.id, slug: room.slug });
    return { tone: "success", message: "Informasi room berhasil disimpan." };
  } catch (error) {
    return fail(error, "Informasi room belum berhasil disimpan.");
  }
}

/** Hasil simpan materi: menyertakan HTML yang benar-benar tersimpan agar editor bisa menyelaraskan diri. */
export type MaterialActionState = ContentActionState & { savedContent?: string; saveId?: number };

export async function updateRoomContentAction(_state: MaterialActionState, formData: FormData): Promise<MaterialActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const rawContent = formData.get("content");
    const room = await updateRoomContent(actor, {
      roomId: text(formData, "roomId"),
      content: typeof rawContent === "string" ? rawContent.replace(/\r\n/g, "\n") : "",
      contentFormat: text(formData, "contentFormat") === "HTML" ? "HTML" : "MARKDOWN"
    });

    revalidateRoomPaths({ id: room.id, slug: room.slug });
    return { tone: "success", message: "Materi room berhasil disimpan.", savedContent: room.content, saveId: Date.now() };
  } catch (error) {
    return fail(error, "Materi belum berhasil disimpan.");
  }
}

export async function toggleRoomPublishAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const room = await setRoomPublished(actor, {
      roomId: text(formData, "roomId"),
      isPublished: bool(formData, "isPublished")
    });

    revalidateRoomPaths({ id: room.id, slug: room.slug });
    return {
      tone: "success",
      message: room.isPublished ? "Room dipublish dan bisa dibuka student." : "Room dikembalikan ke draft."
    };
  } catch (error) {
    return fail(error, "Status publish room belum berhasil diubah.");
  }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function addRoomTaskAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const { room } = await addRoomTask(actor, {
      roomId: text(formData, "roomId"),
      title: text(formData, "title"),
      description: text(formData, "description"),
      expectedAnswer: optionalText(formData, "expectedAnswer"),
      acceptedAnswers: lines(formData, "acceptedAnswers"),
      hint: optionalText(formData, "hint"),
      points: integer(formData, "points") ?? 10
    });

    revalidateRoomPaths(room);
    return { tone: "success", message: "Task baru ditambahkan." };
  } catch (error) {
    return fail(error, "Task belum berhasil ditambahkan.");
  }
}

export async function updateRoomTaskAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const { room, task } = await updateRoomTask(actor, {
      taskId: text(formData, "taskId"),
      title: text(formData, "title"),
      description: text(formData, "description"),
      expectedAnswer: optionalText(formData, "expectedAnswer"),
      acceptedAnswers: lines(formData, "acceptedAnswers"),
      hint: optionalText(formData, "hint"),
      points: integer(formData, "points") ?? 10
    });

    revalidateRoomPaths(room, task.roomId);
    return { tone: "success", message: "Task berhasil disimpan." };
  } catch (error) {
    return fail(error, "Task belum berhasil disimpan.");
  }
}

export async function deleteRoomTaskAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const task = await deleteRoomTask(actor, { taskId: text(formData, "taskId") });

    revalidateRoomPaths(task.room, task.roomId);
    return { tone: "success", message: "Task dihapus beserta riwayat jawabannya." };
  } catch (error) {
    return fail(error, "Task belum berhasil dihapus.");
  }
}

export async function moveRoomTaskAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const task = await moveRoomTask(actor, {
      taskId: text(formData, "taskId"),
      direction: text(formData, "direction")
    });

    revalidateRoomPaths(task.room, task.roomId);
    return { tone: "idle", message: "" };
  } catch (error) {
    return fail(error, "Urutan task belum berhasil diubah.");
  }
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export async function upsertQuizAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const { room } = await upsertRoomQuiz(actor, {
      roomId: text(formData, "roomId"),
      title: text(formData, "title"),
      description: text(formData, "description"),
      passingScore: integer(formData, "passingScore")
    });

    revalidateRoomPaths(room);
    return { tone: "success", message: "Pengaturan quiz berhasil disimpan." };
  } catch (error) {
    return fail(error, "Pengaturan quiz belum berhasil disimpan.");
  }
}

export async function addQuizQuestionAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const { room } = await addQuizQuestion(actor, {
      quizId: text(formData, "quizId"),
      question: text(formData, "question"),
      explanation: text(formData, "explanation"),
      options: parseOptions(formData)
    });

    revalidateRoomPaths(room, text(formData, "roomId"));
    return { tone: "success", message: "Pertanyaan ditambahkan ke quiz." };
  } catch (error) {
    return fail(error, "Pertanyaan belum berhasil ditambahkan.");
  }
}

export async function updateQuizQuestionAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const question = await updateQuizQuestion(actor, {
      questionId: text(formData, "questionId"),
      question: text(formData, "question"),
      explanation: text(formData, "explanation"),
      options: parseOptions(formData)
    });

    revalidateRoomPaths(question.quiz.room, question.quiz.roomId);
    return { tone: "success", message: "Pertanyaan berhasil disimpan." };
  } catch (error) {
    return fail(error, "Pertanyaan belum berhasil disimpan.");
  }
}

export async function deleteQuizQuestionAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const question = await deleteQuizQuestion(actor, { questionId: text(formData, "questionId") });

    revalidateRoomPaths(question.quiz.room, question.quiz.roomId);
    return { tone: "success", message: "Pertanyaan dihapus." };
  } catch (error) {
    return fail(error, "Pertanyaan belum berhasil dihapus.");
  }
}

export async function moveQuizQuestionAction(_state: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    const actor = await requireRole(["INSTRUCTOR"]);
    const question = await moveQuizQuestion(actor, {
      questionId: text(formData, "questionId"),
      direction: text(formData, "direction")
    });

    revalidateRoomPaths(question.quiz.room, question.quiz.roomId);
    return { tone: "idle", message: "" };
  } catch (error) {
    return fail(error, "Urutan pertanyaan belum berhasil diubah.");
  }
}
