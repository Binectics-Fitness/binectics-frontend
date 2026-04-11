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

  it("routes /dashboard/consultations to bookings for USER role", () => {
    expect(
      resolveNotificationLink("/dashboard/consultations", UserRole.USER),
    ).toBe("/dashboard/bookings/consultations");
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
  it("routes /dashboard/reviews to trainer reviews", () => {
    expect(
      resolveNotificationLink("/dashboard/reviews", UserRole.TRAINER),
    ).toBe("/dashboard/trainer/reviews");
  });

  it("routes /dashboard/reviews to gym-owner reviews", () => {
    expect(
      resolveNotificationLink("/dashboard/reviews", UserRole.GYM_OWNER),
    ).toBe("/dashboard/gym-owner/reviews");
  });

  // ── Path corrections ──────────────────────────────────────
  it("corrects /dashboard/workout/<id> to /dashboard/workouts/<id>", () => {
    expect(resolveNotificationLink("/dashboard/workout/plan123")).toBe(
      "/dashboard/workouts/plan123",
    );
  });

  it("corrects /dashboard/workout to /dashboard/workouts", () => {
    expect(resolveNotificationLink("/dashboard/workout")).toBe(
      "/dashboard/workouts",
    );
  });

  it("corrects /dashboard/teams to /dashboard/team", () => {
    expect(resolveNotificationLink("/dashboard/teams?teamId=t1")).toBe(
      "/dashboard/team?teamId=t1",
    );
  });

  it("corrects /dashboard/teams/<id> to /dashboard/team/<id>", () => {
    expect(resolveNotificationLink("/dashboard/teams/org1")).toBe(
      "/dashboard/team/org1",
    );
  });

  it("corrects /dashboard/billing to /dashboard/settings/billing", () => {
    expect(resolveNotificationLink("/dashboard/billing?paymentId=p1")).toBe(
      "/dashboard/settings/billing?paymentId=p1",
    );
  });

  it("corrects /dashboard/verification to /verification", () => {
    expect(resolveNotificationLink("/dashboard/verification")).toBe(
      "/verification",
    );
  });

  it("routes /dashboard/professionals to /dashboard", () => {
    expect(resolveNotificationLink("/dashboard/professionals")).toBe(
      "/dashboard",
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
