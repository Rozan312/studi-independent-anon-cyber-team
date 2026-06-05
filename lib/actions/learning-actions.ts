"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { submitTaskAnswer } from "@/lib/services/task-service";

export type LearningActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const defaultErrorMessage = "Aksi belum berhasil diproses. Cek input lalu coba lagi.";

function toActionError(error: unknown): LearningActionState {
  if (error instanceof ZodError) {
    return {
      tone: "error",
      message: error.issues[0]?.message ?? defaultErrorMessage
    };
  }

  if (error instanceof Error) {
    return {
      tone: "error",
      message: error.message || defaultErrorMessage
    };
  }

  return {
    tone: "error",
    message: defaultErrorMessage
  };
}

export async function submitTaskAnswerAction(
  _previousState: LearningActionState,
  formData: FormData
): Promise<LearningActionState> {
  try {
    const profile = await requireRole(["STUDENT"]);
    const taskId = String(formData.get("taskId") ?? "");
    const roomSlug = String(formData.get("roomSlug") ?? "");
    const answer = String(formData.get("answer") ?? "").trim();

    if (!answer) {
      return {
        tone: "error",
        message: "Jawaban belum diisi."
      };
    }

    const submission = await submitTaskAnswer(profile.id, { taskId, answer });

    if (roomSlug) {
      revalidatePath(`/rooms/${roomSlug}`);
      revalidatePath("/progress");
      revalidatePath("/leaderboard");
    }

    return submission.isCorrect
      ? {
          tone: "success",
          message: "Jawaban benar. Progress dan poin sudah disinkronkan."
        }
      : {
          tone: "error",
          message: "Jawaban belum tepat. Pelajari kembali instruksi lalu coba lagi."
        };
  } catch (error) {
    return toActionError(error);
  }
}
