"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
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
        message: "Enter an answer first."
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
      const progressNote = result.progressPercentage === 100 ? "Room complete." : `Room progress is now ${result.progressPercentage ?? 0}%.`;
      return {
        tone: "success",
        message: `Correct. Points and progress recorded. ${progressNote}`
      };
    }

    let message = `Not quite (wrong attempt ${result.wrongAttempts}).`;

    if (result.hasHint) {
      message += result.hintUnlocked
        ? " The hint is now open below the answer field."
        : ` The hint opens after ${result.hintUnlockAfter} wrong attempts.`;
    } else {
      message += " Review the material and task instructions, then try again.";
    }

    return { tone: "error", message };
  } catch (error) {
    return toActionError(error);
  }
}
