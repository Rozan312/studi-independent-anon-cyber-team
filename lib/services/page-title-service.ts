import "server-only";

import { prisma } from "@/lib/db/prisma";

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

export async function publishedPathTitle(slug: string) {
  const path = await prisma.learningPath.findFirst({ where: { slug, isPublished: true }, select: { title: true } });
  return path?.title ?? null;
}
