/**
 * Aturan kecil bab materi yang dipakai halaman room member dan judul tab-nya. Bebas dependensi server.
 */

/** Posisi bab dari ?chapter=N (N mulai 1). Kosong, bukan angka, atau di luar jangkauan jatuh ke bab pertama. */
export function chapterIndexFrom(value: string | string[] | undefined, count: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 0;
  const number = Number(raw);
  return number >= 1 && number <= count ? number - 1 : 0;
}

/**
 * Judul bab yang hanya mengulang judul room (misalnya bab pertama hasil migrasi, yang memakai judul room).
 * Judul seperti itu tidak ditampilkan lagi karena judul room sudah menjadi judul halaman.
 */
export function repeatsRoomTitle(chapterTitle: string, roomTitle: string) {
  return chapterTitle.trim().toLowerCase() === roomTitle.trim().toLowerCase();
}

/**
 * Bab tempat task tampil: bab pilihannya bila masih ada di room, selain itu bab terakhir (task tanpa bab dan task
 * yang babnya dihapus). Null hanya bila room belum punya bab. `chapters` harus berurutan seperti di halaman room.
 */
export function taskChapterId(chapterId: string | null, chapters: readonly { id: string }[]) {
  if (chapters.length === 0) return null;
  if (chapterId && chapters.some((chapter) => chapter.id === chapterId)) return chapterId;
  return chapters[chapters.length - 1].id;
}

/**
 * Alamat task di halaman room member: bab tempat task tampil (`?chapter=N`, N mulai 1) dengan jangkar #tasks.
 * Room tanpa bab menampilkan task-nya langsung di halaman Material.
 */
export function taskChapterHref(slug: string, chapterId: string | null, chapters: readonly { id: string }[]) {
  const shownId = taskChapterId(chapterId, chapters);
  const index = shownId ? chapters.findIndex((chapter) => chapter.id === shownId) : -1;
  return `/rooms/${slug}${index >= 0 ? `?chapter=${index + 1}` : ""}#tasks`;
}

export type ChapterTaskStatus = "completed" | "active" | "locked";

/**
 * Status buka task, per bab: di dalam satu bab task terbuka berurutan (task berikutnya terbuka setelah task
 * sebelumnya benar), sedangkan task di bab lain tidak ikut terkunci. `tasks` berurutan menurut orderIndex.
 */
export function chapterTaskStatuses(
  tasks: readonly { id: string; chapterId: string | null }[],
  chapters: readonly { id: string }[],
  solvedTaskIds: ReadonlySet<string>
) {
  const activeFound = new Set<string | null>();
  const statuses = new Map<string, ChapterTaskStatus>();

  for (const task of tasks) {
    const chapter = taskChapterId(task.chapterId, chapters);
    if (solvedTaskIds.has(task.id)) {
      statuses.set(task.id, "completed");
    } else if (!activeFound.has(chapter)) {
      statuses.set(task.id, "active");
      activeFound.add(chapter);
    } else {
      statuses.set(task.id, "locked");
    }
  }

  return statuses;
}
