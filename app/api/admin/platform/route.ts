import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import { getPlatformStatistics } from "@/lib/services/admin-service";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    return jsonOk(await getPlatformStatistics());
  } catch (error) {
    return jsonError(error, 401);
  }
}
