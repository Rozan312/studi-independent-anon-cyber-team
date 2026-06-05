import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import {
  createLabSessionPlaceholder,
  getLabSessionStatus,
  getLatestLabSessionForRoom,
  stopLabSession,
  updateLabSessionStatus
} from "@/lib/services/lab-session-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const roomId = searchParams.get("roomId");

    if (sessionId) return jsonOk(await getLabSessionStatus(profile.id, sessionId));
    if (roomId) return jsonOk(await getLatestLabSessionForRoom(profile.id, roomId));
    throw new Error("sessionId or roomId query parameter is required.");
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    return jsonOk(await createLabSessionPlaceholder(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["INSTRUCTOR"]);
    return jsonOk(await updateLabSessionStatus(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) throw new Error("sessionId query parameter is required.");
    return jsonOk(await stopLabSession(profile.id, sessionId));
  } catch (error) {
    return jsonError(error);
  }
}
