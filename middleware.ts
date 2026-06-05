import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getRequiredRolesForPath, hasRoleAccess, isAuthPage, type AppRole } from "@/lib/auth/rbac";
import { decodeLocalSession, isLocalAuthEnabled, LOCAL_SESSION_COOKIE } from "@/lib/auth/local-session-core";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const pathname = request.nextUrl.pathname;
  const requiredRoles = getRequiredRolesForPath(pathname);

  if (isLocalAuthEnabled()) {
    const localSession = decodeLocalSession(request.cookies.get(LOCAL_SESSION_COOKIE)?.value);

    if (localSession && isAuthPage(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!requiredRoles) {
      return response;
    }

    if (!localSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasRoleAccess(localSession.role, requiredRoles)) {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
    }

    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!requiredRoles) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase.from("Profile").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role as AppRole | undefined;

  if (!role || !hasRoleAccess(role, requiredRoles)) {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/learning-paths/:path*",
    "/rooms/:path*",
    "/progress/:path*",
    "/leaderboard/:path*",
    "/instructor/:path*",
    "/admin/:path*"
  ]
};
