-- Logo opsional untuk learning path dan room; tanpa logo, UI memakai inisial nama.
ALTER TABLE "LearningPath" ADD COLUMN "logoUrl" TEXT;

ALTER TABLE "Room" ADD COLUMN "logoUrl" TEXT;
