import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Member goals settings. Contract: binectics-api (src/member-goals).
 *   GET   /member-goals/settings   { week_start, hide_daily_weights }
 *   PATCH /member-goals/settings   partial; hide_daily_weights is a boolean
 * `hide_daily_weights` is stored on the server so the choice follows the
 * member across web and phone. An API that predates the field answers only
 * { week_start }: a missing field reads as false.
 */

export interface MemberGoalsSettings {
  week_start?: string;
  hide_daily_weights?: boolean;
}

export interface UpdateMemberGoalsSettingsInput {
  hide_daily_weights?: boolean;
}

export const memberGoalsService = {
  getSettings: (): Promise<ApiResponse<MemberGoalsSettings>> =>
    apiClient.get<MemberGoalsSettings>("/member-goals/settings"),
  updateSettings: (input: UpdateMemberGoalsSettingsInput): Promise<ApiResponse<MemberGoalsSettings>> =>
    apiClient.patch<MemberGoalsSettings>("/member-goals/settings", input),
};
