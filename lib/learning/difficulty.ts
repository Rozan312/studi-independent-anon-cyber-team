/**
 * Tingkat kesulitan disimpan sebagai teks bebas, jadi urutan abjad menaruh "Advanced" sebelum "Beginner".
 * Urutan tampilan memakai peringkat eksplisit; nilai lain diletakkan setelahnya.
 */
const DIFFICULTY_RANK: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2
};

export function difficultyRank(difficulty: string | null | undefined) {
  return DIFFICULTY_RANK[(difficulty ?? "").trim().toLowerCase()] ?? 3;
}

/** Urutkan Beginner → Intermediate → Advanced → lainnya, lalu judul. Tidak mengubah array asal. */
export function sortByDifficulty<T extends { difficulty: string; title: string }>(items: T[]) {
  return [...items].sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty) || a.title.localeCompare(b.title));
}
