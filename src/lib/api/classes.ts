/**
 * Gym Classes API Service — the weekly class timetable
 * (GET/POST/PATCH/DELETE /teams/organizations/:id/classes).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface GymClass {
  _id: string;
  organization_id: string;
  name: string;
  description?: string;
  instructor_name?: string;
  location_id?: string | null;
  /** 0 = Sunday … 6 = Saturday. */
  day_of_week: number;
  /** "HH:mm" wall-clock time in the org's time zone. */
  start_time: string;
  duration_minutes: number;
  capacity: number;
  waitlist_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGymClassRequest {
  name: string;
  description?: string;
  instructor_name?: string;
  location_id?: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  waitlist_enabled?: boolean;
  is_active?: boolean;
}

export type UpdateGymClassRequest = Partial<CreateGymClassRequest>;

export const classesService = {
  async listClasses(
    organizationId: string,
    includeInactive = false,
  ): Promise<ApiResponse<GymClass[]>> {
    const query = includeInactive ? "?include_inactive=true" : "";
    return apiClient.get<GymClass[]>(
      `/teams/organizations/${organizationId}/classes${query}`,
    );
  },

  async getClass(
    organizationId: string,
    classId: string,
  ): Promise<ApiResponse<GymClass>> {
    return apiClient.get<GymClass>(
      `/teams/organizations/${organizationId}/classes/${classId}`,
    );
  },

  async createClass(
    organizationId: string,
    data: CreateGymClassRequest,
  ): Promise<ApiResponse<GymClass>> {
    return apiClient.post<GymClass>(
      `/teams/organizations/${organizationId}/classes`,
      data,
    );
  },

  async updateClass(
    organizationId: string,
    classId: string,
    data: UpdateGymClassRequest,
  ): Promise<ApiResponse<GymClass>> {
    return apiClient.patch<GymClass>(
      `/teams/organizations/${organizationId}/classes/${classId}`,
      data,
    );
  },

  async deleteClass(
    organizationId: string,
    classId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `/teams/organizations/${organizationId}/classes/${classId}`,
    );
  },
};

/** "06:30" per the org's time format ("6:30 AM" for 12h orgs). Pure display helper. */
export function classTime(hhmm: string, twelveHour: boolean): string {
  if (!twelveHour) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
