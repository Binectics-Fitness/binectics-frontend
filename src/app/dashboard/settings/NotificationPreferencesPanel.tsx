"use client";

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/queries/notifications";
import type { NotificationPreferences } from "@/lib/api/notifications";

type PreferenceKey = keyof NotificationPreferences;

type PreferenceRow = {
  label: string;
  sub: string;
  emailKey?: PreferenceKey;
  inAppKey?: PreferenceKey;
  smsEnabled?: boolean;
  emailLocked?: boolean;
};

const ROWS: PreferenceRow[] = [
  {
    label: "Booking confirmations",
    sub: "When a provider accepts",
    emailKey: "emailBookingConfirmations",
    inAppKey: "inAppBookings",
  },
  {
    label: "Session reminders",
    sub: "24h and 1h before",
    emailKey: "emailReminders",
    inAppKey: "inAppReminders",
  },
  {
    label: "Messages from providers",
    sub: "When a provider writes",
    inAppKey: "inAppMessages",
  },
  {
    label: "Payment receipts",
    sub: "Charges and refunds",
    emailKey: "emailPaymentReceipts",
    inAppKey: "inAppPayments",
  },
  {
    label: "Subscription updates",
    sub: "Created, expiring, and expired",
    emailKey: "emailSubscriptionUpdates",
    inAppKey: "inAppReminders",
  },
  {
    label: "Cancellations",
    sub: "Session or booking cancellations",
    emailKey: "emailCancellations",
    inAppKey: "inAppBookings",
  },
  {
    label: "Product promotions",
    sub: "Offers and product updates",
    emailKey: "emailPromotions",
    inAppKey: "inAppPromotions",
  },
  {
    label: "Newsletter",
    sub: "Platform news and highlights",
    emailKey: "emailNewsletter",
    inAppKey: "inAppPromotions",
  },
];

function Check({
  on,
  disabled,
  onClick,
  ariaLabel,
}: {
  on: boolean;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-4.5 w-4.5 items-center justify-center rounded-[4px]"
      style={{
        background: on ? "var(--ink)" : "var(--bg)",
        border: on ? "1px solid var(--ink)" : "1px solid var(--border-2)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      aria-pressed={on}
      aria-label={ariaLabel}
    >
      {on && (
        <span
          className="inline-block h-1.25 w-2"
          style={{
            borderLeft: "1.5px solid var(--bg)",
            borderBottom: "1.5px solid var(--bg)",
            transform: "rotate(-45deg) translateY(-1px)",
          }}
        />
      )}
    </button>
  );
}

export default function NotificationPreferencesPanel() {
  const prefsQuery = useNotificationPreferences(true);
  const updatePrefs = useUpdateNotificationPreferences();

  const prefs = prefsQuery.data;

  const toggleField = async (key: PreferenceKey, locked = false) => {
    if (!prefs || locked || updatePrefs.isPending) return;

    await updatePrefs.mutateAsync({
      [key]: !prefs[key],
    });

    await prefsQuery.refetch();
  };

  return (
    <section
      className="overflow-hidden rounded-(--r-3)"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      id="notifications"
    >
      <div className="px-5.5 pb-3.5 pt-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>
          Notifications
        </h2>
        <p className="mt-1 max-w-[56ch] text-[12.5px] leading-normal" style={{ color: "var(--fg-3)" }}>
          Choose delivery channels for alerts. Push maps to in-app notifications. SMS is visible for planning but not yet active.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5.5">
        <div className="overflow-x-auto rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
          <div
            className="grid items-center gap-3 px-4.5 py-2.5 font-mono text-[10.5px] uppercase"
            style={{
              gridTemplateColumns: "1.6fr repeat(3, 64px)",
              background: "var(--bg-2)",
              borderBottom: "1px solid var(--border)",
              letterSpacing: "0.04em",
              color: "var(--fg-3)",
            }}
          >
            <span>Notification</span>
            <span className="text-center">Email</span>
            <span className="text-center">Push</span>
            <span className="text-center">SMS</span>
          </div>

          {prefsQuery.isLoading ? (
            <div className="px-4.5 py-5 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              Loading notification preferences...
            </div>
          ) : !prefs ? (
            <div className="px-4.5 py-5 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              Could not load preferences right now.
            </div>
          ) : (
            ROWS.map((row, i) => {
              const emailOn = row.emailKey ? Boolean(prefs[row.emailKey]) : false;
              const inAppOn = row.inAppKey ? Boolean(prefs[row.inAppKey]) : false;
              const emailToggle = row.emailKey
                ? () => toggleField(row.emailKey as PreferenceKey, row.emailLocked)
                : undefined;
              const inAppToggle = row.inAppKey
                ? () => toggleField(row.inAppKey as PreferenceKey)
                : undefined;

              return (
                <div
                  key={row.label}
                  className="grid items-center gap-3 px-4.5 py-3"
                  style={{
                    gridTemplateColumns: "1.6fr repeat(3, 64px)",
                    borderBottom: i < ROWS.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div>
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {row.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
                      {row.sub}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Check
                      on={emailOn}
                      disabled={!row.emailKey || row.emailLocked || updatePrefs.isPending}
                      onClick={emailToggle}
                      ariaLabel={`${row.label} email`}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Check
                      on={inAppOn}
                      disabled={!row.inAppKey || updatePrefs.isPending}
                      onClick={inAppToggle}
                      ariaLabel={`${row.label} push`}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Check
                      on={Boolean(row.smsEnabled)}
                      disabled
                      ariaLabel={`${row.label} sms`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {updatePrefs.isError && (
          <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
            Could not save your latest change. Please try again.
          </p>
        )}

        <div className="flex justify-between gap-3.5 border-t border-border pt-4.5">
          <div className="flex-1">
            <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>
              Do not disturb between sessions
            </div>
            <div className="mt-0.75 max-w-[56ch] text-[12.5px] leading-normal" style={{ color: "var(--fg-3)" }}>
              Push notices can be paused by schedule in a follow-up release. Email remains active for critical updates.
            </div>
          </div>
          <Check on={false} disabled ariaLabel="Do not disturb" />
        </div>
      </div>
    </section>
  );
}
