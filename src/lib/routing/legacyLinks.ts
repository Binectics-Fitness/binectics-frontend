/**
 * Addresses the API hands out (notification links, email buttons, stored
 * notifications) that no page answers, mapped to the page that does for the
 * signed-in role. One table for the middleware (so emailed and bookmarked
 * links land somewhere) and the in-app notification resolver.
 *
 * Roles are the user_role cookie values: USER, TRAINER, DIETITIAN,
 * GYM_OWNER, ADMIN. Anything unknown is treated as a member.
 */
type Role = "USER" | "TRAINER" | "DIETITIAN" | "GYM_OWNER" | "ADMIN";

type ByRole = Partial<Record<Role, string>> & { USER: string };

function pick(map: ByRole, role: string | null | undefined): string {
  return map[(role ?? "") as Role] ?? map.USER;
}

const PROVIDER_CLIENTS: ByRole = {
  USER: "/dashboard/member/requests",
  TRAINER: "/dashboard/trainer/clients",
  DIETITIAN: "/dashboard/dietitian/clients",
  GYM_OWNER: "/dashboard/gym-owner/members",
  ADMIN: "/admin/dashboard",
};

/**
 * Where a legacy address goes for this role, or null when the address is
 * not one of them (a real page). Query strings are dropped: the pages they
 * pointed at never existed, so their parameters mean nothing to the page
 * that answers now, except a client profile id, which opens that client.
 */
export function legacyLinkTarget(
  pathname: string,
  search: string,
  role: string | null | undefined,
): string | null {
  const params = new URLSearchParams(search);
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/dashboard/subscriptions") {
    return pick({ ...PROVIDER_CLIENTS, USER: "/dashboard/member/billing" }, role);
  }
  if (path === "/dashboard/settings/billing") {
    return pick(
      {
        USER: "/dashboard/member/billing",
        TRAINER: "/dashboard/trainer/earnings",
        DIETITIAN: "/dashboard/dietitian/earnings",
        GYM_OWNER: "/dashboard/gym-owner/revenue",
        ADMIN: "/admin/dashboard",
      },
      role,
    );
  }
  if (path === "/dashboard/consultations") {
    return pick(
      {
        USER: "/dashboard/bookings",
        TRAINER: "/dashboard/trainer/sessions",
        DIETITIAN: "/dashboard/dietitian/consultations",
        GYM_OWNER: "/dashboard/gym-owner/schedule",
        ADMIN: "/admin/dashboard",
      },
      role,
    );
  }
  if (path === "/dashboard/clients") {
    const profileId = params.get("profileId");
    if (profileId && /^[a-f0-9]{24}$/i.test(profileId)) {
      if (role === "TRAINER") return `/dashboard/trainer/clients/${profileId}`;
      if (role === "DIETITIAN") return `/dashboard/dietitian/clients/${profileId}`;
    }
    return pick(PROVIDER_CLIENTS, role);
  }
  if (path === "/dashboard/professionals") return pick(PROVIDER_CLIENTS, role);
  if (path === "/dashboard/marketplace") {
    return pick(
      {
        USER: "/dashboard/member",
        TRAINER: "/dashboard/marketplace/requests",
        DIETITIAN: "/dashboard/marketplace/requests",
        GYM_OWNER: "/dashboard/marketplace/requests",
        ADMIN: "/admin/dashboard",
      },
      role,
    );
  }
  if (path === "/dashboard/calendar") {
    // A removed page that showed an invented calendar; each role's real
    // schedule instead.
    return pick(
      {
        USER: "/dashboard/bookings",
        TRAINER: "/dashboard/trainer/sessions",
        DIETITIAN: "/dashboard/dietitian/calendar",
        GYM_OWNER: "/dashboard/gym-owner/schedule",
        ADMIN: "/admin/dashboard",
      },
      role,
    );
  }
  if (path === "/dashboard/reviews") {
    return pick(
      {
        // Only the gym dashboard has a reviews page.
        USER: "/dashboard/notifications",
        GYM_OWNER: "/dashboard/gym-owner/reviews",
      },
      role,
    );
  }
  const nutrition = /^\/dashboard\/nutrition(?:\/([^/]+))?$/.exec(path);
  if (nutrition) {
    return nutrition[1] ? `/dashboard/member/meal-plans/${nutrition[1]}` : "/dashboard/member/meal-plans";
  }
  if (/^\/dashboard\/workouts(?:\/[^/]+)?$/.test(path)) return "/dashboard/member/workout-log";
  if (path === "/dashboard/progress") return "/dashboard/member";
  if (/^\/dashboard\/my-programs(?:\/[^/]+)?$/.test(path)) return "/dashboard/member";
  if (/^\/dashboard\/team\/[^/]+$/.test(path)) return "/dashboard/team";
  if (path === "/search") return "/marketplace";
  return null;
}
