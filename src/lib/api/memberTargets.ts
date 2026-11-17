import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Member targets client. Contract: binectics-api #343 (src/member-targets).
 * Behind `solo_targets` (404 while off). Targets are always optional RANGES.
 *   GET   /member-targets
 *   PATCH /member-targets   partial: a missing key is untouched, null clears it
 *   (DELETE /member-targets clears EVERYTHING including the water aim, so the
 *    page never calls it: "Remove" clears one target with a null.)
 * A weight range starting below the API's limit answers 422
 * TARGET_BELOW_SUPPORTED_RANGE and is not stored.
 */

export const TARGET_BELOW_SUPPORTED_RANGE = "TARGET_BELOW_SUPPORTED_RANGE";

export const WEIGHT_STEP_KG = 0.5;
export const WEIGHT_BOUNDS = { min: 30, max: 250 } as const;
export const FASTING_STEP_HOURS = 0.5;
export const FASTING_BOUNDS = { min: 1, max: 24 } as const;
export const WATER_BOUNDS = { min: 1, max: 30 } as const;

export interface WeightRange {
  min_kg: number;
  max_kg: number;
}
export interface FastingWindow {
  min_hours: number;
  max_hours: number;
  days_per_week: number;
}

export interface MemberTargets {
  weight_range: WeightRange | null;
  fasting_window: FastingWindow | null;
  water_glasses: number | null;
  updated_at: string | null;
}

export interface UpdateTargetsInput {
  weight_range?: WeightRange | null;
  fasting_window?: FastingWindow | null;
  water_glasses?: number | null;
}

export const memberTargetsService = {
  get: (): Promise<ApiResponse<MemberTargets>> => apiClient.get<MemberTargets>("/member-targets"),
  update: (input: UpdateTargetsInput): Promise<ApiResponse<MemberTargets>> =>
    apiClient.patch<MemberTargets>("/member-targets", input),
};
