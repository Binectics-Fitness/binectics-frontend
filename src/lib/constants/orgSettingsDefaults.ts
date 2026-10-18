import type {
  BookingRules,
  PayoutSchedule,
} from "@/lib/api/teams";

/**
 * Defaults shown (and saved on first edit) when an org hasn't configured a
 * settings sub-object yet. Mirror the long-standing settings-page mockup so
 * existing orgs see no visual change until they actually save.
 */

export const DEFAULT_BOOKING_RULES: BookingRules = {
  auto_confirm: true,
  require_parq: true,
  // No fee until the gym sets one: the API reads an org without booking
  // rules as having none, and members are shown exactly that.
  cancellation_fee_percent: 0,
  cancellation_window_hours: 0,
  cancellation_policy_note: "",
  allow_video_recording: true,
  public_reviews: true,
  booking_lead_time_hours: 0,
  no_show_policy: "none",
  waitlist_enabled: false,
};

export const DEFAULT_PAYOUT_SCHEDULE: PayoutSchedule = {
  frequency: "weekly",
  payout_day: 1, // Monday
  minimum_payout_amount_minor: 0,
  hold_period_days: 0,
};

export const PAYOUT_WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
