"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createRoomWithTasks, publishRoom } from "@/lib/services/instructor-service";
import type { ActionMessageState } from "@/components/ui/action-message";

export type InstructorActionState = ActionMessageState;

const initialState: InstructorActionState = {
  tone: "idle",
  message: ""
};

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
    return {
      tone: "error",
      message: error.issues[0]?.message ?? "Validasi room gagal."
    };
  }

  return {
    tone: "error",
    message: error instanceof Error ? error.message : "Aksi instructor gagal diproses."
  };
}

export async function createInstructorRoomAction(_state: InstructorActionState, formData: FormData): Promise<InstructorActionState> {
  try {
    await requireRole(["INSTRUCTOR"]);

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

    const room = await createRoomWithTasks({
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
    });

    revalidatePath("/instructor/rooms");
    revalidatePath("/rooms");
    revalidatePath(`/rooms/${room.slug}`);

    return {
      tone: "success",
      message: room.isPublished ? "Room berhasil dibuat dan dipublish." : "Draft room berhasil dibuat."
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishInstructorRoomAction(_state: InstructorActionState, formData: FormData): Promise<InstructorActionState> {
  try {
    await requireRole(["INSTRUCTOR"]);
    const room = await publishRoom(fieldValue(formData, "roomId"));

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
