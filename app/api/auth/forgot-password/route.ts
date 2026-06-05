import { jsonError, jsonOk } from "@/lib/http";
import { requestPasswordReset } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    await requestPasswordReset(await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
