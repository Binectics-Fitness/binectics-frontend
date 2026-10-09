import { z } from "zod";

// ─── Password Change ────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    new: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Notification Preferences ───────────────────────────────────

export const notificationPreferencesSchema = z.object({
  emailSubscriptionUpdates: z.boolean(),
  emailPaymentReceipts: z.boolean(),
  emailBookingConfirmations: z.boolean(),
  emailCancellations: z.boolean(),
  emailReminders: z.boolean(),
  emailNewsletter: z.boolean(),
  emailPromotions: z.boolean(),
  inAppBookings: z.boolean(),
  inAppPayments: z.boolean(),
  inAppMessages: z.boolean(),
  inAppReminders: z.boolean(),
  inAppPromotions: z.boolean(),
  inAppMilestones: z.boolean(),
  inAppNudges: z.boolean(),
});

export type NotificationPreferencesFormData = z.infer<
  typeof notificationPreferencesSchema
>;

// ─── Privacy Settings ───────────────────────────────────────────

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "private", "members"]),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showProgress: z.boolean(),
  allowActivityTracking: z.boolean(),
  allowPerformanceAnalytics: z.boolean(),
  shareDataWithProviders: z.boolean(),
  allowDirectMessages: z.boolean(),
  allowProviderMessages: z.boolean(),
  allowMarketingEmails: z.boolean(),
  shareWithThirdParties: z.boolean(),
  allowAnonymousData: z.boolean(),
});

export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;

// ─── Profile Settings ───────────────────────────────────────────

// Exactly the fields the profile settings page edits — no more. Leftover
// required fields with no matching input (the old facilities/specialties
// arrays) made zod fail EVERY submit, so Save silently never fired.
const DATE_OF_BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_OF_BIRTH_MIN = "1900-01-01";

/** Today in the viewer's local calendar, as 'YYYY-MM-DD'. */
export function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * The saved date of birth as the date input wants it: the first ten
 * characters of whatever the API sent ('YYYY-MM-DD' today; older sessions
 * may still hold an ISO timestamp in local storage). Never goes through a
 * Date, so the day can't drift with the viewer's timezone.
 */
export function dateOfBirthInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  // Display-only on the page (the input is disabled and never submitted).
  email: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  // A plain 'YYYY-MM-DD' day (what <input type="date"> yields), or "" for
  // none. Compared as strings, never parsed through a Date, so no timezone
  // can shift it a day.
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => !v || DATE_OF_BIRTH_RE.test(v), "Enter a date like 1990-05-15")
    .refine((v) => !v || v >= DATE_OF_BIRTH_MIN, "Enter a date after 1900")
    .refine((v) => !v || v <= todayYmd(), "Date of birth can't be in the future"),
  fitnessGoals: z.array(z.string()),
  preferences: z.array(z.string()),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
