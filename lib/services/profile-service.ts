import "server-only";

import { prisma } from "@/lib/db/prisma";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validation/auth";

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { id: userId }
  });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data = updateProfileSchema.parse(input);

  return prisma.profile.update({
    where: { id: userId },
    data
  });
}

export async function getUserRole(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  return profile?.role ?? null;
}
