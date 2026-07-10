/**
 * Check-ins API Service
 * Handles QR-based gym check-ins for members and org history for gym owners.
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  CheckIn,
  CheckInHistoryPeriod,
  MyCheckInDashboardStats,
  MyCheckInStatus,
  OrgCheckInDashboardStats,
} from "@/lib/types";
import type { ScanCheckInDto, OrgRevenueStatsDto } from "./generated/types";

// Sourced from the generated OpenAPI contract — see src/lib/api/generated/types.ts.
export type ScanCheckInRequest = ScanCheckInDto;
export type OrgRevenueStats = OrgRevenueStatsDto;

export interface GymCheckInInfo {
  name: string;
  /** Published marketplace listing id, when the gym has a storefront. */
  listing_id: string | null;
}

export interface CheckInRejection {
  _id: string;
  organization_id: string;
  listing_id: string;
  member_user_id:
    | string
    | { _id: string; first_name: string; last_name: string };
  reason: "no_subscription" | "already_checked_in";
  attempted_at: string;
}

export const checkinsService = {
  /**
   * Record a QR check-in for the authenticated member.
   * Verifies active subscription and prevents same-day duplicates.
   */
  scan: (data: ScanCheckInRequest): Promise<ApiResponse<CheckIn>> =>
    apiClient.post<CheckIn>("/checkins/scan", data),

  /** Public gym display info for the scan landing (no auth). */
  getGymInfo: (gymId: string): Promise<ApiResponse<GymCheckInInfo>> =>
    apiClient.get<GymCheckInInfo>(`/checkins/gym/${gymId}/info`, false),

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

  /**
   * Recent bounced check-in attempts for the org's front-desk feed.
   */
  getOrgRejections: (
    organizationId: string,
  ): Promise<ApiResponse<CheckInRejection[]>> =>
    apiClient.get<CheckInRejection[]>(
      `/checkins/organizations/${organizationId}/rejections`,
    ),

  getMyStatus: (): Promise<ApiResponse<MyCheckInStatus>> =>
    apiClient.get<MyCheckInStatus>("/checkins/my-status"),

  getMyDashboardStats: (): Promise<ApiResponse<MyCheckInDashboardStats>> =>
    apiClient.get<MyCheckInDashboardStats>("/checkins/dashboard-stats"),

  getOrgDashboardStats: (
    organizationId: string,
  ): Promise<ApiResponse<OrgCheckInDashboardStats>> =>
    apiClient.get<OrgCheckInDashboardStats>(
      `/checkins/organizations/${organizationId}/dashboard-stats`,
    ),

  getOrgRevenueStats: (
    organizationId: string,
  ): Promise<ApiResponse<OrgRevenueStats>> =>
    apiClient.get<OrgRevenueStats>(
      `/checkins/organizations/${organizationId}/revenue-stats`,
    ),

  /**
   * Get check-in history for the authenticated member.
   * Returns check-ins with populated listing headline/city.
   */
  getMyHistory: (
    period?: CheckInHistoryPeriod,
  ): Promise<ApiResponse<CheckIn[]>> => {
    const query = period ? `?period=${period}` : "";
    return apiClient.get<CheckIn[]>(`/checkins/my-history${query}`);
  },
};
