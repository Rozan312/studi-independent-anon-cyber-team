import { jsonError, jsonOk } from "@/lib/http";
import { registerUser } from "@/lib/services/auth-service";

export async function POST(request: Request) {
  try {
    const user = await registerUser(await request.json());
    return jsonOk({ id: user.id, email: user.email });
  } catch (error) {
    return jsonError(error);
  }
}
