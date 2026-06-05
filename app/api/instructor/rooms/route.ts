import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { createRoomDraft, publishRoom, updateRoomDraft } from "@/lib/services/instructor-service";

export async function POST(request: Request) {
  try {
    await requireRole(["INSTRUCTOR"]);
    return jsonOk(await createRoomDraft(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["INSTRUCTOR"]);
    return jsonOk(await updateRoomDraft(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole(["INSTRUCTOR"]);
    const { roomId } = await request.json();
    return jsonOk(await publishRoom(roomId));
  } catch (error) {
    return jsonError(error);
  }
}
