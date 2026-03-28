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
  pushBookings: z.boolean(),
  pushPayments: z.boolean(),
  pushMessages: z.boolean(),
  pushReminders: z.boolean(),
  pushPromotions: z.boolean(),
  smsBookingReminders: z.boolean(),
  smsPaymentAlerts: z.boolean(),
  smsUrgentOnly: z.boolean(),
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

export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  country: z.string().optional(),
  businessName: z.string().optional(),
  businessRegistration: z.string().optional(),
  gymName: z.string().optional(),
  gymAddress: z.string().optional(),
  gymCity: z.string().optional(),
  gymDescription: z.string().optional(),
  facilities: z.array(z.string()),
  bio: z.string().optional(),
  specialties: z.array(z.string()),
  certifications: z.array(z.string()),
  experience: z.string().optional(),
  fitnessGoals: z.array(z.string()),
  preferences: z.array(z.string()),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
