'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [notifications, setNotifications] = useState({
    // Email Notifications
    emailSubscriptionUpdates: true,
    emailPaymentReceipts: true,
    emailBookingConfirmations: true,
    emailCancellations: true,
    emailReminders: true,
    emailNewsletter: false,
    emailPromotions: false,

    // Push Notifications
    pushBookings: true,
    pushPayments: true,
    pushMessages: true,
    pushReminders: true,
    pushPromotions: false,

    // SMS Notifications
    smsBookingReminders: false,
    smsPaymentAlerts: false,
    smsUrgentOnly: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage('Notification preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-primary-50 border-2 border-primary-500 text-primary-900 rounded-lg p-4">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Email Notifications</h3>
        </div>
        <div className="space-y-4">
          <NotificationToggle
            label="Subscription Updates"
            description="Receive emails about subscription renewals and expirations"
            checked={notifications.emailSubscriptionUpdates}
            onChange={() => handleToggle('emailSubscriptionUpdates')}
          />
          <NotificationToggle
            label="Payment Receipts"
            description="Get email confirmations for all payments"
            checked={notifications.emailPaymentReceipts}
            onChange={() => handleToggle('emailPaymentReceipts')}
          />
          <NotificationToggle
            label="Booking Confirmations"
            description="Receive confirmation emails when bookings are made"
            checked={notifications.emailBookingConfirmations}
            onChange={() => handleToggle('emailBookingConfirmations')}
          />
          <NotificationToggle
            label="Cancellation Notices"
            description="Get notified when bookings or subscriptions are cancelled"
            checked={notifications.emailCancellations}
            onChange={() => handleToggle('emailCancellations')}
          />
          <NotificationToggle
            label="Reminders"
            description="Receive reminder emails for upcoming sessions and renewals"
            checked={notifications.emailReminders}
            onChange={() => handleToggle('emailReminders')}
          />
          <NotificationToggle
            label="Newsletter"
            description="Stay updated with Binectics news and fitness tips"
            checked={notifications.emailNewsletter}
            onChange={() => handleToggle('emailNewsletter')}
          />
          <NotificationToggle
            label="Promotional Offers"
            description="Receive special offers and discounts from providers"
            checked={notifications.emailPromotions}
            onChange={() => handleToggle('emailPromotions')}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Push Notifications</h3>
        </div>
        <div className="space-y-4">
          <NotificationToggle
            label="Booking Updates"
            description="Get notified about new bookings and changes"
            checked={notifications.pushBookings}
            onChange={() => handleToggle('pushBookings')}
          />
          <NotificationToggle
            label="Payment Alerts"
            description="Receive notifications for payment transactions"
            checked={notifications.pushPayments}
            onChange={() => handleToggle('pushPayments')}
          />
          <NotificationToggle
            label="Messages"
            description="Get notified when you receive new messages"
            checked={notifications.pushMessages}
            onChange={() => handleToggle('pushMessages')}
          />
          <NotificationToggle
            label="Reminders"
            description="Push notifications for upcoming sessions"
            checked={notifications.pushReminders}
            onChange={() => handleToggle('pushReminders')}
          />
          <NotificationToggle
            label="Promotional Updates"
            description="Receive push notifications for special offers"
            checked={notifications.pushPromotions}
            onChange={() => handleToggle('pushPromotions')}
          />
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">SMS Notifications</h3>
        </div>
        <div className="space-y-4">
          <NotificationToggle
            label="Booking Reminders"
            description="Get SMS reminders 24 hours before your sessions"
            checked={notifications.smsBookingReminders}
            onChange={() => handleToggle('smsBookingReminders')}
          />
          <NotificationToggle
            label="Payment Alerts"
            description="Receive SMS notifications for payment confirmations"
            checked={notifications.smsPaymentAlerts}
            onChange={() => handleToggle('smsPaymentAlerts')}
          />
          <NotificationToggle
            label="Urgent Notifications Only"
            description="Only receive SMS for urgent matters (cancellations, important updates)"
            checked={notifications.smsUrgentOnly}
            onChange={() => handleToggle('smsUrgentOnly')}
          />
        </div>
        <div className="mt-4 p-4 bg-accent-blue-50 border border-accent-blue-200 rounded-lg">
          <p className="text-sm text-foreground/70">
            <span className="font-semibold">Note:</span> Standard SMS rates may apply depending on your carrier.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
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
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-foreground/60 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
