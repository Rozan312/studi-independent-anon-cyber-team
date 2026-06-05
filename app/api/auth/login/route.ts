import { jsonError, jsonOk } from "@/lib/http";
import { loginUser } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    const user = await loginUser(await request.json());
    return jsonOk({ id: user?.id, email: user?.email });
  } catch (error) {
    return jsonError(error, 401);
  }
}
