import { Clock, Droplet, Dumbbell, Footprints, type LucideIcon } from "lucide-react";
import type { GoalMetric, GoalProgressRow, MemberGoal, WeekStart } from "@/lib/api/memberGoals";
import type { Category } from "@/lib/ui/categories";

/*
 * Goals' words and rules, the same as mobile (src/utils/goals.ts). A goal is
 * the member's own words: no prefilled wording, no suggested number, no
 * streaks, no "missed", no score. Goal cards stay neutral; only the chips that
 * pick WHAT to count take that thing's colour (colour by meaning).
 */

export const NO_GOALS_YET = "No goals yet";
export const ARCHIVED = "Archived";
export const WRITE_GOAL = "Write your goal to save it";

/** What a weekly target counts, in the member's words. */
export const METRIC_LABELS: Record<GoalMetric, string> = {
  fasts: "Fasts",
  water_days: "Days with water",
  walks: "Walks",
  sessions: "Workouts",
};

/** One plain line on where the count comes from. Facts about the tool, not advice. */
export const METRIC_NOTES: Record<GoalMetric, string> = {
  fasts: "Counts fasts you finish.",
  water_days: "Counts days you reach your own glass target, or any day with a glass if you set none.",
  walks: "Counts walks you log and walks from Health Connect.",
  sessions: "Counts Starter program sessions you finish.",
};

/** The colour of the thing a weekly goal counts (mobile theme/tones.ts GOAL_METRIC_CATEGORY). */
export const GOAL_METRIC_CATEGORY: Record<GoalMetric, Category> = {
  fasts: "fast",
  water_days: "water",
  walks: "move",
  sessions: "move",
};

export const GOAL_METRIC_ICON: Record<GoalMetric, LucideIcon> = {
  fasts: Clock,
  water_days: Droplet,
  walks: Footprints,
  sessions: Dumbbell,
};

/** "3 of 5": where this week stands. Never a percentage, never "behind". */
export function progressText(count: number, target: number): string {
  return `${count} of ${target}`;
}

/** "This week, Monday to Sunday. Resets each week." */
export function weekRuleText(weekStart: WeekStart): string {
  return weekStart === "sunday"
    ? "This week, Sunday to Saturday. Resets each week."
    : "This week, Monday to Sunday. Resets each week.";
}

/** "monday" unless the server said "sunday". */
export function toGoalWeekStart(value: unknown): WeekStart {
  return value === "sunday" ? "sunday" : "monday";
}

/** "17 Nov": a short date for "Written 17 Nov". */
export function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
}

export interface GoalView {
  goal: MemberGoal;
  /** Present for a weekly target with a count this week. */
  progress: GoalProgressRow | null;
}

/** Joins the goals to their weekly counts. Free-text goals have no progress. */
export function joinProgress(goals: readonly MemberGoal[], rows: readonly GoalProgressRow[]): GoalView[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return goals.map((goal) => ({ goal, progress: goal.kind === "weekly_target" ? (byId.get(goal.id) ?? null) : null }));
}

/** Collapses runs of spaces and trims: what is sent as the goal's text. */
export const cleanGoalText = (text: string): string => text.replace(/\s+/g, " ").trim();
