"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createRoomWithTasks } from "@/lib/services/instructor-service";
import { ContentAccessError, setRoomPublished } from "@/lib/services/content-service";
import type { ActionMessageState } from "@/components/ui/action-message";

export type InstructorActionState = ActionMessageState;

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function intValue(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseInt(fieldValue(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "true" || formData.get(key) === "on";
}

function actionError(error: unknown): InstructorActionState {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return {
      tone: "error",
      message: `${field}${issue?.message ?? "Validasi room gagal."}`
    };
  }

  if (error instanceof ContentAccessError) {
    return { tone: "error", message: error.message };
  }

  return {
    tone: "error",
    message: error instanceof Error ? error.message : "Aksi instructor gagal diproses."
  };
}

/**
 * Membuat room beserta task awal, mencatat pembuatnya, lalu membuka editor room
 * agar instruktur dapat langsung mengisi materi dan quiz.
 */
export async function createInstructorRoomAction(_state: InstructorActionState, formData: FormData): Promise<InstructorActionState> {
  let createdRoomId: string | null = null;

  try {
    const profile = await requireRole(["INSTRUCTOR"]);

    const taskTitles = formData.getAll("taskTitle").map(String);
    const taskDescriptions = formData.getAll("taskDescription").map(String);
    const taskAnswers = formData.getAll("taskExpectedAnswer").map(String);
    const taskPoints = formData.getAll("taskPoints").map(String);

    const tasks = taskTitles
      .map((title, index) => ({
        title: title.trim(),
        description: (taskDescriptions[index] ?? "").trim(),
        expectedAnswer: (taskAnswers[index] ?? "").trim() || undefined,
        points: Number.parseInt(taskPoints[index] ?? "10", 10)
      }))
      .filter((task) => task.title || task.description || task.expectedAnswer);

    const room = await createRoomWithTasks(
      {
        learningPathId: fieldValue(formData, "learningPathId"),
        title: fieldValue(formData, "title"),
        slug: fieldValue(formData, "slug"),
        description: fieldValue(formData, "description"),
        category: fieldValue(formData, "category"),
        difficulty: fieldValue(formData, "difficulty"),
        estimatedMinutes: intValue(formData, "estimatedMinutes", 45),
        points: intValue(formData, "points", 100),
        orderIndex: intValue(formData, "orderIndex", 100),
        isPublished: boolValue(formData, "isPublished"),
        tasks
      },
      profile.id
    );

    createdRoomId = room.id;
    revalidatePath("/instructor/rooms");
    revalidatePath("/rooms");
    revalidatePath(`/rooms/${room.slug}`);
    revalidatePath("/learning-paths");
  } catch (error) {
    return actionError(error);
  }

  redirect(`/instructor/rooms/${createdRoomId}?created=1`);
}

export async function publishInstructorRoomAction(_state: InstructorActionState, formData: FormData): Promise<InstructorActionState> {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    const room = await setRoomPublished(profile, { roomId: fieldValue(formData, "roomId"), isPublished: true });

    revalidatePath("/instructor/rooms");
    revalidatePath("/rooms");
    revalidatePath(`/rooms/${room.slug}`);

    return {
      tone: "success",
      message: "Room berhasil dipublish."
    };
  } catch (error) {
    return actionError(error);
  }
}
