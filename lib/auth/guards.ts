import "server-only";

import type { Profile, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRoleAccess, type AppRole } from "@/lib/auth/rbac";
import { getLocalAuthUser } from "@/lib/auth/local-session";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

export type AuthUser = {
  id: string;
  email?: string;
};

// Dibungkus cache() agar halaman, guard, dan AppShell berbagi satu pencarian user dan profil per request.
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (isLocalAuthEnabled()) {
    return getLocalAuthUser();
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.profile.findUnique({
    where: { id: user.id }
  });
});

export async function getUserRole(): Promise<Role | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  await requireAuth();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?error=missing-profile");
  }

  return profile;
}

export async function requireRole(requiredRoles: AppRole[]) {
  const profile = await requireProfile();

  if (!hasRoleAccess(profile.role, requiredRoles)) {
    redirect("/dashboard?error=forbidden");
  }

  return profile;
}
