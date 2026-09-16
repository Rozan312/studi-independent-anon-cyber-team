import type { AnswerType } from "@prisma/client";

/**
 * Penilaian task saat ini berbasis perbandingan string (lihat task-service.ts),
 * dan RoomTask belum memiliki daftar opsi. Label di bawah menjelaskan cara
 * menjawab secara jujur untuk setiap enum tanpa mengklaim ada pilihan klik.
 */
export const answerFormatMeta: Record<AnswerType, { label: string; hint: string; placeholder: string }> = {
  TEXT: {
    label: "Teks singkat",
    hint: "Ketik jawaban singkat. Huruf besar/kecil dan spasi di tepi diabaikan.",
    placeholder: "Ketik jawaban singkat"
  },
  MULTIPLE_CHOICE: {
    label: "Pilih satu istilah",
    hint: "Pilih satu istilah dari deskripsi task, lalu ketik istilah itu.",
    placeholder: "Ketik istilah yang dipilih"
  },
  CHECKBOX: {
    label: "Istilah tunggal",
    hint: "Ketik istilah yang paling tepat dari deskripsi task.",
    placeholder: "Ketik istilah yang dipilih"
  }
};

export function getAnswerFormat(answerType: AnswerType | string) {
  return answerFormatMeta[answerType as AnswerType] ?? answerFormatMeta.TEXT;
}
