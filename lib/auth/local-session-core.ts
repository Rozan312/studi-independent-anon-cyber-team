import { hasRoleAccess, type AppRole } from "@/lib/auth/rbac";

export const LOCAL_SESSION_COOKIE = "si_act_local_session";

export type LocalSession = {
  id: string;
  email: string;
  role: AppRole;
};

export function isLocalAuthEnabled() {
  return process.env.AUTH_MODE === "local";
}

export function normalizeLocalUsername(username: string) {
  const normalized = username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);

  return normalized.length >= 3 ? normalized : "local-user";
}

export function localEmailFromUsername(username: string) {
  return `${normalizeLocalUsername(username)}@local.dev`;
}

export function encodeLocalSession(session: LocalSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeLocalSession(value: string | undefined): LocalSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<LocalSession>;

    if (!parsed.id || !parsed.email || !parsed.role) return null;
    if (!hasRoleAccess(parsed.role, ["STUDENT"])) return null;

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role
    };
  } catch {
    return null;
  }
}
