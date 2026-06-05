import { jsonError, jsonOk } from "@/lib/http";
import { logoutUser } from "@/lib/services/auth-service";

export async function POST() {
  try {
    await logoutUser();
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
