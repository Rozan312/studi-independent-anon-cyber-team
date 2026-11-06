"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { userMessage } from "@/lib/errors";
import { createAnnouncement, publishAnnouncement, updateAnnouncement, updateUserRole } from "@/lib/services/admin-service";
import type { ActionMessageState } from "@/components/ui/action-message";
import { zodErrorMessage, type FieldLabels } from "@/lib/actions/form-errors";

export type AdminActionState = ActionMessageState;

const idleState: AdminActionState = {
  tone: "idle",
  message: ""
};

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "true" || formData.get(key) === "on";
}

// Nama field seperti label di form admin; batas panjangnya mengikuti announcementSchema.
const ANNOUNCEMENT_FIELDS: FieldLabels = {
  fields: {
    title: "Title",
    content: "Content",
    audience: "Audience"
  }
};

const ROLE_FIELDS: FieldLabels = { fields: { role: "Role" } };

function actionError(error: unknown, labels: FieldLabels = ANNOUNCEMENT_FIELDS): AdminActionState {
  if (error instanceof ZodError) {
    return {
      tone: "error",
      message: zodErrorMessage(error, labels)
    };
  }

  return {
    tone: "error",
    message: userMessage(error, "Couldn't complete that action.")
  };
}

export async function updateUserRoleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const profile = await requireRole(["ADMIN"]);
    const userId = fieldValue(formData, "userId");
    const role = fieldValue(formData, "role");

    if (profile.id === userId && role !== "ADMIN") {
      return {
        tone: "error",
        message: "You can't remove the admin role from your own account here."
      };
    }

    await updateUserRole({ userId, role });
    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      tone: "success",
      message: "User role updated."
    };
  } catch (error) {
    return actionError(error, ROLE_FIELDS);
  }
}

export async function createAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const profile = await requireRole(["ADMIN"]);

    await createAnnouncement(profile.id, {
      title: fieldValue(formData, "title"),
      content: fieldValue(formData, "content"),
      audience: fieldValue(formData, "audience"),
      isPublished: boolValue(formData, "isPublished")
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");

    return {
      tone: "success",
      message: "Announcement created."
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireRole(["ADMIN"]);

    await updateAnnouncement({
      announcementId: fieldValue(formData, "announcementId"),
      title: fieldValue(formData, "title"),
      content: fieldValue(formData, "content"),
      audience: fieldValue(formData, "audience"),
      isPublished: boolValue(formData, "isPublished")
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");

    return {
      tone: "success",
      message: "Announcement updated."
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireRole(["ADMIN"]);

    await publishAnnouncement(fieldValue(formData, "announcementId"), boolValue(formData, "isPublished"));

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");

    return {
      tone: "success",
      message: "Announcement publish status updated."
    };
  } catch (error) {
    return actionError(error);
  }
}
