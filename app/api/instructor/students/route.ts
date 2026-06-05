import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getStudentProgress } from "@/lib/services/instructor-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["INSTRUCTOR"]);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") ?? undefined;
    return jsonOk(await getStudentProgress(profile.id, studentId));
  } catch (error) {
    return jsonError(error, 401);
  }
}
