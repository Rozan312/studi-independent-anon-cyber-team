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

    const result = await submitTaskAnswer(profile.id, { taskId, answer });

    if (roomSlug) {
      revalidatePath(`/rooms/${roomSlug}`);
      revalidatePath("/progress");
      revalidatePath("/leaderboard");
      revalidatePath("/profile");
      revalidatePath("/dashboard");
    }

    if (result.isCorrect) {
      const progressNote = result.progressPercentage === 100 ? "Room selesai." : `Progress room sekarang ${result.progressPercentage ?? 0}%.`;
      return {
        tone: "success",
        message: `Jawaban benar. Poin dan progress sudah dicatat. ${progressNote}`
      };
    }

    let message = `Jawaban belum tepat (percobaan salah ke-${result.wrongAttempts}).`;

    if (result.hasHint) {
      message += result.hintUnlocked
        ? " Hint sudah terbuka di bawah kolom jawaban."
        : ` Hint terbuka setelah ${result.hintUnlockAfter} percobaan salah.`;
    } else {
      message += " Baca kembali materi dan instruksi task, lalu coba lagi.";
    }

    return { tone: "error", message };
  } catch (error) {
    return toActionError(error);
  }
}
