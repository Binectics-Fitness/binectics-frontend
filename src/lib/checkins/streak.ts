import type { MyCheckInDashboardStats } from "@/lib/types";

/** GET /checkins/dashboard-stats; the API #191 fields on it are optional. */
export type StreakStats = MyCheckInDashboardStats;

export function dayUnit(n: number): string {
  return n === 1 ? "day" : "days";
}

/** A real longest streak from the API, or null when it didn't send one. */
export function longestStreak(stats: Pick<StreakStats, "longest_streak_days">): number | null {
  const longest = stats.longest_streak_days;
  return typeof longest === "number" && Number.isFinite(longest) && longest > 0 ? longest : null;
}

/**
 * The current streak is the member's best so far. Only with a real longest
 * streak from the API, and never for a 1-day streak (that is just a start).
 */
export function isPersonalBest(stats: Pick<StreakStats, "current_streak_days" | "longest_streak_days">): boolean {
  const longest = longestStreak(stats);
  return longest !== null && stats.current_streak_days >= 2 && stats.current_streak_days >= longest;
}

/**
 * Mono footnote under a streak number: "Personal best", or the longest
 * streak while the current one is still short of it. Nothing when the API
 * sent no longest streak, or when the line would only repeat the number
 * above it (a first 1-day streak is its own longest).
 */
export function longestStreakLine(stats: Pick<StreakStats, "current_streak_days" | "longest_streak_days">): string | null {
  const longest = longestStreak(stats);
  if (longest === null) return null;
  if (isPersonalBest(stats)) return "Personal best";
  if (stats.current_streak_days >= longest) return null;
  return `Longest · ${longest} ${dayUnit(longest)}`;
}
