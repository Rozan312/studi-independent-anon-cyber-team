import { jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/auth/guards";
import { resetPassword } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    await requireAuth();
    await resetPassword(await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
