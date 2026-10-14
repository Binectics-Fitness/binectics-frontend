import { describe, it, expect } from "vitest";
import {
  canPause,
  canResume,
  canSuspend,
  canUnsuspend,
  daysPaused,
  endIfResumedAt,
  holdAtGym,
  holdRefusalCopy,
  pauseEffectLines,
  pausedLine,
  suspendedLine,
} from "@/lib/billing/membershipHolds";
import { holdDetailLine, holdErrorCopy, mergeHoldChange } from "@/app/dashboard/gym-owner/members/HoldActions";
import { MembershipSubscriptionStatus as S, type MembershipSubscription } from "@/lib/types";

const DAY = 86_400_000;
const NOW = new Date("2026-10-14T12:00:00Z");
const fmt = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: { _id: "o1", name: "Iron Temple" },
    plan_id: "p1",
    listing_id: { _id: "l1", headline: "Iron Temple Ikoyi" },
    member_user_id: "u1",
    status: S.ACTIVE,
    start_date: "2026-10-01T00:00:00Z",
    end_date: "2026-10-31T00:00:00Z",
    amount_paid_minor: 0,
    currency: "NGN",
    auto_renew: false,
    created_at: "",
    updated_at: "",
    ...over,
  };
}

describe("who may do what (mirrors the API)", () => {
  it("pause: active with a running term only", () => {
    expect(canPause(sub(), NOW)).toBe(true);
    expect(canPause(sub({ end_date: undefined }), NOW)).toBe(true);
    // Ended but not yet swept: the API refuses, so no button.
    expect(canPause(sub({ end_date: "2026-10-13T00:00:00Z" }), NOW)).toBe(false);
    for (const status of [S.PAUSED, S.SUSPENDED, S.PAST_DUE, S.PENDING_PAYMENT, S.EXPIRED, S.CANCELLED]) {
      expect(canPause(sub({ status }), NOW)).toBe(false);
    }
  });

  it("resume: paused only", () => {
    expect(canResume(sub({ status: S.PAUSED }))).toBe(true);
    expect(canResume(sub())).toBe(false);
    expect(canResume(sub({ status: S.SUSPENDED }))).toBe(false);
  });

  it("suspend: active or past due; lift: suspended", () => {
    expect(canSuspend(sub())).toBe(true);
    expect(canSuspend(sub({ status: S.PAST_DUE }))).toBe(true);
    for (const status of [S.PAUSED, S.SUSPENDED, S.PENDING_PAYMENT, S.EXPIRED, S.CANCELLED]) {
      expect(canSuspend(sub({ status }))).toBe(false);
    }
    expect(canUnsuspend(sub({ status: S.SUSPENDED }))).toBe(true);
    expect(canUnsuspend(sub({ status: S.PAUSED }))).toBe(false);
  });
});

describe("paused dates", () => {
  const paused = sub({ status: S.PAUSED, paused_at: new Date(NOW.getTime() - 10 * DAY).toISOString() });

  it("the end date moves later by exactly the time paused so far", () => {
    expect(daysPaused(paused, NOW)).toBe(10);
    expect(endIfResumedAt(paused, NOW)?.toISOString()).toBe(new Date(Date.parse("2026-10-31T00:00:00Z") + 10 * DAY).toISOString());
    expect(endIfResumedAt(sub(), NOW)).toBeNull();
    expect(endIfResumedAt(sub({ status: S.PAUSED, end_date: undefined }), NOW)).toBeNull();
  });

  it("says since when, and the new end, to the member and to the gym", () => {
    expect(pausedLine(paused, fmt, NOW)).toBe("Paused since 2026-10-04 (10 days). Resume today and it runs to 2026-11-10.");
    expect(pausedLine(paused, fmt, NOW, "gym")).toBe("Paused since 2026-10-04 (10 days). Ends 2026-11-10 if they resume today.");
    expect(holdDetailLine(paused, fmt, NOW)).toBe("Paused since 2026-10-04 (10 days). Ends 2026-11-10 if they resume today.");
  });
});

describe("what pausing does, before the member confirms", () => {
  it("names the end date and that it moves", () => {
    const lines = pauseEffectLines(sub(), fmt);
    expect(lines[0]).toBe("Your membership pauses today. You can't check in or book classes while it's paused.");
    expect(lines[1]).toBe("It's due to end on 2026-10-31. That date moves later by the days you're paused.");
    expect(lines.join(" ")).not.toMatch(/Auto-renew/);
  });

  it("says the card isn't charged while paused, only when the card renews it", () => {
    const lines = pauseEffectLines(sub({ auto_renew: true, collection_method: "card_auto" }), fmt);
    expect(lines).toContain(
      "Auto-renew won't charge your card while paused. It carries on for the new end date once you resume.",
    );
  });
});

