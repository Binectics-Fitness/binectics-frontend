import { UserRole } from "@/lib/types";

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

  // Reviews
  if (url.startsWith("/dashboard/reviews")) {
    if (prefix) return url.replace("/dashboard/reviews", `${prefix}/reviews`);
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
