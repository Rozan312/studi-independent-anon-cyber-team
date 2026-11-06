-- AlterTable
ALTER TABLE "LearningPath" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "createdById" UUID;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "createdById" UUID;

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "uploaderId" UUID,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_uploaderId_createdAt_idx" ON "MediaAsset"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningPath_createdById_idx" ON "LearningPath"("createdById");

-- CreateIndex
CREATE INDEX "Room_createdById_idx" ON "Room"("createdById");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
