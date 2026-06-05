import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getUserList, updateUserRole } from "@/lib/services/admin-service";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    return jsonOk(await getUserList());
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    return jsonOk(await updateUserRole(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
