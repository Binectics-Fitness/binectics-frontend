import { describe, expect, it } from "vitest";
import { AccountType, MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import {
  CHECK_IN_ACTION,
  LOG_ACTION,
  MEMBER_NAV_V2,
  centreActionFor,
  memberNavActiveV2,
  trainSegmentFor,
} from "../shellV2";

const NOW = Date.parse("2026-11-28T10:00:00Z");
const sub = (status: MembershipSubscriptionStatus, type: string | undefined, end?: string) =>
  ({
    status,
    end_date: end,
    organization_id: type === undefined ? { _id: "o", name: "Org" } : { _id: "o", name: "Org", account_type: type },
  }) as unknown as MembershipSubscription;

describe("member nav v2", () => {
  it("is tab bar A with Explore off the bar", () => {
    expect(MEMBER_NAV_V2.map((l) => l.label)).toEqual(["Today", "Train", "Progress", "Messages", "Me"]);
  });

  it("maps old routes onto the new bar", () => {
    const cases: [string, ReturnType<typeof memberNavActiveV2>][] = [
      ["/dashboard/member", "today"],
      ["/dashboard/member/fasting/history", "today"],
      ["/dashboard/member/workouts/abc", "train"],
      ["/dashboard/member/starter/session", "train"],
      ["/dashboard/member/meal-plans/", "train"],
      ["/dashboard/bookings", "train"],
      ["/dashboard/sessions/9", "train"],
      ["/dashboard/member/progress/targets", "progress"],
      ["/dashboard/member/activity", "progress"],
      ["/dashboard/member/weight-log", "log"],
      ["/dashboard/member/log", "log"],
      ["/dashboard/messages", "messages"],
      ["/dashboard/member/billing", "me"],
      ["/dashboard/saved-providers", "me"],
      ["/dashboard/member/me", "me"],
      ["/marketplace", null],
    ];
    for (const [path, key] of cases) expect(memberNavActiveV2(path), path).toBe(key);
  });

  it("finds the Train section", () => {
    expect(trainSegmentFor("/dashboard/member/workouts")).toBe("plan");
    expect(trainSegmentFor("/dashboard/bookings")).toBe("sessions");
    expect(trainSegmentFor("/dashboard/member/progress")).toBeNull();
  });
});

describe("centre action", () => {
  it("is Log without a gym membership", () => {
    expect(centreActionFor([], NOW)).toBe(LOG_ACTION);
    expect(centreActionFor(null, NOW)).toBe(LOG_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.ACTIVE, AccountType.PERSONAL_TRAINER)], NOW)).toBe(LOG_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.PENDING_PAYMENT, AccountType.GYM_OWNER)], NOW)).toBe(LOG_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.EXPIRED, AccountType.GYM_OWNER)], NOW)).toBe(LOG_ACTION);
  });

  it("is Check in for a gym membership that opens the door or is paused", () => {
    expect(centreActionFor([sub(MembershipSubscriptionStatus.ACTIVE, AccountType.GYM_OWNER)], NOW)).toBe(CHECK_IN_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.PAST_DUE, undefined)], NOW)).toBe(CHECK_IN_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.PAUSED, AccountType.GYM_OWNER)], NOW)).toBe(CHECK_IN_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.CANCELLED, AccountType.GYM_OWNER, "2026-12-30T00:00:00Z")], NOW)).toBe(CHECK_IN_ACTION);
    expect(centreActionFor([sub(MembershipSubscriptionStatus.CANCELLED, AccountType.GYM_OWNER, "2026-11-01T00:00:00Z")], NOW)).toBe(LOG_ACTION);
  });
});
