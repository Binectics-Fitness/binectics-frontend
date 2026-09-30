/**
 * A rate the API already sends as a percentage (1.7 means 1.7%), shown to
 * one decimal. Never rescaled: the users page multiplied it by 100 (1 of 58
 * users read "170.0%"), and the overview guessed that anything at or under 1
 * was a fraction (a real 0.5% read "50.0%").
 */
export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
