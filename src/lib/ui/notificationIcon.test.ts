import { describe, expect, it } from "vitest";
import { notificationIcon, notificationTone } from "./notificationIcon";

describe("notificationIcon", () => {
  it("keys on the type before the category, so care notifications are not messages", () => {
    expect(notificationIcon({ type: "DIET_PLAN_ASSIGNED", category: "mention" })).toEqual({ icon: "meal", tone: "dietitian" });
    expect(notificationIcon({ type: "WORKOUT_PLAN_ASSIGNED", category: "mention" })).toEqual({ icon: "workout", tone: "trainer" });
    expect(notificationIcon({ type: "PROGRAM_ASSIGNED", category: "mention" })).toEqual({ icon: "program", tone: "neutral" });
  });

  it("tones by meaning: confirmed is success, waiting on you is warn, refused is danger", () => {
    expect(notificationTone({ type: "BOOKING_CONFIRMED" })).toBe("success");
    expect(notificationTone({ type: "PAYMENT_RECEIVED" })).toBe("success");
    expect(notificationTone({ type: "SUBSCRIPTION_EXPIRING" })).toBe("warn");
    expect(notificationTone({ type: "MARKETPLACE_REQUEST_RECEIVED" })).toBe("warn");
    expect(notificationTone({ type: "TEAM_INVITATION" })).toBe("warn");
    expect(notificationTone({ type: "MARKETPLACE_REQUEST_REJECTED" })).toBe("danger");
    expect(notificationTone({ type: "VERIFICATION_REJECTED" })).toBe("danger");
    expect(notificationTone({ type: "ACCOUNT_SUSPENDED" })).toBe("danger");
  });

  it("keeps cancellations and expiries neutral", () => {
    expect(notificationTone({ type: "BOOKING_CANCELLED" })).toBe("neutral");
    expect(notificationTone({ type: "SUBSCRIPTION_EXPIRED" })).toBe("neutral");
  });

  it("falls back to the type's wording, then the category, then a bell", () => {
    expect(notificationIcon({ type: "NEW_MESSAGE" })).toEqual({ icon: "message", tone: "neutral" });
    expect(notificationIcon({ type: "GYM_CHECK_IN" })).toEqual({ icon: "checkin", tone: "gym" });
    expect(notificationIcon({ type: "SOMETHING_NEW", category: "payment" })).toEqual({ icon: "payment", tone: "neutral" });
    expect(notificationIcon({ type: null, category: null })).toEqual({ icon: "bell", tone: "neutral" });
  });
});

describe("nudges and milestones", () => {
  it("match the mobile table", () => {
    expect(notificationIcon({ type: "STREAK_MILESTONE", category: "mention" })).toEqual({ icon: "checkin", tone: "gym" });
    expect(notificationIcon({ type: "INACTIVITY_NUDGE", category: "mention" })).toEqual({ icon: "checkin", tone: "neutral" });
    expect(notificationIcon({ type: "PROGRAM_HALFWAY" })).toEqual({ icon: "program", tone: "neutral" });
    expect(notificationIcon({ type: "PROGRAM_COMPLETED" })).toEqual({ icon: "program", tone: "success" });
  });
});
