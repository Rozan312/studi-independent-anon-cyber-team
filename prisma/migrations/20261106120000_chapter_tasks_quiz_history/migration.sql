-- DropForeignKey
ALTER TABLE "UserQuizAttempt" DROP CONSTRAINT "UserQuizAttempt_quizId_fkey";

-- AlterTable
ALTER TABLE "RoomTask" ADD COLUMN     "chapterId" UUID;

-- AlterTable
ALTER TABLE "UserQuizAttempt" ADD COLUMN     "quizTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "roomId" UUID,
ALTER COLUMN "quizId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "RoomTask_chapterId_orderIndex_idx" ON "RoomTask"("chapterId", "orderIndex");

-- CreateIndex
CREATE INDEX "UserQuizAttempt_userId_roomId_idx" ON "UserQuizAttempt"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "RoomTask" ADD CONSTRAINT "RoomTask_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "RoomChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuizAttempt" ADD CONSTRAINT "UserQuizAttempt_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Task lama masuk ke bab terakhir room-nya (orderIndex terbesar; bila sama, bab yang dibuat paling akhir).
-- Room tanpa bab membiarkan chapterId NULL.
UPDATE "RoomTask" AS t
SET "chapterId" = last_chapter."id"
FROM (
    SELECT DISTINCT ON ("roomId") "id", "roomId"
    FROM "RoomChapter"
    ORDER BY "roomId", "orderIndex" DESC, "createdAt" DESC, "id" DESC
) AS last_chapter
WHERE last_chapter."roomId" = t."roomId";

-- Salinan room dan judul quiz untuk setiap attempt, agar riwayat tetap terbaca setelah quiz dihapus.
UPDATE "UserQuizAttempt" AS a
SET "roomId" = q."roomId", "quizTitle" = q."title"
FROM "Quiz" AS q
WHERE q."id" = a."quizId";
