import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { createRoomDraft, updateRoomDraft } from "@/lib/services/instructor-service";
import { assertCanManageRoom, setRoomPublished } from "@/lib/services/content-service";

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    return jsonOk(await createRoomDraft(await request.json(), profile.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    const body = await request.json();
    if (typeof body?.roomId === "string") {
      await assertCanManageRoom(profile, body.roomId);
    }
    return jsonOk(await updateRoomDraft(body));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    const { roomId } = await request.json();
    return jsonOk(await setRoomPublished(profile, { roomId, isPublished: true }));
  } catch (error) {
    return jsonError(error);
  }
}
