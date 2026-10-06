import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  REGION_COOKIE,
  REGION_OVERRIDE_COOKIE,
} from "@/lib/constants/regions";
import { legacyLinkTarget } from "@/lib/routing/legacyLinks";
import { isCanonicalHost } from "@/lib/site-url";
import { isPrivatePath } from "@/lib/routing/indexing";

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

function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") ?? "").includes("prefetch")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const mustChangePassword =
    request.cookies.get("must_change_password")?.value === "1";

  // ── Region detection (runs in all modes) ──
  // The visitor's country, for display only: which currency marketing
  // amounts show in is decided client-side against the API's currency list,
  // never here. The override cookie is client-controlled, so only honour a
  // well-formed country code rather than persisting an arbitrary value.
  const override = request.cookies.get(REGION_OVERRIDE_COOKIE)?.value?.toUpperCase();
  const validOverride = override && /^[A-Z]{2}$/.test(override) ? override : undefined;
  const country = validOverride || detectCountry(request);
  const currentRegion = request.cookies.get(REGION_COOKIE)?.value;

  const needsRegionCookie = currentRegion !== country;
  // The app also answers on copies of itself (vercel.app, Netlify branch and
  // preview aliases, azurewebsites.net). Keep them reachable for QA but out
  // of search indexes. A header, not robots.txt: a crawler robots.txt turns
  // away never sees the noindex, and robots.txt is built once for all hosts.
  // Sign-in, checkout, check-in and similar routes stay out of search on
  // every host.
  const indexable =
    isCanonicalHost(request.headers.get("host")) && !isPrivatePath(pathname);
  function withSiteHeaders(res: NextResponse): NextResponse {
    if (!indexable) res.headers.set("X-Robots-Tag", "noindex, nofollow");
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
      return withSiteHeaders(NextResponse.redirect(new URL(dashMap[role] || "/dashboard/member", request.url)));
    }
  }

  // Addresses the API hands out that no page answers (notification links,
  // email buttons, the post-checkout button): send them to the page that
  // does for this role. Signed-out visitors log in first and come back here.
  if (token && !isPrefetchRequest(request)) {
    const target = legacyLinkTarget(pathname, request.nextUrl.search, request.cookies.get("user_role")?.value);
    if (target) return withSiteHeaders(NextResponse.redirect(new URL(target, request.url)));
  }
  if (!token && pathname === "/search") {
    return withSiteHeaders(NextResponse.redirect(new URL("/marketplace", request.url)));
  }

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Never cache a redirect into the client router's prefetch cache — on
  // both sides. Mobile browsers prefetch visible links; a prefetched 307
  // (auth route with a session, or protected route without one) gets
  // cached and the subsequent tap renders a blank page. Real navigations
  // (no prefetch header) still redirect below.
  const isPrefetch =
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch" ||
    (request.headers.get("sec-purpose") ?? "").includes("prefetch");

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token && !isPrefetch) {
    const loginUrl = new URL("/login", request.url);
    // Keep the query string: a scanned check-in URL carries its rotating
    // presence token in ?t= — dropping it here forced a second scan after
    // every first-time login.
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return withSiteHeaders(NextResponse.redirect(loginUrl));
  }

  // Force users with temporary credentials onto /admin/change-password
  if (
    token &&
    mustChangePassword &&
    isProtectedRoute &&
    pathname !== "/admin/change-password"
  ) {
    return withSiteHeaders(
      NextResponse.redirect(new URL("/admin/change-password", request.url)),
    );
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token && !isPrefetch) {
    if (mustChangePassword) {
      return withSiteHeaders(
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
    return withSiteHeaders(NextResponse.redirect(new URL(dashboardPath, request.url)));
  }

  return withSiteHeaders(NextResponse.next());
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
     * - .well-known (app-link verification files the phone OS fetches)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
