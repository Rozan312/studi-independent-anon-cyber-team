-- CreateTable
CREATE TABLE "RoomChapter" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "contentFormat" "ContentFormat" NOT NULL DEFAULT 'HTML',
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomChapter_roomId_orderIndex_idx" ON "RoomChapter"("roomId", "orderIndex");

-- AddForeignKey
ALTER TABLE "RoomChapter" ADD CONSTRAINT "RoomChapter_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Materi lama tiap room menjadi Bab 1 dengan judul room. Kolom Room.content/contentFormat
-- dibiarkan apa adanya sebagai cadangan.
INSERT INTO "RoomChapter" ("id", "roomId", "title", "content", "contentFormat", "orderIndex", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", "title", "content", "contentFormat", 0, now(), now()
FROM "Room"
WHERE trim("content") <> '';
