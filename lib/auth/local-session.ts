import "server-only";

import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  decodeLocalSession,
  encodeLocalSession,
  isLocalAuthEnabled,
  localEmailFromUsername,
  normalizeLocalUsername,
  LOCAL_SESSION_COOKIE,
  type LocalSession
} from "@/lib/auth/local-session-core";
import type { AppRole } from "@/lib/auth/rbac";

function usernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base.length >= 3 ? base.slice(0, 28) : `user-${base || "local"}`;
}

async function getAvailableUsername(preferred: string, profileId?: string) {
  const base = normalizeLocalUsername(preferred);

  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index}`;
    const existing = await prisma.profile.findUnique({
      where: { username: candidate },
      select: { id: true }
    });

    if (!existing || existing.id === profileId) return candidate;
  }

  return `${base}-${randomUUID().slice(0, 8)}`;
}

function setLocalSessionCookie(session: LocalSession) {
  cookies().set({
    name: LOCAL_SESSION_COOKIE,
    value: encodeLocalSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function getLocalSessionFromCookies() {
  if (!isLocalAuthEnabled()) return null;
  return decodeLocalSession(cookies().get(LOCAL_SESSION_COOKIE)?.value);
}

export async function getLocalAuthUser() {
  const session = getLocalSessionFromCookies();
  if (!session) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: session.id }
  });

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email
  };
}

export async function createLocalSession(input: {
  email?: string;
  fullName?: string;
  username?: string;
}) {
  if (!isLocalAuthEnabled()) {
    throw new Error("Local auth is disabled.");
  }
  const preferredUsername = input.username || (input.email ? usernameFromEmail(input.email) : "local-user");
  const email = (input.email || localEmailFromUsername(preferredUsername)).toLowerCase();
  const existingProfile = await prisma.profile.findUnique({
    where: { email }
  });
  const role = existingProfile?.role ?? Role.STUDENT;

  const username = await getAvailableUsername(preferredUsername, existingProfile?.id);

  const profile = await prisma.profile.upsert({
    where: { email },
    update: {
      fullName: input.fullName || existingProfile?.fullName || "Local Developer",
      username,
      role
    },
    create: {
      id: randomUUID(),
      email,
      fullName: input.fullName || "Local Developer",
      username,
      role
    }
  });

  setLocalSessionCookie({
    id: profile.id,
    email: profile.email,
    role: profile.role as AppRole
  });

  return {
    id: profile.id,
    email: profile.email
  };
}

export function clearLocalSession() {
  cookies().set({
    name: LOCAL_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
