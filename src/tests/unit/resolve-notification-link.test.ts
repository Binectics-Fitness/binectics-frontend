import { describe, it, expect } from "vitest";
import { resolveNotificationLink } from "@/utils/resolveNotificationLink";
import { UserRole } from "@/lib/types";

describe("resolveNotificationLink", () => {
  it("returns /dashboard/notifications for empty actionUrl", () => {
    expect(resolveNotificationLink()).toBe("/dashboard/notifications");
    expect(resolveNotificationLink("")).toBe("/dashboard/notifications");
    expect(resolveNotificationLink(undefined)).toBe("/dashboard/notifications");
  });

  // ── Role-specific consultations ───────────────────────────
  it("routes /dashboard/consultations to trainer consultations", () => {
    expect(
      resolveNotificationLink("/dashboard/consultations", UserRole.TRAINER),
    ).toBe("/dashboard/trainer/consultations");
  });

  it("routes /dashboard/consultations to dietitian consultations", () => {
    expect(
      resolveNotificationLink("/dashboard/consultations", UserRole.DIETITIAN),
    ).toBe("/dashboard/dietitian/consultations");
  });

  it("routes /dashboard/consultations to gym-owner consultations", () => {
    expect(
      resolveNotificationLink("/dashboard/consultations", UserRole.GYM_OWNER),
    ).toBe("/dashboard/gym-owner/consultations");
  });

  it("routes /dashboard/consultations to the bookings page for USER role", () => {
    // /dashboard/bookings/consultations does not exist; the bookings page
    // shows consultations inline.
    expect(
      resolveNotificationLink("/dashboard/consultations/c1", UserRole.USER),
    ).toBe("/dashboard/bookings");
  });

  it("preserves query params on consultations remap", () => {
    expect(
      resolveNotificationLink(
        "/dashboard/consultations?bookingId=abc",
        UserRole.TRAINER,
      ),
    ).toBe("/dashboard/trainer/consultations?bookingId=abc");
  });

  // ── Role-specific clients ─────────────────────────────────
  it("routes /dashboard/clients to trainer clients", () => {
    expect(
      resolveNotificationLink("/dashboard/clients", UserRole.TRAINER),
    ).toBe("/dashboard/trainer/clients");
  });

  it("routes /dashboard/clients to dietitian clients", () => {
    expect(
      resolveNotificationLink(
        "/dashboard/clients?clientId=xyz",
        UserRole.DIETITIAN,
      ),
    ).toBe("/dashboard/dietitian/clients?clientId=xyz");
  });

  // ── Role-specific reviews ─────────────────────────────────
  it("routes review links to the gym-owner reviews page, and to notifications for roles without one", () => {
    expect(
      resolveNotificationLink("/dashboard/reviews?id=r1", UserRole.GYM_OWNER),
    ).toBe("/dashboard/gym-owner/reviews?id=r1");
    // /dashboard/trainer/reviews and /dashboard/dietitian/reviews do not
    // exist; neither does a bare member reviews page.
    expect(
      resolveNotificationLink("/dashboard/reviews", UserRole.TRAINER),
    ).toBe("/dashboard/notifications");
    expect(resolveNotificationLink("/dashboard/reviews", UserRole.USER)).toBe(
      "/dashboard/notifications",
    );
  });

  it("routes /dashboard/reviews to gym-owner reviews", () => {
    expect(
      resolveNotificationLink("/dashboard/reviews", UserRole.GYM_OWNER),
    ).toBe("/dashboard/gym-owner/reviews");
  });

  // ── Path corrections ──────────────────────────────────────
  it("routes workout links to the member workout log (no /dashboard/workouts route exists)", () => {
    expect(resolveNotificationLink("/dashboard/workout/w1")).toBe(
      "/dashboard/member/workout-log",
    );
  });

  it("routes the bare workout link to the member workout log", () => {
    expect(resolveNotificationLink("/dashboard/workout")).toBe(
      "/dashboard/member/workout-log",
    );
  });

  it("corrects /dashboard/teams to /dashboard/team", () => {
    expect(resolveNotificationLink("/dashboard/teams?teamId=t1")).toBe(
      "/dashboard/team?teamId=t1",
    );
  });

  it("drops the id from /dashboard/teams/<id> (no dynamic team page; context provides the org)", () => {
    expect(resolveNotificationLink("/dashboard/teams/org1")).toBe(
      "/dashboard/team",
    );
  });

  it("leaves /dashboard/billing as-is (it's the real, current billing page)", () => {
    expect(resolveNotificationLink("/dashboard/billing?paymentId=p1")).toBe(
      "/dashboard/billing?paymentId=p1",
    );
  });

  it("corrects /dashboard/verification to /verification", () => {
    expect(resolveNotificationLink("/dashboard/verification")).toBe(
      "/verification",
    );
  });

  it("routes /dashboard/professionals to notifications (no /dashboard index page)", () => {
    expect(resolveNotificationLink("/dashboard/professionals")).toBe(
      "/dashboard/notifications",
    );
  });

  // ── Routes that already work (passthrough) ────────────────
  it("passes through already-correct URLs", () => {
    expect(
      resolveNotificationLink("/dashboard/dietitian/clients?profileId=abc"),
    ).toBe("/dashboard/dietitian/clients?profileId=abc");

    expect(resolveNotificationLink("/dashboard/nutrition/plan1")).toBe(
      "/dashboard/nutrition/plan1",
    );

    expect(resolveNotificationLink("/dashboard/subscriptions?id=s1")).toBe(
      "/dashboard/subscriptions?id=s1",
    );

    expect(resolveNotificationLink("/dashboard/settings")).toBe(
      "/dashboard/settings",
    );

    expect(resolveNotificationLink("/dashboard/notifications")).toBe(
      "/dashboard/notifications",
    );
  });
});
