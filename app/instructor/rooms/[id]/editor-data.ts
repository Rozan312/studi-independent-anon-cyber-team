import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getRoomForEditor } from "@/lib/services/content-service";

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

/**
 * Data editor room untuk satu request. Layout dan halaman seksinya sama-sama memanggil fungsi ini;
 * cache() membuat keduanya berbagi satu cek peran dan satu query room (termasuk 404-nya).
 */
export const loadRoomEditor = cache(async (roomId: string) => {
  const profile = await requireRole(["INSTRUCTOR"]);
  if (!UUID_PATTERN.test(roomId)) notFound();

  const result = await getRoomForEditor(profile, roomId);
  if (!result) notFound();

  return { profile, room: result.room, canManage: result.canManage };
});

/** Alamat seksi editor; halaman Details berada di akar room. */
export function roomEditorHref(roomId: string, section?: "schedule" | "material" | "tasks" | "quiz") {
  return section ? `/instructor/rooms/${roomId}/${section}` : `/instructor/rooms/${roomId}`;
}
