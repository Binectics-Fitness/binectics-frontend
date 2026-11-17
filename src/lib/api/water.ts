import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Water client. Contract: binectics-api #341 (src/water). Behind the
 * `solo_water` flag: while it is off every route answers 404.
 *   GET   /water/today?tz
 *   PUT   /water/today/adjust   { delta: 1|-1, tz, client_op_id?, local_day?, glass_ml? }
 *   GET   /water/summary?from&to&tz
 *   GET   /water/settings
 *   PATCH /water/settings       { target_glasses?: 1..30|null, glass_ml?: 100..1000 }
 */

export const WATER_MAX_GLASSES = 50;
export const WATER_TARGET_MAX = 30;

export interface WaterToday {
  local_day: string;
  glasses: number;
  glass_ml: number;
  /** The member's own aim, or null when none is set. */
  target_glasses: number | null;
}

export interface WaterAdjusted extends WaterToday {
  /** false when the tap changed nothing (floor, ceiling, or a replayed op id). */
  applied: boolean;
}

export interface WaterSettings {
  target_glasses: number | null;
  glass_ml: number;
}

export interface AdjustWaterInput {
  delta: 1 | -1;
  tz: string;
  client_op_id?: string;
}

export interface UpdateWaterSettingsInput {
  target_glasses?: number | null;
  glass_ml?: number;
}

export const waterService = {
  today: (tz: string): Promise<ApiResponse<WaterToday>> =>
    apiClient.get<WaterToday>(`/water/today?tz=${encodeURIComponent(tz)}`),

  adjust: (input: AdjustWaterInput): Promise<ApiResponse<WaterAdjusted>> =>
    apiClient.put<WaterAdjusted>("/water/today/adjust", input),

  getSettings: (): Promise<ApiResponse<WaterSettings>> =>
    apiClient.get<WaterSettings>("/water/settings"),

  updateSettings: (input: UpdateWaterSettingsInput): Promise<ApiResponse<WaterSettings>> =>
    apiClient.patch<WaterSettings>("/water/settings", input),
};
