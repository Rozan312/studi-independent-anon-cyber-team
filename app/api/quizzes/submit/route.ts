import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { UserFacingError } from "@/lib/errors";
import { getQuizByRoomSlug, submitQuizAttempt } from "@/lib/services/quiz-service";

export async function GET(request: Request) {
  try {
    await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const roomSlug = searchParams.get("roomSlug");
    if (!roomSlug) throw new UserFacingError("roomSlug query parameter is required.");
    return jsonOk(await getQuizByRoomSlug(roomSlug));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    return jsonOk(await submitQuizAttempt(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
