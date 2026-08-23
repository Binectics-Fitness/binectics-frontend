/**
 * Local-only persistence for the shopping list (MEAL_PLAN_WEEKLY_SPEC §8).
 * Key is USER-scoped so accounts sharing a device never see each other's
 * state; `checked` lives under the device-local ISO week (resets weekly),
 * `have` persists per plan. State is loss-tolerable by design; keys absent
 * from the current derived list are pruned on write.
 */

import { isoWeekKey } from "./weeklyPlan";

interface ShopState {
  have: string[];
  weeks: Record<string, string[]>;
}

const key = (userId: string, planId: string) => `mealplan-shop:${userId}:${planId}`;

function read(userId: string, planId: string): ShopState {
  if (typeof window === "undefined") return { have: [], weeks: {} };
  try {
    const raw = window.localStorage.getItem(key(userId, planId));
    const parsed = raw ? (JSON.parse(raw) as ShopState) : null;
    return parsed && Array.isArray(parsed.have) ? parsed : { have: [], weeks: {} };
  } catch {
    return { have: [], weeks: {} };
  }
}

export function loadShopState(
  userId: string,
  planId: string,
): { have: string[]; checked: string[] } {
  const s = read(userId, planId);
  return { have: s.have, checked: s.weeks[isoWeekKey()] ?? [] };
}

export function saveShopState(
  userId: string,
  planId: string,
  have: string[],
  checked: string[],
  currentFoods: string[],
): void {
  if (typeof window === "undefined") return;
  const valid = new Set(currentFoods);
  const week = isoWeekKey();
  const state: ShopState = {
    have: have.filter((f) => valid.has(f)),
    // Only the current week is kept — past weeks are stale by definition.
    weeks: { [week]: checked.filter((f) => valid.has(f)) },
  };
  try {
    window.localStorage.setItem(key(userId, planId), JSON.stringify(state));
  } catch {
    // Storage full/blocked: the list still works, state just won't persist.
  }
}
