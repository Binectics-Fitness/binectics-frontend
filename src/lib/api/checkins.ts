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

/** One visit in a member's activity at a gym. */
export interface MemberActivityVisit {
  _id: string;
  checked_in_at: string;
  /** The location checked in at; null when the check-in had none. */
  listing_headline: string | null;
}

/** A member's check-in activity at one gym (gym owner's member page). */
export interface MemberActivity {
  total_visits: number;
  visits_last_30_days: number;
  /** Null when the member has never checked in here. */
  last_visit_at: string | null;
  /** Newest first, at most 20. */
  recent: MemberActivityVisit[];
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
   * Fresh rotating QR token for the kiosk (staff only). The QR encodes
   * /check-in/<orgId>?t=<token>; scans without a fresh token are refused
   * — that's the presence guarantee.
   */
  getKioskToken: (
    organizationId: string,
  ): Promise<ApiResponse<{ token: string; expires_at: string }>> =>
    apiClient.get<{ token: string; expires_at: string }>(
      `/checkins/organizations/${organizationId}/kiosk-token`,
    ),

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

  getMemberActivity: (
    organizationId: string,
    memberUserId: string,
  ): Promise<ApiResponse<MemberActivity>> =>
    apiClient.get<MemberActivity>(
      `/checkins/organizations/${organizationId}/members/${memberUserId}/activity`,
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
