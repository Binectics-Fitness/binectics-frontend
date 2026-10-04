import type { Tone } from "./tones";

/**
 * Which icon and tone a notification gets (same table as binectics-mobile
 * utils/notificationIcon.ts, so a notification looks the same on both).
 *
 * Keyed on the specific TYPE first: the API files care notifications (diet
 * plan assigned, program assigned, journal entries) under the `mention`
 * category, so a category-first mapper would render every one of them as a
 * message.
 *
 * Tone follows the rules in ./tones.ts:
 *  - success: confirmed, paid, accepted, approved, completed
 *  - warn: about to lapse, or a request waiting on this user's answer
 *  - danger: refused, rejected, suspended
 *  - a role accent only where the TYPE itself names the role: meal plans and
 *    logged meals are a dietitian's, workout plans and an assigned trainer a
 *    trainer's, check-ins a gym's. Programs, bookings and messages come from
 *    either kind of provider and the notification does not say which, so
 *    they stay neutral rather than guess.
 *  - neutral: everything else, including cancelled and expired, which are
 *    news, not failures.
 */
export type NotificationIconKey =
  | "meal"
  | "workout"
  | "program"
  | "journal"
  | "message"
  | "booking"
  | "payment"
  | "checkin"
  | "client"
  | "review"
  | "team"
  | "reward"
  | "verification"
  | "alert"
  | "bell";

const BY_TYPE: Record<string, { icon: NotificationIconKey; tone?: Tone }> = {
  DIET_PLAN_ASSIGNED: { icon: "meal", tone: "dietitian" },
  MEAL_LOGGED: { icon: "meal", tone: "dietitian" },
  WORKOUT_PLAN_ASSIGNED: { icon: "workout", tone: "trainer" },
  PROGRAM_ASSIGNED: { icon: "program" },
  PROGRAM_REMINDER: { icon: "program" },
  JOURNAL_ENTRY_ADDED: { icon: "journal" },

  BOOKING_CREATED: { icon: "booking" },
  BOOKING_CONFIRMED: { icon: "booking", tone: "success" },
  BOOKING_RESCHEDULED: { icon: "booking" },
  BOOKING_COMPLETED: { icon: "booking", tone: "success" },
  BOOKING_REMINDER: { icon: "booking" },
  BOOKING_CANCELLED: { icon: "booking" },

  SUBSCRIPTION_CREATED: { icon: "payment", tone: "success" },
  PAYMENT_RECEIVED: { icon: "payment", tone: "success" },
  SUBSCRIPTION_EXPIRING: { icon: "payment", tone: "warn" },
  SUBSCRIPTION_EXPIRED: { icon: "payment" },

  CLIENT_INVITATION: { icon: "client", tone: "warn" },
  CLIENT_REQUEST: { icon: "client", tone: "warn" },
  CLIENT_ACCEPTED: { icon: "client", tone: "success" },
  CLIENT_DEPARTED: { icon: "client" },
  MARKETPLACE_REQUEST_RECEIVED: { icon: "client", tone: "warn" },
  MARKETPLACE_REQUEST_ACCEPTED: { icon: "client", tone: "success" },
  MARKETPLACE_REQUEST_REJECTED: { icon: "client", tone: "danger" },
  MARKETPLACE_TRANSFER_REQUEST: { icon: "client", tone: "warn" },
  STAFF_CLIENT_ASSIGNED: { icon: "client" },
  TRAINER_ASSIGNED: { icon: "client", tone: "trainer" },

  REVIEW_RECEIVED: { icon: "review" },
  REVIEW_RESPONSE: { icon: "review" },

  TEAM_INVITATION: { icon: "team", tone: "warn" },
  TEAM_MEMBER_JOINED: { icon: "team" },
  TEAM_MEMBER_REMOVED: { icon: "team" },

  LOYALTY_POINTS_EARNED: { icon: "reward" },
  LOYALTY_REWARD_REDEEMED: { icon: "reward" },

  VERIFICATION_APPROVED: { icon: "verification", tone: "success" },
  VERIFICATION_REJECTED: { icon: "verification", tone: "danger" },

  SYSTEM_ANNOUNCEMENT: { icon: "alert" },
  ACCOUNT_SUSPENDED: { icon: "alert", tone: "danger" },
};

const BY_CATEGORY: Record<string, NotificationIconKey> = {
  booking: "booking",
  payment: "payment",
  mention: "message",
  system: "alert",
};

export function notificationIcon(input: {
  type?: string | null;
  category?: string | null;
}): { icon: NotificationIconKey; tone: Tone } {
  const byType = input.type ? BY_TYPE[input.type.toUpperCase()] : undefined;
  if (byType) return { icon: byType.icon, tone: byType.tone ?? "neutral" };
  const type = (input.type ?? "").toLowerCase();
  if (type.includes("message")) return { icon: "message", tone: "neutral" };
  if (type.includes("check_in") || type.includes("checkin")) return { icon: "checkin", tone: "gym" };
  const byCategory = input.category ? BY_CATEGORY[input.category.toLowerCase()] : undefined;
  return { icon: byCategory ?? "bell", tone: "neutral" };
}

/** Just the tone, for callers that draw their own icon. */
export function notificationTone(input: { type?: string | null; category?: string | null }): Tone {
  return notificationIcon(input).tone;
}
