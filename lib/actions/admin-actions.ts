"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createAnnouncement, publishAnnouncement, updateAnnouncement, updateUserRole } from "@/lib/services/admin-service";
import type { ActionMessageState } from "@/components/ui/action-message";

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

function actionError(error: unknown): AdminActionState {
  if (error instanceof ZodError) {
    return {
      tone: "error",
      message: error.issues[0]?.message ?? "Validasi gagal."
    };
  }

  return {
    tone: "error",
    message: error instanceof Error ? error.message : "Aksi gagal diproses."
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
        message: "Tidak bisa menurunkan role admin yang sedang login dari UI ini."
      };
    }

    await updateUserRole({ userId, role });
    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return {
      tone: "success",
      message: "Role user berhasil diperbarui."
    };
  } catch (error) {
    return actionError(error);
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
      message: "Announcement berhasil dibuat."
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
      message: "Announcement berhasil diperbarui."
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
      message: "Status publish announcement berhasil diperbarui."
    };
  } catch (error) {
    return actionError(error);
  }
}
