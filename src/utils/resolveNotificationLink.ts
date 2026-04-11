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
  let url = actionUrl.trim();

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
    return url.replace(
      "/dashboard/consultations",
      "/dashboard/bookings/consultations",
    );
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

  // /dashboard/workout/<id> → /dashboard/workouts/<id>  (plural)
  if (url.startsWith("/dashboard/workout/")) {
    return url.replace("/dashboard/workout/", "/dashboard/workouts/");
  }
  if (url === "/dashboard/workout") {
    return "/dashboard/workouts";
  }

  // /dashboard/teams → /dashboard/team  (singular)
  if (url.startsWith("/dashboard/teams/")) {
    // /dashboard/teams/<teamId> → /dashboard/team/<orgId>
    return url.replace("/dashboard/teams/", "/dashboard/team/");
  }
  if (url.startsWith("/dashboard/teams")) {
    return url.replace("/dashboard/teams", "/dashboard/team");
  }

  // /dashboard/billing → /dashboard/settings/billing
  if (url.startsWith("/dashboard/billing")) {
    return url.replace("/dashboard/billing", "/dashboard/settings/billing");
  }

  // /dashboard/verification → /verification
  if (url === "/dashboard/verification") {
    return "/verification";
  }

  // /dashboard/professionals → just go to dashboard (no equivalent page yet)
  if (url.startsWith("/dashboard/professionals")) {
    return "/dashboard";
  }

  return url;
}
