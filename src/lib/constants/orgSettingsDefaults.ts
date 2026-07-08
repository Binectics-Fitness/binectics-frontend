import type {
  BookingRules,
  KioskSettings,
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
  cancellation_fee_percent: 50,
  cancellation_window_hours: 24,
  allow_video_recording: true,
  public_reviews: true,
  booking_lead_time_hours: 0,
  no_show_policy: "none",
  waitlist_enabled: false,
};

export const DEFAULT_KIOSK_SETTINGS: KioskSettings = {
  qr_checkin_from_phones: true,
  success_animation: true,
  auto_sleep: true,
  idle_seconds: 60,
  voice_announcement: false,
};

export const DEFAULT_PAYOUT_SCHEDULE: PayoutSchedule = {
  frequency: "weekly",
  payout_day: 1, // Monday
  minimum_payout_amount: 0,
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
