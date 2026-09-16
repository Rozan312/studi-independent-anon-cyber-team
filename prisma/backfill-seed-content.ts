/**
 * Backfill non-destruktif untuk database yang sudah ada:
 * 1. Mengisi materi room seed yang masih kosong (tidak menimpa materi yang sudah ditulis instruktur).
 * 2. Mengisi hint dan jawaban alternatif task seed yang belum punya hint.
 * 3. Menghitung ulang seluruh UserRoomProgress dengan aturan penyelesaian tunggal.
 *
 * Jalankan: npm run prisma:backfill-content
 */
import { PrismaClient, ProgressStatus } from "@prisma/client";
import { roomContentBySlug, taskHintsByRoomSlug } from "./seed-content";

const prisma = new PrismaClient();

function computeRoomProgress(input: { taskCount: number; correctTaskCount: number; hasQuiz: boolean; quizPassed: boolean }) {
  const totalUnits = input.taskCount + (input.hasQuiz ? 1 : 0);
  const doneUnits = Math.min(input.correctTaskCount, input.taskCount) + (input.hasQuiz && input.quizPassed ? 1 : 0);
  const isComplete = totalUnits > 0 && doneUnits >= totalUnits;
  const rawPercentage = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);
  return { percentage: isComplete ? 100 : Math.min(rawPercentage, 99), isComplete };
}

async function backfillContent() {
  let filled = 0;
  for (const [slug, content] of Object.entries(roomContentBySlug)) {
    const result = await prisma.room.updateMany({ where: { slug, content: "" }, data: { content } });
    filled += result.count;
  }
  console.log(`materi room diisi: ${filled}`);
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
  await backfillContent();
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
