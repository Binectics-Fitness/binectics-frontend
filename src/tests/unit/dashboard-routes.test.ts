import { describe, it, expect } from "vitest";
import { DASHBOARD_ROUTES, getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";

// Regression guard: DASHBOARD_ROUTES.USER once pointed at /member, a static
// pre-wiring prototype with hardcoded fake data — every fitness member's
// post-login/onboarding redirect landed there instead of the real,
// data-backed /dashboard/member.
describe("DASHBOARD_ROUTES", () => {
  it("routes every role under /dashboard, never at a bare top-level path", () => {
    for (const role of Object.values(UserRole)) {
      expect(DASHBOARD_ROUTES[role]).toMatch(/^\/(dashboard|admin)\//);
    }
  });

  it("sends fitness members to the real, wired dashboard", () => {
    expect(getDashboardRoute(UserRole.USER)).toBe("/dashboard/member");
  });
});
