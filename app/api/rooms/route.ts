import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getRoomBySlug, getRoomTasks, listPublishedRooms, updateRoomProgress } from "@/lib/services/room-service";

export async function GET(request: Request) {
  try {
    await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const roomId = searchParams.get("roomId");

    if (roomId) return jsonOk(await getRoomTasks(roomId));
    if (slug) return jsonOk(await getRoomBySlug(slug));
    return jsonOk(await listPublishedRooms());
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    return jsonOk(await updateRoomProgress(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
