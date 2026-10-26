/**
 * Class bookings API — public listing timetable + member booking flow +
 * org roster (backed by binectics-api feat/class-bookings).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { GymClass } from "./classes";
import { readCancellationPolicy, type ClassCancellationPolicy } from "@/lib/classes/cancellationPolicy";

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
  /** Why the gym cancelled it (status cancelled_by_gym), e.g. "Class removed by the gym". Null otherwise. */
  cancellation_reason?: string | null;
  /** Cancelled inside the gym's window while it had a fee: recorded, never charged by Binectics. */
  cancellation_fee_applied: boolean;
  /**
   * Live bookings only: the gym's class cancellation policy as it stands,
   * or null/absent when it has none (then no fee is mentioned).
   */
  cancellation_policy?: ClassCancellationPolicy | null;
  /**
   * Staff's record of whether the member came. Absent = not recorded (which
   * is not the same as a no-show). Set from the roster, never by the member.
   */
  attendance?: ClassAttendance;
  attendance_marked_at?: string;
  /** Roster rows only: the class has started, so attendance can be recorded. */
  attendance_open?: boolean;
  created_at: string;
  updated_at: string;
}

export type ClassAttendance = "attended" | "no_show";

/** A booking or waitlist place the gym cancelled (it deleted the class). */
export function isGymCancelled(b: Pick<ClassBooking, "status">): boolean {
  return b.status === "cancelled_by_gym";
}

/** What a member is told when the gym took the class off its timetable mid-booking. */
export const CLASS_REMOVED_MESSAGE =
  "The gym has just taken this class off its timetable, so it can't be booked.";

/**
 * The gym deleted (or switched off) the class while the booking was being
 * made (410 CLASS_REMOVED, binectics-api #270). Nothing is held.
 */
export function classWasRemoved(res: ApiResponse<unknown>): boolean {
  if (res.success) return false;
  return res.code === "CLASS_REMOVED" || res.status === 410;
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
  /**
   * Public weekly timetable for a listing, with the gym's class cancellation
   * policy beside it (null when it has none, and from an API before it).
   */
  async getListingClasses(
    listingId: string,
  ): Promise<ApiResponse<GymClass[]> & { cancellation_policy?: ClassCancellationPolicy | null }> {
    const res = await apiClient.get<GymClass[]>(
      `/marketplace/listings/${listingId}/classes`,
      false,
    );
    return { ...res, cancellation_policy: readCancellationPolicy(res.envelope?.cancellation_policy) };
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

  /**
   * The member's live bookings (`data`: confirmed and waitlisted) and,
   * apart from them, the ones the gym cancelled for an occurrence in the
   * last 14 days or still to come (`cancelled_by_gym`, binectics-api #270).
   * An API before that sends no second list; it reads as empty.
   */
  async getMyClassBookings(
    includePast = false,
  ): Promise<ApiResponse<ClassBooking[]> & { cancelled_by_gym?: ClassBooking[] }> {
    const query = includePast ? "?include_past=true" : "";
    const res = await apiClient.get<ClassBooking[]>(
      `/marketplace/my-class-bookings${query}`,
    );
    const raw = res.envelope?.cancelled_by_gym;
    return {
      ...res,
      // Only ever the gym's cancellations, whatever else a row claims.
      cancelled_by_gym: Array.isArray(raw)
        ? (raw as ClassBooking[]).filter(isGymCancelled)
        : [],
    };
  },

  async cancelClassBooking(
    bookingId: string,
  ): Promise<ApiResponse<ClassBooking>> {
    return apiClient.delete<ClassBooking>(
      `/marketplace/class-bookings/${bookingId}`,
    );
  },

  /**
   * Staff record (or, with null, clear) whether a confirmed booking attended
   * (bookings:manage). Data only: nothing is charged or sent to the member.
   */
  async setAttendance(
    organizationId: string,
    classId: string,
    bookingId: string,
    attendance: ClassAttendance | null,
  ): Promise<ApiResponse<ClassBooking>> {
    return apiClient.put<ClassBooking>(
      `/teams/organizations/${organizationId}/classes/${classId}/bookings/${bookingId}/attendance`,
      { attendance },
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
