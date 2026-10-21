import type { AnswerType } from "@prisma/client";

/**
 * Penilaian task saat ini berbasis perbandingan string (lihat task-service.ts),
 * dan RoomTask belum memiliki daftar opsi. Label di bawah menjelaskan cara
 * menjawab secara jujur untuk setiap enum tanpa mengklaim ada pilihan klik.
 */
export const answerFormatMeta: Record<AnswerType, { label: string; hint: string; placeholder: string }> = {
  TEXT: {
    label: "Short text",
    hint: "Type a short answer. Letter case and leading/trailing spaces are ignored.",
    placeholder: "Type a short answer"
  },
  MULTIPLE_CHOICE: {
    label: "Pick one term",
    hint: "Pick one term from the task description, then type it.",
    placeholder: "Type the term you picked"
  },
  CHECKBOX: {
    label: "Single term",
    hint: "Type the term from the task description that fits best.",
    placeholder: "Type the term you picked"
  }
};

export function getAnswerFormat(answerType: AnswerType | string) {
  return answerFormatMeta[answerType as AnswerType] ?? answerFormatMeta.TEXT;
}
