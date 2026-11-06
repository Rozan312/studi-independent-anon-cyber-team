import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getRoomForMemberApi, getRoomTasks, listPublishedRooms, startRoomProgress } from "@/lib/services/room-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const roomId = searchParams.get("roomId");

    if (roomId) return jsonOk(await getRoomTasks(roomId, profile.role));
    if (slug) return jsonOk(await getRoomForMemberApi(slug, profile.role));
    return jsonOk(await listPublishedRooms());
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    return jsonOk(await startRoomProgress(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
