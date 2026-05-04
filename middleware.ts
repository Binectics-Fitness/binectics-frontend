import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/admin/",
  "/forms",
  "/check-in",
  "/checkout",
  "/teams",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const mustChangePassword =
    request.cookies.get("must_change_password")?.value === "1";

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force users with temporary credentials onto /admin/change-password
  // before any other authenticated route resolves. Allowed escapes:
  // /admin/change-password itself and the auth surface (handled below).
  if (
    token &&
    mustChangePassword &&
    isProtectedRoute &&
    pathname !== "/admin/change-password"
  ) {
    return NextResponse.redirect(
      new URL("/admin/change-password", request.url),
    );
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token) {
    if (mustChangePassword) {
      return NextResponse.redirect(
        new URL("/admin/change-password", request.url),
      );
    }
    const roleMapping: Record<string, string> = {
      USER: "/dashboard",
      GYM_OWNER: "/dashboard/gym-owner",
      TRAINER: "/dashboard/trainer",
      DIETITIAN: "/dashboard/dietitian",
      ADMIN: "/admin/dashboard",
    };
    const role = request.cookies.get("user_role")?.value ?? "";
    const dashboardPath = roleMapping[role] || "/dashboard";
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
