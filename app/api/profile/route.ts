import { jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/auth/guards";
import { getProfile, updateProfile } from "@/lib/services/profile-service";

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await getProfile(user.id);
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const profile = await updateProfile(user.id, await request.json());
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error);
  }
}
