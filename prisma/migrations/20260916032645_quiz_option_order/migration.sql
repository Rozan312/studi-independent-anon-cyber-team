-- DropIndex
DROP INDEX "QuizOption_questionId_idx";

-- AlterTable
ALTER TABLE "QuizOption" ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "QuizOption_questionId_orderIndex_idx" ON "QuizOption"("questionId", "orderIndex");
