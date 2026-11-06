-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('MARKDOWN', 'HTML');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "contentFormat" "ContentFormat" NOT NULL DEFAULT 'MARKDOWN';
