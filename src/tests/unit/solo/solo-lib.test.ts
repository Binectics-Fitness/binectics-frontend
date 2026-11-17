import { afterEach, describe, expect, it, vi } from "vitest";
import { isOngoing, isSoloMember, type SoloInputs } from "@/lib/solo/rule";
import { isSoloMemberEnabled } from "@/lib/solo/flag";
import { SOLO_HREFS, soloActiveLabel, soloNavLinks } from "@/lib/solo/nav";
import { applyDelta, aimPosition, inverse, railFill, waterSentence } from "@/lib/solo/waterModel";
import { atCap, daysLabel, toggleDay, withTick } from "@/lib/solo/checklistModel";
import { newOpId } from "@/lib/solo/time";
import { MembershipSubscriptionStatus as S, UserRole } from "@/lib/types";
import { ChecklistItemKind, ChecklistSystemKey, type ChecklistItem, type ChecklistToday } from "@/lib/api/checklist";

const solo: SoloInputs = { role: UserRole.USER, providerCount: 0, pendingCount: 0, subscriptionStatuses: [], totalCheckIns: 0 };

describe("isSoloMember (same rule as mobile)", () => {
  it("is solo with a plain member, no providers, nothing pending, no live membership, no check-ins", () => {
    expect(isSoloMember(solo)).toBe(true);
  });
  it.each([
    ["a coach", { role: UserRole.TRAINER }],
    ["a gym owner", { role: UserRole.GYM_OWNER }],
    ["no role", { role: null }],
    ["a provider", { providerCount: 1 }],
    ["a pending request or offer", { pendingCount: 1 }],
    ["a check-in", { totalCheckIns: 1 }],
    ["a paused membership", { subscriptionStatuses: [S.PAUSED] }],
    ["a past-due membership", { subscriptionStatuses: [S.PAST_DUE] }],
    ["a pending-payment membership", { subscriptionStatuses: [S.PENDING_PAYMENT] }],
  ])("is not solo with %s", (_n, over) => {
    expect(isSoloMember({ ...solo, ...over })).toBe(false);
  });
  it("stays solo when every membership has ended", () => {
    expect(isSoloMember({ ...solo, subscriptionStatuses: [S.EXPIRED, S.CANCELLED] })).toBe(true);
    expect(isOngoing(S.EXPIRED)).toBe(false);
    expect(isOngoing(S.ACTIVE)).toBe(true);
  });
});

describe("client switch", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is off by default and for anything but true / 1 / on", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "");
    expect(isSoloMemberEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "false");
    expect(isSoloMemberEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "yes please");
    expect(isSoloMemberEnabled()).toBe(false);
  });
  it.each(["true", "1", "on", " TRUE "])("is on for %s", (v) => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", v);
    expect(isSoloMemberEnabled()).toBe(true);
  });
});

describe("solo top bar links", () => {
  it("never ships a dead link: Fasting and Progress appear only when their flags are passed", () => {
    const labels = soloNavLinks({ water: true }).map((l) => l.label);
    expect(labels).toEqual(["Today", "Water", "Log", "Explore"]);
    expect(labels).not.toContain("Fasting");
    expect(labels).not.toContain("Progress");
  });
  it("adds Fasting and Progress in the design's order when their flags are on", () => {
    expect(soloNavLinks({ water: true, fasting: true, history: true }).map((l) => l.label)).toEqual([
      "Today",
      "Fasting",
      "Water",
      "Progress",
      "Log",
      "Explore",
    ]);
    expect(soloNavLinks({ water: false, fasting: true, history: false }).map((l) => l.label)).toEqual(["Today", "Fasting", "Log", "Explore"]);
  });
  it("hides Water until solo_water is on", () => {
    expect(soloNavLinks({ water: false }).map((l) => l.label)).toEqual(["Today", "Log", "Explore"]);
  });
  it("keeps the existing log pages under Log and Home as Today", () => {
    expect(soloActiveLabel("Home", "/dashboard/member")).toBe("Today");
    expect(soloActiveLabel("", "/dashboard/member/weight-log")).toBe("Log");
    expect(soloActiveLabel("", "/dashboard/member/meal-log/")).toBe("Log");
    expect(soloActiveLabel("Water", "/dashboard/member/water")).toBe("Water");
    expect(soloActiveLabel("", "/dashboard/member/requests")).toBe("");
    expect(SOLO_HREFS.explore).toBe("/marketplace");
  });
});

describe("water model", () => {
  const w = { local_day: "2026-11-17", glasses: 3, glass_ml: 250, target_glasses: 8 };
  it("moves one glass and clamps at 0 and 50 like the API", () => {
    expect(applyDelta(w, 1).glasses).toBe(4);
    expect(applyDelta({ ...w, glasses: 0 }, -1).glasses).toBe(0);
    expect(applyDelta({ ...w, glasses: 50 }, 1).glasses).toBe(50);
  });
  it("inverts a tap", () => {
    expect(inverse(1)).toBe(-1);
    expect(inverse(-1)).toBe(1);
  });
  it("says the count in plain words and never recommends an amount", () => {
    expect(waterSentence(1, null)).toBe("1 glass today.");
    expect(waterSentence(3, 8)).toBe("3 glasses today. 5 to go to your 8.");
    expect(waterSentence(8, 8)).toBe("8 glasses today. That is your aim of 8.");
    expect(waterSentence(0, null)).toBe("0 glasses today.");
  });
  it("scales the rail to the larger of aim and count", () => {
    expect(railFill(4, 8)).toBe(50);
    expect(railFill(12, 8)).toBe(100);
    expect(aimPosition(12, 8)).toBe(67);
  });
});

describe("checklist model", () => {
  const today: ChecklistToday = {
    local_day: "2026-11-17",
    items: [
      { id: "a", label: "Walk", kind: ChecklistItemKind.CUSTOM, system_key: null, done: false },
      { id: "w", label: "Drink water", kind: ChecklistItemKind.SYSTEM, system_key: ChecklistSystemKey.WATER, done: false },
    ],
  };
  it("ticks a custom line", () => {
    expect(withTick(today, "a", true).items[0].done).toBe(true);
  });
  it("never ticks a tool line by hand", () => {
    expect(withTick(today, "w", true).items[1].done).toBe(false);
  });
  it("keeps at least one weekday on a line", () => {
    expect(toggleDay([1], 1)).toEqual([1]);
    expect(toggleDay([1, 2], 1)).toEqual([2]);
    expect(toggleDay([3], 1)).toEqual([1, 3]);
  });
  it("labels days", () => {
    expect(daysLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(daysLabel([1, 2, 3, 4, 5])).toBe("Weekdays");
    expect(daysLabel([0, 6])).toBe("Weekends");
    expect(daysLabel([1, 3, 5])).toBe("Mon, Wed, Fri");
  });
  it("is at the cap at 12 active lines; paused lines do not count", () => {
    const line = (i: number, active: boolean): ChecklistItem => ({
      id: String(i), label: "x", kind: ChecklistItemKind.CUSTOM, system_key: null, days: [1], active, order: i,
    });
    const eleven = Array.from({ length: 11 }, (_, i) => line(i, true));
    expect(atCap(eleven)).toBe(false);
    expect(atCap([...eleven, line(99, true)])).toBe(true);
    expect(atCap([...eleven, line(99, false)])).toBe(false);
  });
});

describe("client_op_id", () => {
  it("fits the API's [A-Za-z0-9_-]{8,64} and is unique per tap", () => {
    const a = newOpId();
    const b = newOpId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(a).not.toBe(b);
  });
});
