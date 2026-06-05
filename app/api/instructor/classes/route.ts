import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getClassMembers, getInstructorClasses } from "@/lib/services/instructor-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (classId) return jsonOk(await getClassMembers(profile.id, classId));
    return jsonOk(await getInstructorClasses(profile.id));
  } catch (error) {
    return jsonError(error, 401);
  }
}