describe("suspension copy", () => {
  it("gives the gym's reason and who to contact", () => {
    const s = sub({ status: S.SUSPENDED, suspended_at: "2026-10-10T09:00:00Z", suspension_reason: "Unpaid locker fee" });
    expect(suspendedLine(s, fmt)).toBe(
      "Iron Temple suspended this membership on 2026-10-10: “Unpaid locker fee”. Contact Iron Temple to restore your access.",
    );
    expect(holdDetailLine(s, fmt)).toBe("Suspended since 2026-10-10: “Unpaid locker fee”");
  });

  it("without a reason (or a date, on an old suspension) asks them to contact the gym", () => {
    const s = sub({ status: S.SUSPENDED });
    expect(suspendedLine(s, fmt)).toBe(
      "Iron Temple suspended this membership. Contact Iron Temple to find out why and restore your access.",
    );
    expect(holdDetailLine(s, fmt)).toBe("Suspended.");
  });
});

describe("explaining a refused check-in or booking", () => {
  const suspended = sub({ _id: "a", status: S.SUSPENDED, suspension_reason: "Dues" });
  const elsewhere = sub({ _id: "b", organization_id: { _id: "o2", name: "Other" }, listing_id: { _id: "l2", headline: "Other" } });

  it("finds the hold at this gym by org id, listing id, or a legacy listing id in the QR", () => {
    expect(holdAtGym([suspended], { organizationId: "o1" })?.kind).toBe("suspended");
    expect(holdAtGym([suspended], { listingId: "l1" })?.kind).toBe("suspended");
    expect(holdAtGym([suspended], { organizationId: "l1" })?.kind).toBe("suspended");
    expect(holdAtGym([sub({ status: S.PAUSED })], { organizationId: "o1" })?.kind).toBe("paused");
  });

  it("explains nothing when another membership here gets them in, or the hold is elsewhere", () => {
    expect(holdAtGym([suspended, sub({ _id: "c" })], { organizationId: "o1" })).toBeNull();
    expect(holdAtGym([sub({ _id: "c", status: S.PAST_DUE }), suspended], { organizationId: "o1" })).toBeNull();
    expect(holdAtGym([elsewhere, suspended], { organizationId: "o9" })).toBeNull();
    expect(holdAtGym([], { organizationId: "o1" })).toBeNull();
  });

  it("a suspension wins over a pause at the same gym", () => {
    expect(holdAtGym([sub({ status: S.PAUSED }), suspended], { organizationId: "o1" })?.kind).toBe("suspended");
  });

  it("in words", () => {
    expect(holdRefusalCopy({ kind: "suspended", sub: suspended }, fmt, "check in")).toEqual({
      title: "Your membership is suspended.",
      body: "Iron Temple suspended this membership: “Dues”. Contact Iron Temple to restore your access.",
    });
    const paused = sub({ status: S.PAUSED, paused_at: "2026-10-04T12:00:00Z", end_date: undefined });
    expect(holdRefusalCopy({ kind: "paused", sub: paused }, fmt, "book classes")).toEqual({
      title: "Your membership is paused.",
      body: "You paused it on 2026-10-04, so you can't book classes at Iron Temple until you resume it.",
    });
  });
});

describe("gym-side plumbing", () => {
  it("merges the API's unpopulated answer onto the populated row", () => {
    const shown = sub({ member_user_id: { _id: "u1", first_name: "Ada", last_name: "M", email: "a@x.test" } });
    const merged = mergeHoldChange(shown, {
      ...sub({ status: S.SUSPENDED, suspension_reason: "Dues", suspended_at: "2026-10-14T00:00:00Z" }),
      member_user_id: "u1",
      plan_id: "p1",
    });
    expect(merged.status).toBe(S.SUSPENDED);
    expect(merged.suspension_reason).toBe("Dues");
    expect(typeof merged.member_user_id).toBe("object");
    const lifted = mergeHoldChange(merged, sub({ status: S.ACTIVE }));
    expect(lifted.suspension_reason).toBeNull();
    expect(lifted.suspended_at).toBeNull();
  });

  it("errors in words", () => {
    expect(holdErrorCopy({ success: false, status: 403 }, "x")).toBe(
      "You don't have permission to manage members for this gym.",
    );
    expect(holdErrorCopy({ success: false, status: 400, message: "Only an active or past-due membership can be suspended." }, "x")).toBe(
      "Only an active or past-due membership can be suspended. Refresh the page to see where it stands.",
    );
    expect(holdErrorCopy({ success: false }, "fallback")).toBe("fallback");
  });
});
