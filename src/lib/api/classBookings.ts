/**
 * Class bookings API — public listing timetable + member booking flow +
 * org roster (backed by binectics-api feat/class-bookings).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { GymClass } from "./classes";

export type ClassBookingStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled_by_member"
  | "cancelled_by_gym";

export interface ClassBooking {
  _id: string;
  class_id: string | Pick<GymClass, "_id" | "name" | "start_time" | "duration_minutes" | "instructor_name" | "day_of_week">;
  organization_id: string;
  member_user_id:
    | string
    | { _id: string; first_name: string; last_name: string; email: string };
  /** "YYYY-MM-DD" — occurrence day in the gym's time zone. */
  booking_date: string;
  status: ClassBookingStatus;
  /** The listing it was booked through; booking again goes through it. Absent on old bookings. */
  listing_id?: string | null;
  /**
   * The member's own waitlisted bookings only: the occurrence has a free
   * spot and can still be booked. Booking again takes it, in waitlist
   * order (a member ahead of them may get it first). A hint, not a hold.
   */
  spot_open?: boolean;
  cancelled_at: string | null;
  cancellation_fee_applied: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Refusals that leave a waitlisted member's place as it was: the open spot
 * went to someone ahead of them, or no spot is open. Said plainly, not as
 * an error. Matched on the API's code, and on its words for the first,
 * which an API without the code already sends.
 */
export function keepsWaitlistPlace(res: ApiResponse<unknown>): boolean {
  if (res.success) return false;
  if (res.code === "CLASS_WAITLIST_SPOT_TAKEN" || res.code === "CLASS_ALREADY_WAITLISTED") return true;
  return /ahead of you on the waitlist/i.test(res.message ?? "");
}

export const classBookingsService = {
  /** Public weekly timetable for a listing. */
  async getListingClasses(listingId: string): Promise<ApiResponse<GymClass[]>> {
    return apiClient.get<GymClass[]>(
      `/marketplace/listings/${listingId}/classes`,
      false,
    );
  },

  /** Book one occurrence; server enforces the gym's booking rules. */
  async bookClass(
    listingId: string,
    classId: string,
    bookingDate: string,
  ): Promise<ApiResponse<ClassBooking>> {
    return apiClient.post<ClassBooking>(
      `/marketplace/listings/${listingId}/classes/${classId}/bookings`,
      { booking_date: bookingDate },
    );
  },

  async getMyClassBookings(
    includePast = false,
  ): Promise<ApiResponse<ClassBooking[]>> {
    const query = includePast ? "?include_past=true" : "";
    return apiClient.get<ClassBooking[]>(
      `/marketplace/my-class-bookings${query}`,
    );
  },

  async cancelClassBooking(
    bookingId: string,
  ): Promise<ApiResponse<ClassBooking>> {
    return apiClient.delete<ClassBooking>(
      `/marketplace/class-bookings/${bookingId}`,
    );
  },

  /** Org-side roster for one occurrence (VIEW_MEMBERS). */
  async getRoster(
    organizationId: string,
    classId: string,
    date: string,
  ): Promise<ApiResponse<ClassBooking[]>> {
    return apiClient.get<ClassBooking[]>(
      `/teams/organizations/${organizationId}/classes/${classId}/bookings?date=${date}`,
    );
  },
};

/** Next N occurrence dates ("YYYY-MM-DD") of a weekly class from today. */
export function nextOccurrences(dayOfWeek: number, count = 4): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midday avoids UTC-midnight rollover on slice
  while (out.length < count) {
    if (d.getDay() === dayOfWeek) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
