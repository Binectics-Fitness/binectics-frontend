import { describe, it, expect } from "vitest";
import { legacyLinkTarget } from "@/lib/routing/legacyLinks";

const id = "6abe5a17882f018fcdb21c61";

describe("legacyLinkTarget", () => {
  it("sends a member to Billing after paying for a plan (the checkout and notification link)", () => {
    expect(legacyLinkTarget("/dashboard/subscriptions", "?id=s1", "USER")).toBe("/dashboard/member/billing");
    expect(legacyLinkTarget("/dashboard/subscriptions", "", undefined)).toBe("/dashboard/member/billing");
    expect(legacyLinkTarget("/dashboard/subscriptions", "", "GYM_OWNER")).toBe("/dashboard/gym-owner/members");
  });

  it.each([
    ["/dashboard/settings/billing", "USER", "/dashboard/member/billing"],
    ["/dashboard/settings/billing", "TRAINER", "/dashboard/trainer/earnings"],
    ["/dashboard/settings/billing", "GYM_OWNER", "/dashboard/gym-owner/revenue"],
    ["/dashboard/consultations", "USER", "/dashboard/bookings"],
    ["/dashboard/consultations", "TRAINER", "/dashboard/trainer/sessions"],
    ["/dashboard/consultations", "DIETITIAN", "/dashboard/dietitian/consultations"],
    ["/dashboard/clients", "USER", "/dashboard/member/requests"],
    ["/dashboard/clients", "DIETITIAN", "/dashboard/dietitian/clients"],
    ["/dashboard/professionals", "USER", "/dashboard/member/requests"],
    ["/dashboard/marketplace", "TRAINER", "/dashboard/marketplace/requests"],
    ["/dashboard/reviews", "GYM_OWNER", "/dashboard/gym-owner/reviews"],
    ["/dashboard/reviews", "USER", "/dashboard/notifications"],
    ["/dashboard/workouts/abc", "USER", "/dashboard/member/workout-log"],
    ["/dashboard/my-programs/abc", "USER", "/dashboard/member"],
    ["/dashboard/progress", "USER", "/dashboard/member"],
    ["/dashboard/team/abc", "GYM_OWNER", "/dashboard/team"],
    ["/search", "USER", "/marketplace"],
  ])("%s for %s goes to %s", (path, role, target) => {
    expect(legacyLinkTarget(path, "", role)).toBe(target);
  });

  it("opens the client a progress email names, for their trainer or dietitian", () => {
    expect(legacyLinkTarget("/dashboard/clients", `?profileId=${id}`, "TRAINER")).toBe(`/dashboard/trainer/clients/${id}`);
    expect(legacyLinkTarget("/dashboard/clients", `?profileId=${id}`, "DIETITIAN")).toBe(`/dashboard/dietitian/clients/${id}`);
    expect(legacyLinkTarget("/dashboard/clients", "?profileId=not-an-id", "TRAINER")).toBe("/dashboard/trainer/clients");
  });

  it("opens the meal plan a notification names", () => {
    expect(legacyLinkTarget(`/dashboard/nutrition/${id}`, "", "USER")).toBe(`/dashboard/member/meal-plans/${id}`);
    expect(legacyLinkTarget("/dashboard/nutrition", "", "USER")).toBe("/dashboard/member/meal-plans");
  });

  it("leaves real pages alone", () => {
    for (const p of ["/dashboard/member/billing", "/dashboard/team", "/dashboard/marketplace/requests", "/marketplace"]) {
      expect(legacyLinkTarget(p, "", "USER")).toBeNull();
    }
  });
});
