import type { MyCheckInDashboardStats } from "@/lib/types";

/**
 * GET /checkins/dashboard-stats, plus the fields API #191 adds. They are
 * optional on purpose: an API build without them still works, and the UI
 * then simply leaves out the "longest streak" line and the at-risk hint.
 * Once #191 is in the generated schema, fold these into the shared type.
 */
export interface StreakStats extends MyCheckInDashboardStats {
  /** The streak is still alive from yesterday but today has no check-in yet. */
  streak_at_risk?: boolean;
  longest_streak_days?: number;
  /** IANA zone the API counted days in. */
  streak_timezone?: string;
}

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

/** Mono footnote under a streak number: the best, or how far off it is. */
export function longestStreakLine(stats: Pick<StreakStats, "current_streak_days" | "longest_streak_days">): string | null {
  const longest = longestStreak(stats);
  if (longest === null) return null;
  if (isPersonalBest(stats)) return "Personal best";
  return `Longest · ${longest} ${dayUnit(longest)}`;
}
