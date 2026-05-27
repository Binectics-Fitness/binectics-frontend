import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REGION_COOKIE, REGION_OVERRIDE_COOKIE } from "@/lib/constants/regions";

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

function detectCountry(request: NextRequest): string {
  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel && vercel !== "XX") return vercel.toUpperCase();
  const cf = request.headers.get("cf-ipcountry");
  if (cf && cf !== "XX" && cf !== "T1") return cf.toUpperCase();
  return "US";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const mustChangePassword =
    request.cookies.get("must_change_password")?.value === "1";

  // ── Region detection (runs in all modes) ──
  const override = request.cookies.get(REGION_OVERRIDE_COOKIE)?.value;
  const country = override || detectCountry(request);
  const currentRegion = request.cookies.get(REGION_COOKIE)?.value;

  const needsRegionCookie = currentRegion !== country;
  function withRegion(res: NextResponse): NextResponse {
    if (needsRegionCookie) {
      res.cookies.set(REGION_COOKIE, country, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }
    return res;
  }

  // ── PROTOTYPE MODE: bypass auth for visual showcase ──
  // TODO: Remove this block when wiring to real API
  const PROTOTYPE_MODE = true;
  if (PROTOTYPE_MODE) {
    return withRegion(NextResponse.next());
  }
  // ── END PROTOTYPE MODE ──

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
    return withRegion(NextResponse.redirect(loginUrl));
  }

  // Force users with temporary credentials onto /admin/change-password
  if (
    token &&
    mustChangePassword &&
    isProtectedRoute &&
    pathname !== "/admin/change-password"
  ) {
    return withRegion(
      NextResponse.redirect(new URL("/admin/change-password", request.url)),
    );
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token) {
    if (mustChangePassword) {
      return withRegion(
        NextResponse.redirect(new URL("/admin/change-password", request.url)),
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
    return withRegion(NextResponse.redirect(new URL(dashboardPath, request.url)));
  }

  return withRegion(NextResponse.next());
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
