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
export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  // Display-only on the page (the input is disabled and never submitted).
  email: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  fitnessGoals: z.array(z.string()),
  preferences: z.array(z.string()),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
