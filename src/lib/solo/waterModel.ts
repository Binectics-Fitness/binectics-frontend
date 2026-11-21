import { WATER_MAX_GLASSES, type WaterToday } from "@/lib/api/water";

/**
 * Pure logic for the water counter, kept apart from React so the optimistic
 * update and its rollback can be tested directly.
 */

/** One glass up or down, clamped like the API (floor 0, ceiling 50). */
export function applyDelta(water: WaterToday, delta: 1 | -1): WaterToday {
  const glasses = Math.min(WATER_MAX_GLASSES, Math.max(0, water.glasses + delta));
  return { ...water, glasses };
}

/** The opposite tap, used to roll one failed tap back without touching later ones. */
export function inverse(delta: 1 | -1): 1 | -1 {
  return delta === 1 ? -1 : 1;
}

/** "5 glasses today." / with an aim "3 glasses today. 5 to go to your 8." */
export function waterSentence(glasses: number, target: number | null): string {
  const noun = glasses === 1 ? "glass" : "glasses";
  if (target === null) return `${glasses} ${noun} today.`;
  if (glasses >= target) return `${glasses} ${noun} today. That is your aim of ${target}.`;
  return `${glasses} ${noun} today. ${target - glasses} to go to your ${target}.`;
}

/** Fill of the rail 0..100 (the rail is scaled to the larger of aim and count). */
export function railFill(glasses: number, target: number | null): number {
  const dom = Math.max(target ?? 0, glasses, 1);
  return Math.min(100, Math.round((glasses / dom) * 100));
}

/** Position of the aim marker 0..100 on the same scale. */
export function aimPosition(glasses: number, target: number): number {
  const dom = Math.max(target, glasses, 1);
  return Math.round((target / dom) * 100);
}

/** Millilitres for the count, shown only as "250 ml a glass", never a verdict. */
export function glassMlLine(glassMl: number): string {
  return `One glass is ${glassMl} ml.`;
}
