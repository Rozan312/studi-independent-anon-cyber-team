"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { userMessage } from "@/lib/errors";
import { submitTaskAnswer } from "@/lib/services/task-service";

export type LearningActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const defaultErrorMessage = "Couldn't process that. Check your input and try again.";

function toActionError(error: unknown): LearningActionState {
  if (error instanceof ZodError) {
    return {
      tone: "error",
      message: error.issues[0]?.message ?? defaultErrorMessage
    };
  }

  return {
    tone: "error",
    message: userMessage(error, defaultErrorMessage)
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
        message: "Enter an answer first."
      };
    }

    const result = await submitTaskAnswer(profile.id, { taskId, answer });

    if (roomSlug) {
      // Seluruh subtree room (Material, Quiz, Lab): strip progres, status task, dan tautan task terbuka ikut berubah. Next 14 mencocokkan
      // revalidasi "layout" dengan pola rute, bukan alamat nyata, jadi pola [slug] dipakai di sini.
      revalidatePath("/rooms/[slug]", "layout");
      revalidatePath("/progress");
      revalidatePath("/leaderboard");
      revalidatePath("/profile");
      revalidatePath("/dashboard");
    }

    if (result.isCorrect) {
      const progressNote = result.progressPercentage === 100 ? "Room complete." : `Room progress is now ${result.progressPercentage ?? 0}%.`;
      return {
        tone: "success",
        message: `Correct. Points and progress recorded. ${progressNote}`
      };
    }

    // Jumlah percobaan dan sisa menuju hint hanya ditampilkan oleh catatan di form, agar tidak dobel.
    let message = "Not quite.";

    if (result.hasHint) {
      message += result.hintUnlocked ? " The hint is unlocked below the answer field." : " Try again.";
    } else {
      message += " Review the material and task instructions, then try again.";
    }

    return { tone: "error", message };
  } catch (error) {
    return toActionError(error);
  }
}
