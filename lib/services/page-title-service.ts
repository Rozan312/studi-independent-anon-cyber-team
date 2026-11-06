import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getRoomAvailability } from "@/lib/learning/availability";
import { chapterIndexFrom, repeatsRoomTitle } from "@/lib/learning/chapters";

/**
 * Judul tab untuk halaman yang memuat satu room atau path. Hanya konten terbit yang dibaca agar nama
 * room/path yang belum terbit tidak bocor lewat <title>; bila tidak ketemu, pakai label umum.
 */
export async function publishedRoomTitle(slug: string) {
  const room = await prisma.room.findFirst({
    where: { slug, isPublished: true, learningPath: { isPublished: true } },
    select: { title: true }
  });
  return room?.title ?? null;
}

/**
 * Judul tab halaman materi room. Room terbuka dengan lebih dari satu bab memakai "Bab · Room" untuk bab yang
 * dibaca (posisi dari ?chapter=N, aturan yang sama dengan halamannya), agar setiap halaman bab berjudul unik.
 * Room yang belum dibuka atau sudah ditutup tidak menampilkan bab, jadi judul babnya juga tidak dipakai di sini.
 */
export async function publishedRoomMaterialTitle(slug: string, chapterParam: string | string[] | undefined) {
  const room = await prisma.room.findFirst({
    where: { slug, isPublished: true, learningPath: { isPublished: true } },
    select: {
      title: true,
      isPublished: true,
      availableFrom: true,
      availableUntil: true,
      chapters: { select: { title: true }, orderBy: { orderIndex: "asc" } }
    }
  });
  if (!room) return null;
  if (room.chapters.length < 2 || !getRoomAvailability(room).isOpen) return room.title;

  const chapter = room.chapters[chapterIndexFrom(chapterParam, room.chapters.length)];
  return repeatsRoomTitle(chapter.title, room.title) ? room.title : `${chapter.title} · ${room.title}`;
}

export async function publishedPathTitle(slug: string) {
  const path = await prisma.learningPath.findFirst({ where: { slug, isPublished: true }, select: { title: true } });
  return path?.title ?? null;
}
