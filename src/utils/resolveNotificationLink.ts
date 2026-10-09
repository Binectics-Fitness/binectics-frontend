import { UserRole } from "@/lib/types";
import { legacyLinkTarget } from "@/lib/routing/legacyLinks";
import { billingNotificationTarget } from "@/lib/billing/autoRenew";

/**
 * Where tapping a notification goes. Billing notices are routed by TYPE
 * (the member's go to Billing, a provider's final payment failure to their
 * members), whatever action URL they carry; everything else resolves its
 * action URL below.
 */
export function resolveNotificationTarget(
  item: {
    type?: string | null;
    metadata?: Record<string, unknown> | null;
    actionUrl?: string;
  },
  userRole?: UserRole,
): string {
  return (
    billingNotificationTarget(item, userRole) ??
    resolveNotificationLink(item.actionUrl, userRole)
  );
}

/**
 * Resolves the backend-generated notification action URL into a
 * route that actually exists in the frontend, accounting for the
 * logged-in user's role (many dashboard pages are role-scoped).
 */
export function resolveNotificationLink(
  actionUrl?: string,
  userRole?: UserRole,
): string {
  if (!actionUrl) return "/dashboard/notifications";

  // Strip any leading / trailing whitespace
  const url = actionUrl.trim();

  // Addresses no page answers: the same role-aware table the middleware
  // uses for emailed links, so a tap goes straight to the right page.
  const [path, query = ""] = url.split("?");
  const target = legacyLinkTarget(path, query ? `?${query}` : "", userRole);
  if (target) return target;

  // ── Role-scoped route prefix ──────────────────────────────
  const rolePrefix: Record<string, string> = {
    [UserRole.TRAINER]: "/dashboard/trainer",
    [UserRole.DIETITIAN]: "/dashboard/dietitian",
    [UserRole.GYM_OWNER]: "/dashboard/gym-owner",
  };
  const prefix = userRole ? rolePrefix[userRole] : undefined;

  // ── Generic → role-specific remaps ────────────────────────
  // The backend generates generic URLs like /dashboard/consultations
  // but the frontend has role-specific routes.

  // Consultations
  if (url.startsWith("/dashboard/consultations")) {
    if (prefix)
      return url.replace("/dashboard/consultations", `${prefix}/consultations`);
    // Members: no /dashboard/bookings/consultations page exists — the
    // bookings page shows consultations inline.
    return "/dashboard/bookings";
  }

  // Clients
  if (url.startsWith("/dashboard/clients")) {
    if (prefix) return url.replace("/dashboard/clients", `${prefix}/clients`);
  }

  // Reviews: only the gym-owner shell has a reviews page. Trainer/
  // dietitian prefixes and the bare member URL all 404, so fall back to
  // the notifications list for everyone else.
  if (url.startsWith("/dashboard/reviews")) {
    if (userRole === UserRole.GYM_OWNER) {
      return url.replace("/dashboard/reviews", "/dashboard/gym-owner/reviews");
    }
    return "/dashboard/notifications";
  }

  // ── Path corrections (backend typos / mismatches) ─────────

  // Workout notifications: there is no /dashboard/workouts route at all —
  // the member's workout content lives at the workout log.
  if (url.startsWith("/dashboard/workout")) {
    return "/dashboard/member/workout-log";
  }

  // /dashboard/teams → /dashboard/team  (singular)
  if (url.startsWith("/dashboard/teams/")) {
    // No /dashboard/team/[id] page exists — the team page reads the active
    // workspace from context, so drop the id.
    return "/dashboard/team";
  }
  if (url.startsWith("/dashboard/teams")) {
    return url.replace("/dashboard/teams", "/dashboard/team");
  }

  // /dashboard/verification → /verification
  if (url === "/dashboard/verification") {
    return "/verification";
  }

  // /dashboard/professionals → no equivalent page; /dashboard itself has no
  // index page either, so fall back to the notifications list.
  if (url.startsWith("/dashboard/professionals")) {
    return "/dashboard/notifications";
  }

  return url;
}
