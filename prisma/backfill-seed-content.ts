/**
 * Backfill non-destruktif untuk database yang sudah ada:
 * 1. Memberi bab materi seed ke room seed yang belum pernah punya materi sama sekali, dan memecah per bab
 *    room seed yang babnya masih satu salinan migrasi yang belum disunting (bab yang sudah ditulis, disunting,
 *    dikosongkan, atau dihapus instruktur tidak disentuh).
 * 2. Mengganti judul bab pertama room seed yang hanya mengulang judul room menjadi "Introduction".
 * 3. Mengisi hint dan jawaban alternatif task seed yang belum punya hint.
 * 4. Menghitung ulang seluruh UserRoomProgress dengan aturan penyelesaian tunggal.
 *
 * Jalankan: npm run prisma:backfill-content
 */
import { ContentFormat, PrismaClient, ProgressStatus } from "@prisma/client";
import { INTRO_CHAPTER_TITLE, roomContentBySlug, sameTitle, splitSeedMaterialIntoChapters, taskHintsByRoomSlug } from "./seed-content";

const prisma = new PrismaClient();

function computeRoomProgress(input: { taskCount: number; correctTaskCount: number; hasQuiz: boolean; quizPassed: boolean }) {
  const totalUnits = input.taskCount + (input.hasQuiz ? 1 : 0);
  const doneUnits = Math.min(input.correctTaskCount, input.taskCount) + (input.hasQuiz && input.quizPassed ? 1 : 0);
  const isComplete = totalUnits > 0 && doneUnits >= totalUnits;
  const rawPercentage = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);
  return { percentage: isComplete ? 100 : Math.min(rawPercentage, 99), isComplete };
}

async function backfillChapters() {
  let filled = 0;
  let resplit = 0;
  for (const [slug, content] of Object.entries(roomContentBySlug)) {
    const room = await prisma.room.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        content: true,
        contentFormat: true,
        chapters: { select: { title: true, content: true, contentFormat: true } }
      }
    });
    if (!room) continue;

    // Satu bab salinan migrasi yang masih sama persis dengan teks seed (judul = judul room, belum disunting)
    // dipecah ulang per heading. Isinya identik dengan seed dan Room.content, jadi tidak ada tulisan yang hilang.
    const [only] = room.chapters;
    const isMigratedSeedCopy =
      room.chapters.length === 1 && only.title === room.title && only.contentFormat === ContentFormat.MARKDOWN && only.content === content;

    // Room tanpa bab hanya diisi bila memang belum pernah punya materi: Room.content lama kosong dan masih
    // Markdown bawaan. Room yang dikosongkan di editor visual (content "" berformat HTML) atau yang semua
    // babnya dihapus instruktur (cadangan Room.content masih berisi) sengaja dibiarkan kosong.
    const neverHadMaterial = room.chapters.length === 0 && room.content === "" && room.contentFormat === ContentFormat.MARKDOWN;
    if (!neverHadMaterial && !isMigratedSeedCopy) continue;

    const chapters = splitSeedMaterialIntoChapters(content, room.title);
    if (chapters.length === 0 || (isMigratedSeedCopy && chapters.length < 2)) continue;

    await prisma.$transaction([
      prisma.roomChapter.deleteMany({ where: { roomId: room.id } }),
      prisma.roomChapter.createMany({
        data: chapters.map((chapter, index) => ({
          roomId: room.id,
          title: chapter.title,
          content: chapter.content,
          contentFormat: ContentFormat.MARKDOWN,
          orderIndex: index
        }))
      })
    ]);
    if (isMigratedSeedCopy) resplit += 1;
    else filled += 1;
  }
  console.log(`room seed diberi bab materi: ${filled}; salinan migrasi dipecah per bab: ${resplit}`);
}

/**
 * Bab pertama room seed yang judulnya sama dengan judul room (salinan migrasi atau hasil seed lama) diberi judul
 * "Introduction", agar judul room tidak tampil dua kali di halaman room. Hanya untuk room dengan lebih dari satu
 * bab: bila hanya satu bab, bab itu adalah seluruh materi dan halaman room menyembunyikan judulnya. Idempoten.
 */
async function renameIntroChapters() {
  let renamed = 0;
  for (const slug of Object.keys(roomContentBySlug)) {
    const room = await prisma.room.findUnique({
      where: { slug },
      select: {
        title: true,
        chapters: { orderBy: { orderIndex: "asc" }, take: 2, select: { id: true, title: true, orderIndex: true, updatedAt: true } }
      }
    });
    const first = room?.chapters[0];
    if (!room || !first || room.chapters.length < 2 || first.orderIndex !== 0 || !sameTitle(first.title, room.title)) continue;

    // updatedAt lama dikirim ulang: ganti judul otomatis ini bukan suntingan instruktur.
    await prisma.roomChapter.update({ where: { id: first.id }, data: { title: INTRO_CHAPTER_TITLE, updatedAt: first.updatedAt } });
    renamed += 1;
  }
  console.log(`bab pembuka diberi judul "${INTRO_CHAPTER_TITLE}": ${renamed}`);
}

async function backfillHints() {
  let updated = 0;
  for (const [slug, tasks] of Object.entries(taskHintsByRoomSlug)) {
    for (const [title, meta] of Object.entries(tasks)) {
      const result = await prisma.roomTask.updateMany({
        where: { title, hint: null, room: { slug } },
        data: { hint: meta.hint, acceptedAnswers: meta.acceptedAnswers }
      });
      updated += result.count;
    }
  }
  console.log(`hint task diisi: ${updated}`);
}

async function recalculateAllProgress() {
  const rows = await prisma.userRoomProgress.findMany({ select: { id: true, userId: true, roomId: true, completedAt: true } });
  let changed = 0;

  for (const row of rows) {
    const [taskCount, correctTaskCount, quiz] = await Promise.all([
      prisma.roomTask.count({ where: { roomId: row.roomId } }),
      prisma.roomTask.count({ where: { roomId: row.roomId, userSubmissions: { some: { userId: row.userId, isCorrect: true } } } }),
      prisma.quiz.findUnique({
        where: { roomId: row.roomId },
        select: { attempts: { where: { userId: row.userId, passed: true }, take: 1, select: { id: true } } }
      })
    ]);

    const snapshot = computeRoomProgress({ taskCount, correctTaskCount, hasQuiz: Boolean(quiz), quizPassed: Boolean(quiz?.attempts.length) });
    const result = await prisma.userRoomProgress.updateMany({
      where: { id: row.id },
      data: {
        progressPercentage: snapshot.percentage,
        status: snapshot.isComplete ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        completedAt: snapshot.isComplete ? row.completedAt ?? new Date() : null
      }
    });
    changed += result.count;
  }

  console.log(`progress dihitung ulang: ${changed} baris`);
}

async function main() {
  await backfillChapters();
  await renameIntroChapters();
  await backfillHints();
  await recalculateAllProgress();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
