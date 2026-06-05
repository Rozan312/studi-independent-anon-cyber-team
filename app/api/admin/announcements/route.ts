import { jsonError, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth/guards";
import {
  createAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  updateAnnouncement
} from "@/lib/services/admin-service";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    return jsonOk(await listAnnouncements());
  } catch (error) {
    return jsonError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole(["ADMIN"]);
    return jsonOk(await createAnnouncement(profile.id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    return jsonOk(await updateAnnouncement(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const { announcementId, isPublished } = await request.json();
    return jsonOk(await publishAnnouncement(announcementId, Boolean(isPublished)));
  } catch (error) {
    return jsonError(error);
  }
}
