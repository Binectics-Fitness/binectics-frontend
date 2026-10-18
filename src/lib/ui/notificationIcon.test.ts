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

describe("a gym ending a connection", () => {
  it("is a client notice, not a message, though the API files it under mention", () => {
    expect(notificationIcon({ type: "CONNECTION_ENDED", category: "mention" })).toEqual({ icon: "client", tone: "neutral" });
  });
});

describe("refunds and disputes", () => {
  it("match the mobile table: issued is success, failed is danger, a new dispute waits on the provider", () => {
    expect(notificationIcon({ type: "REFUND_ISSUED", category: "payment" })).toEqual({ icon: "payment", tone: "success" });
    expect(notificationIcon({ type: "REFUND_FAILED", category: "payment" })).toEqual({ icon: "payment", tone: "danger" });
    expect(notificationIcon({ type: "REFUND_REQUEST_DECIDED", category: "payment" })).toEqual({ icon: "payment", tone: "neutral" });
    expect(notificationIcon({ type: "DISPUTE_OPENED", category: "payment" })).toEqual({ icon: "payment", tone: "warn" });
    expect(notificationIcon({ type: "DISPUTE_UPDATED", category: "payment" })).toEqual({ icon: "payment", tone: "neutral" });
  });

  it("asks the provider to refund: waiting on their answer, so warn", () => {
    expect(notificationIcon({ type: "REFUND_SUGGESTED", category: "payment" })).toEqual({ icon: "payment", tone: "warn" });
    // Keyed on the type, whatever the category says.
    expect(notificationIcon({ type: "REFUND_SUGGESTED", category: "system" })).toEqual({ icon: "payment", tone: "warn" });
  });
});
