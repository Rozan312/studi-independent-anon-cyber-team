import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getClassLeaderboard, getGlobalLeaderboard } from "@/lib/services/leaderboard-service";

export async function GET(request: Request) {
  try {
    await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const limit = Number(searchParams.get("limit") ?? 25);

    if (classId) return jsonOk(await getClassLeaderboard(classId, limit));
    return jsonOk(await getGlobalLeaderboard(limit));
  } catch (error) {
    return jsonError(error, 401);
  }
}
