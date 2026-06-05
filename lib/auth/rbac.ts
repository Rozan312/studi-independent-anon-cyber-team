export type AppRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const roleRank: Record<AppRole, number> = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3
};

export function hasRoleAccess(actualRole: AppRole, requiredRoles: AppRole[]) {
  if (actualRole === "ADMIN") return true;
  return requiredRoles.some((role) => roleRank[actualRole] >= roleRank[role]);
}

export function getRequiredRolesForPath(pathname: string): AppRole[] | null {
  if (pathname.startsWith("/admin")) return ["ADMIN"];
  if (pathname.startsWith("/instructor")) return ["INSTRUCTOR"];

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/learning-paths") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/leaderboard")
  ) {
    return ["STUDENT"];
  }

  return null;
}

export function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}
