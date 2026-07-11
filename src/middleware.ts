import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  REGION_COOKIE,
  REGION_OVERRIDE_COOKIE,
  COUNTRY_TO_REGION,
} from "@/lib/constants/regions";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/member",
  "/admin",
  // "/forms" is deliberately public: /forms/[formId] is the shareable fill
  // page (anonymous submissions are a backend feature; forms that require
  // authentication enforce it in-page and at the API).
  "/check-in",
  "/checkout",
  "/teams",
  "/onboarding",
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

function detectCountry(request: NextRequest): string {
  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel && vercel !== "XX") return vercel.toUpperCase();
  const netlify = request.headers.get("x-country");
  if (netlify && netlify !== "XX") return netlify.toUpperCase();
  const cf = request.headers.get("cf-ipcountry");
  if (cf && cf !== "XX" && cf !== "T1") return cf.toUpperCase();

  const acceptLanguage = request.headers.get("accept-language") || "";
  const primary = acceptLanguage.split(",")[0]?.trim();
  if (primary) {
    const region = primary.split("-")[1]?.toUpperCase();
    if (region && region.length === 2) return region;

    const language = primary.split("-")[0]?.toLowerCase();
    const languageFallback: Record<string, string> = {
      en: "US",
      de: "DE",
      fr: "FR",
      it: "IT",
      es: "ES",
      nl: "NL",
      pt: "PT",
      el: "GR",
      fi: "FI",
      sk: "SK",
      sl: "SI",
      lt: "LT",
      lv: "LV",
      et: "EE",
      mt: "MT",
      hr: "HR",
      lb: "LU",
    };
    if (language && languageFallback[language]) {
      return languageFallback[language];
    }
  }

  return "US";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const mustChangePassword =
    request.cookies.get("must_change_password")?.value === "1";

  // ── Region detection (runs in all modes) ──
  // The override cookie is client-controlled, so only honour it when it names a
  // region we actually support — otherwise fall back to geo detection rather
  // than persisting an arbitrary value into the region cookie.
  const override = request.cookies.get(REGION_OVERRIDE_COOKIE)?.value?.toUpperCase();
  const validOverride = override && override in COUNTRY_TO_REGION ? override : undefined;
  const country = validOverride || detectCountry(request);
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

  // If user is on /onboarding but already completed it, redirect to dashboard
  if (token && pathname.startsWith("/onboarding")) {
    const onboardingDone = request.cookies.get("onboarding_complete")?.value === "1";
    if (onboardingDone) {
      const role = request.cookies.get("user_role")?.value ?? "";
      const dashMap: Record<string, string> = { USER: "/dashboard/member", GYM_OWNER: "/dashboard/gym-owner", TRAINER: "/dashboard/trainer", DIETITIAN: "/dashboard/dietitian", ADMIN: "/admin/dashboard" };
      return withRegion(NextResponse.redirect(new URL(dashMap[role] || "/dashboard/member", request.url)));
    }
  }

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

  // Never redirect PREFETCH requests away from auth routes. Mobile
  // browsers prefetch visible "Log in" links; with a session cookie
  // present the 307 got cached by the client router, and tapping the
  // link then rendered a blank page instead of the dashboard. Real
  // navigations (no prefetch header) still redirect below.
  const isPrefetch =
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") ?? "").includes("prefetch");

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token && !isPrefetch) {
    if (mustChangePassword) {
      return withRegion(
        NextResponse.redirect(new URL("/admin/change-password", request.url)),
      );
    }
    const role = request.cookies.get("user_role")?.value ?? "";
    const roleMapping: Record<string, string> = {
      USER: "/dashboard/member",
      GYM_OWNER: "/dashboard/gym-owner",
      TRAINER: "/dashboard/trainer",
      DIETITIAN: "/dashboard/dietitian",
      ADMIN: "/admin/dashboard",
    };
    const dashboardPath = roleMapping[role] || "/dashboard/member";
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
