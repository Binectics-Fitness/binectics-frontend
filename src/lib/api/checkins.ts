/**
 * Check-ins API Service
 * Handles QR-based gym check-ins for members and org history for gym owners.
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  CheckIn,
  CheckInHistoryPeriod,
  MyCheckInStatus,
} from "@/lib/types";

export interface ScanCheckInRequest {
  listing_id: string;
  note?: string;
}

export const checkinsService = {
  /**
   * Record a QR check-in for the authenticated member.
   * Verifies active subscription and prevents same-day duplicates.
   */
  scan: (data: ScanCheckInRequest): Promise<ApiResponse<CheckIn>> =>
    apiClient.post<CheckIn>("/checkins/scan", data),

  /**
   * Get check-in history for an organisation (gym owner view).
   * @param organizationId  - Organisation / gym ID
   * @param date            - Optional ISO date string YYYY-MM-DD to filter by day
   */
  getOrgCheckIns: (
    organizationId: string,
    period?: CheckInHistoryPeriod,
    date?: string,
  ): Promise<ApiResponse<CheckIn[]>> => {
    const queryParts: string[] = [];
    if (period) queryParts.push(`period=${period}`);
    if (date) queryParts.push(`date=${date}`);
    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return apiClient.get<CheckIn[]>(
      `/checkins/organizations/${organizationId}${query}`,
    );
  },

  getMyStatus: (): Promise<ApiResponse<MyCheckInStatus>> =>
    apiClient.get<MyCheckInStatus>("/checkins/my-status"),
};
