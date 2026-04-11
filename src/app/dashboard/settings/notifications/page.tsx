"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesFormData,
} from "@/lib/schemas/settings";
import {
  notificationsService,
  type NotificationPreferences,
} from "@/lib/api/notifications";

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { watch, setValue, handleSubmit, reset } =
    useForm<NotificationPreferencesFormData>({
      resolver: zodResolver(notificationPreferencesSchema),
      defaultValues: {
        emailSubscriptionUpdates: true,
        emailPaymentReceipts: true,
        emailBookingConfirmations: true,
        emailCancellations: true,
        emailReminders: true,
        emailNewsletter: false,
        emailPromotions: false,
        inAppBookings: true,
        inAppPayments: true,
        inAppMessages: true,
        inAppReminders: true,
        inAppPromotions: false,
      },
    });

  const loadPreferences = useCallback(async () => {
    try {
      const res = await notificationsService.getPreferences();
      if (res.success && res.data) {
        reset(res.data as NotificationPreferencesFormData);
      }
    } catch {
      // Use defaults on failure
    } finally {
      setIsLoadingPrefs(false);
    }
  }, [reset]);

  useEffect(() => {
    if (!user) return;
    loadPreferences();
  }, [user, loadPreferences]);

  const notifications = watch();

  const handleToggle = (key: keyof NotificationPreferencesFormData) => {
    setValue(key, !notifications[key]);
  };

  const onSave = async (data: NotificationPreferencesFormData) => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await notificationsService.updatePreferences(
        data as Partial<NotificationPreferences>,
      );
      if (res.success) {
        setSuccessMessage("Notification preferences saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(res.message || "Failed to save preferences.");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  if (isLoadingPrefs) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border-2 border-primary-500 bg-primary-50 p-4 text-primary-900">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Email Notifications */}
      <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <svg
            className="w-6 h-6 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Email Notifications
          </h3>
        </div>
        <div className="space-y-4">
          <NotificationToggle
            label="Subscription Updates"
            description="Receive emails about subscription renewals and expirations"
            checked={notifications.emailSubscriptionUpdates}
            onChange={() => handleToggle("emailSubscriptionUpdates")}
          />
          <NotificationToggle
            label="Payment Receipts"
            description="Get email confirmations for all payments"
            checked={notifications.emailPaymentReceipts}
            onChange={() => handleToggle("emailPaymentReceipts")}
          />
          <NotificationToggle
            label="Booking Confirmations"
            description="Receive confirmation emails when bookings are made"
            checked={notifications.emailBookingConfirmations}
            onChange={() => handleToggle("emailBookingConfirmations")}
          />
          <NotificationToggle
            label="Cancellation Notices"
            description="Get notified when bookings or subscriptions are cancelled"
            checked={notifications.emailCancellations}
            onChange={() => handleToggle("emailCancellations")}
          />
          <NotificationToggle
            label="Reminders"
            description="Receive reminder emails for upcoming sessions and renewals"
            checked={notifications.emailReminders}
            onChange={() => handleToggle("emailReminders")}
          />
          <NotificationToggle
            label="Newsletter"
            description="Stay updated with Binectics news and fitness tips"
            checked={notifications.emailNewsletter}
            onChange={() => handleToggle("emailNewsletter")}
          />
          <NotificationToggle
            label="Promotional Offers"
            description="Receive special offers and discounts from providers"
            checked={notifications.emailPromotions}
            onChange={() => handleToggle("emailPromotions")}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="rounded-xl bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <svg
            className="w-6 h-6 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            In-App Notifications
          </h3>
        </div>
        <div className="space-y-4">
          <NotificationToggle
            label="Booking Updates"
            description="Get notified about new bookings, confirmations, and changes"
            checked={notifications.inAppBookings}
            onChange={() => handleToggle("inAppBookings")}
          />
          <NotificationToggle
            label="Payment & Subscription Alerts"
            description="Receive notifications for payments and subscription events"
            checked={notifications.inAppPayments}
            onChange={() => handleToggle("inAppPayments")}
          />
          <NotificationToggle
            label="Messages & Activity"
            description="Client requests, team invitations, reviews, and plan assignments"
            checked={notifications.inAppMessages}
            onChange={() => handleToggle("inAppMessages")}
          />
          <NotificationToggle
            label="Reminders"
            description="Upcoming session and subscription expiry reminders"
            checked={notifications.inAppReminders}
            onChange={() => handleToggle("inAppReminders")}
          />
          <NotificationToggle
            label="Promotional Updates"
            description="Special offers and promotions from providers"
            checked={notifications.inAppPromotions}
            onChange={() => handleToggle("inAppPromotions")}
          />
        </div>
        <div className="mt-4 rounded-lg border border-accent-blue-200 bg-accent-blue-50 p-4">
          <p className="text-sm text-foreground/70">
            <span className="font-semibold">Note:</span> System-critical
            notifications (verification updates, account status) are always
            delivered and cannot be disabled.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={handleSubmit(onSave)}
          disabled={isSaving}
          className="w-full rounded-lg bg-primary-500 px-8 py-3 font-semibold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

// Toggle Component
function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 pr-2">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-foreground/60 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 self-start cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:self-auto ${
          checked ? "bg-primary-500" : "bg-neutral-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
