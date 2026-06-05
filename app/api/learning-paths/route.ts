import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import {
  getLearningPathBySlug,
  getLearningPathProgressForCurrentUser,
  listPublishedLearningPaths
} from "@/lib/services/learning-path-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const includeProgress = searchParams.get("progress") === "true";

    if (slug && includeProgress) {
      return jsonOk(await getLearningPathProgressForCurrentUser(profile.id, slug));
    }

    if (slug) {
      return jsonOk(await getLearningPathBySlug(slug));
    }

    return jsonOk(await listPublishedLearningPaths());
  } catch (error) {
    return jsonError(error, 401);
  }
}
