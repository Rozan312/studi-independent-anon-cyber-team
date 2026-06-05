import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getUserTaskSubmissions, submitTaskAnswer } from "@/lib/services/task-service";

export async function GET(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId") ?? undefined;
    return jsonOk(await getUserTaskSubmissions(profile.id, taskId));
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["STUDENT"]);
    return jsonOk(await submitTaskAnswer(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
