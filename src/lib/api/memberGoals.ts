import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Member goals. Contract: binectics-api (src/member-goals), the same routes
 * mobile calls (src/api/memberGoals.ts).
 *   GET    /member-goals            ?include_archived=true   { items }
 *   POST   /member-goals            { text, kind, metric?, target? }   10 active, 50 in all
 *   PATCH  /member-goals/:id        { text?, metric?, target?, active? }  active false archives
 *   DELETE /member-goals/:id
 *   GET    /member-goals/progress   ?tz&week_of   this week's count per weekly goal
 *   GET    /member-goals/settings   { week_start, hide_daily_weights }
 *   PATCH  /member-goals/settings   partial
 * A goal is the member's own words, or a weekly count of something they log.
 * No streaks, no "missed", no scores.
 *
 * `hide_daily_weights` is stored on the server so the choice follows the
 * member across web and phone. An API that predates the field answers only
 * { week_start }: a missing field reads as false.
 */

export const GOAL_TEXT_MAX = 120;
export const GOALS_MAX_ACTIVE = 10;
export const GOAL_TARGET_MIN = 1;
export const GOAL_TARGET_MAX = 7;

export type GoalKind = "free_text" | "weekly_target";
export type GoalMetric = "fasts" | "water_days" | "walks" | "sessions";
export const GOAL_METRICS: readonly GoalMetric[] = ["fasts", "water_days", "walks", "sessions"];
export type WeekStart = "monday" | "sunday";

export interface MemberGoal {
  id: string;
  text: string;
  kind: GoalKind;
  metric: GoalMetric | null;
  target: number | null;
  active: boolean;
  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateGoalInput {
  text: string;
  kind: GoalKind;
  /** weekly_target only */
  metric?: GoalMetric;
  /** weekly_target only, 1 to 7 */
  target?: number;
}

export interface UpdateGoalInput {
  text?: string;
  metric?: GoalMetric;
  target?: number;
  /** false archives the goal, true restores it */
  active?: boolean;
}

export interface GoalProgressRow {
  id: string;
  text: string;
  metric: GoalMetric | null;
  target: number | null;
  count: number;
}

export interface GoalProgress {
  tz: string;
  week_start: WeekStart;
  week: { from: string; to: string };
  goals: GoalProgressRow[];
}

export interface MemberGoalsSettings {
  week_start?: string;
  hide_daily_weights?: boolean;
}

export interface UpdateMemberGoalsSettingsInput {
  week_start?: WeekStart;
  hide_daily_weights?: boolean;
}

export const memberGoalsService = {
  getSettings: (): Promise<ApiResponse<MemberGoalsSettings>> =>
    apiClient.get<MemberGoalsSettings>("/member-goals/settings"),
  updateSettings: (input: UpdateMemberGoalsSettingsInput): Promise<ApiResponse<MemberGoalsSettings>> =>
    apiClient.patch<MemberGoalsSettings>("/member-goals/settings", input),

  /** Active goals, or every goal (archived too) with includeArchived. */
  list: async (includeArchived = false): Promise<ApiResponse<MemberGoal[]>> => {
    const res = await apiClient.get<{ items?: MemberGoal[] }>(
      includeArchived ? "/member-goals?include_archived=true" : "/member-goals",
    );
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: Array.isArray(res.data?.items) ? res.data.items : [] };
  },
  create: (input: CreateGoalInput): Promise<ApiResponse<MemberGoal>> =>
    apiClient.post<MemberGoal>("/member-goals", input),
  update: (id: string, input: UpdateGoalInput): Promise<ApiResponse<MemberGoal>> =>
    apiClient.patch<MemberGoal>(`/member-goals/${encodeURIComponent(id)}`, input),
  remove: (id: string): Promise<ApiResponse<unknown>> =>
    apiClient.delete<unknown>(`/member-goals/${encodeURIComponent(id)}`),
  /** This week's count from the member's real logs, per weekly goal. */
  progress: (tz: string, weekOf?: string): Promise<ApiResponse<GoalProgress>> => {
    const qs = new URLSearchParams({ tz });
    if (weekOf) qs.set("week_of", weekOf);
    return apiClient.get<GoalProgress>(`/member-goals/progress?${qs.toString()}`);
  },
};

/** A plain sentence for a failed goals call, independent of the server's wording. */
export function goalErrorMessage(
  res: Pick<ApiResponse, "code" | "status" | "message">,
  fallback = "Something went wrong. Try again.",
): string {
  if (res.code === "GOAL_LIMIT_REACHED") {
    return /50/.test(String(res.message ?? ""))
      ? "You have 50 goals, archived ones included. Delete one to add another."
      : "You can keep up to 10 active goals. Archive one to add another.";
  }
  if (res.code === "GOAL_NOT_FOUND") return "That goal is no longer there.";
  if (res.status === undefined || res.status === 0) return "Could not reach Binectics. Check your connection and try again.";
  if (res.status === 429) return "Too many changes. Wait a moment and try again.";
  return fallback;
}
