import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — protects all /admin routes except /admin/login.
 * Uses the same `ca_session` cookie as the rest of the app.
 * 
 * NOTE: Full admin verification (isAdmin check) happens in the API routes
 * via requireAdminSession(). Middleware here only does the fast cookie-presence
 * check to redirect unauthenticated users early (Edge-compatible, no DB call).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Always pass pathname as a header so layouts can read it server-side
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // /admin/login is always accessible
  if (pathname === "/admin/login") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check for session cookie presence (full validation happens in API routes)
  const session = request.cookies.get("ca_session");
  if (!session?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
