import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadShopState, saveShopState } from "@/lib/progress/shoppingListStore";
import { isoWeekKey } from "@/lib/progress/weeklyPlan";

// The shopping list's local state is loss-tolerable: whatever is stored
// (older builds, manual edits, another tab) must degrade to empty, never
// throw. A stored `{ have: [] }` without `weeks` used to crash the whole
// member meal-plan page on every load.

const KEY = "mealplan-shop:u1:p1";
const seed = (value: string) => window.localStorage.setItem(KEY, value);

describe("shoppingListStore", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("returns empty state when nothing is stored", () => {
    expect(loadShopState("u1", "p1")).toEqual({ have: [], checked: [] });
  });

  it("survives stored state without weeks and keeps have", () => {
    seed(JSON.stringify({ have: ["eggs"] }));
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: [] });
  });

  it.each([
    ["weeks is null", { have: ["eggs"], weeks: null }],
    ["weeks is an array", { have: ["eggs"], weeks: ["x"] }],
    ["weeks is a string", { have: ["eggs"], weeks: "2026-W41" }],
  ])("ignores a malformed weeks field (%s)", (_name, stored) => {
    seed(JSON.stringify(stored));
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: [] });
  });

  it("ignores a malformed have field and non-string entries", () => {
    seed(JSON.stringify({ have: "eggs", weeks: { [isoWeekKey()]: ["oats", 3, null] } }));
    expect(loadShopState("u1", "p1")).toEqual({ have: [], checked: ["oats"] });
    seed(JSON.stringify({ have: ["eggs", 7], weeks: { [isoWeekKey()]: "oats" } }));
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: [] });
  });

  it.each(["not json", "null", "42", '"text"', "[]"])(
    "treats corrupt storage %s as empty",
    (raw) => {
      seed(raw);
      expect(loadShopState("u1", "p1")).toEqual({ have: [], checked: [] });
    },
  );

  it("round-trips, pruning foods no longer on the list", () => {
    saveShopState("u1", "p1", ["eggs", "gone"], ["oats", "gone"], ["eggs", "oats"]);
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: ["oats"] });
  });

  it("resets checked in a new ISO week but keeps have", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 8, 10)); // Thursday, 2026-W41
    saveShopState("u1", "p1", ["eggs"], ["oats"], ["eggs", "oats"]);
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: ["oats"] });

    vi.setSystemTime(new Date(2026, 9, 15, 10)); // next Thursday, 2026-W42
    expect(loadShopState("u1", "p1")).toEqual({ have: ["eggs"], checked: [] });
  });

  it("keys state per user", () => {
    saveShopState("u1", "p1", ["eggs"], [], ["eggs"]);
    expect(loadShopState("u2", "p1")).toEqual({ have: [], checked: [] });
  });
});
