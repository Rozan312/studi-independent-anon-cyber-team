-- AlterTable
ALTER TABLE "RoomTask" ADD COLUMN     "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hint" TEXT;
