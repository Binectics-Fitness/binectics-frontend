"use client";

import {
  usePrivacyPreferences,
  useUpdatePrivacyPreferences,
} from "@/lib/queries/privacy";
import type { PrivacyPreferences, ProfileVisibility } from "@/lib/api/auth";

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  label: string;
  sub: string;
}> = [
  {
    value: "public",
    label: "Public",
    sub: "Anyone browsing the marketplace can view your profile.",
  },
  {
    value: "members",
    label: "Members only",
    sub: "Only signed-in members and providers you work with.",
  },
  {
    value: "private",
    label: "Private",
    sub: "Hidden everywhere except to gyms you hold a membership with.",
  },
];

const TOGGLE_ROWS: Array<{
  key: keyof Pick<
    PrivacyPreferences,
    | "shareProgressWithProviders"
    | "showRealNameOnReviews"
    | "allowUsageAnalytics"
  >;
  label: string;
  sub: string;
}> = [
  {
    key: "shareProgressWithProviders",
    label: "Share my progress with my providers",
    sub: "Weight and workout logs, visible only to trainers and dietitians you actively work with.",
  },
  {
    key: "showRealNameOnReviews",
    label: "Show my real name on reviews",
    sub: "Off means reviews you write appear with an abbreviated surname (e.g. “Tunde A.”).",
  },
  {
    key: "allowUsageAnalytics",
    label: "Let Binectics use my activity to improve the product",
    sub: "Usage analytics only. Never sold or shared with third parties.",
  },
];

function Toggle({
  on,
  disabled,
  onClick,
  ariaLabel,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={ariaLabel}
      className="relative h-4.5 w-7.5 shrink-0 rounded-full"
      style={{
        background: on ? "var(--ink)" : "var(--border-2)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="absolute top-0.5 h-3.5 w-3.5 rounded-full"
        style={{
          background: "var(--bg)",
          left: on ? "14px" : "2px",
          transition: "left var(--motion-fast) var(--ease)",
        }}
      />
    </button>
  );
}

export default function PrivacySettingsPage() {
  const prefsQuery = usePrivacyPreferences();
  const updatePrefs = useUpdatePrivacyPreferences();
  const prefs = prefsQuery.data;

  const save = (payload: Partial<PrivacyPreferences>) => {
    if (updatePrefs.isPending) return;
    void updatePrefs.mutateAsync(payload);
  };

  if (prefsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-2 border-t-ink" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="rounded-(--r-2) border border-border bg-bg-2 p-4 text-sm text-fg-2">
        Could not load your privacy settings.{" "}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => void prefsQuery.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile visibility */}
      <div className="rounded-xl bg-bg p-4 border border-border sm:p-6">
        <h3 className="mb-1 text-lg font-bold text-ink sm:text-xl">
          Profile visibility
        </h3>
        <p className="mb-4 text-sm text-fg-2">
          Who can see your member profile. Changes save immediately.
        </p>
        <div role="radiogroup" aria-label="Profile visibility" className="space-y-2">
          {VISIBILITY_OPTIONS.map((opt) => {
            const on = prefs.profileVisibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={updatePrefs.isPending}
                onClick={() => !on && save({ profileVisibility: opt.value })}
                className="flex w-full items-start gap-3 rounded-(--r-2) p-3.5 text-left"
                style={{
                  border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                  background: on ? "var(--bg-2)" : "var(--bg)",
                  cursor: updatePrefs.isPending ? "wait" : "pointer",
                }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ border: on ? "5px solid var(--ink)" : "1px solid var(--border-2)", background: "var(--bg)" }}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-normal text-fg-3">{opt.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sharing toggles */}
      <div className="rounded-xl bg-bg p-4 border border-border sm:p-6">
        <h3 className="mb-1 text-lg font-bold text-ink sm:text-xl">Sharing</h3>
        <p className="mb-2 text-sm text-fg-2">
          What you share, and with whom. Changes save immediately.
        </p>
        {TOGGLE_ROWS.map((row, i) => (
          <div
            key={row.key}
            className="flex items-start justify-between gap-4 py-3.5"
            style={{
              borderBottom:
                i < TOGGLE_ROWS.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">{row.label}</div>
              <div className="mt-0.5 max-w-[56ch] text-[12.5px] leading-normal text-fg-3">
                {row.sub}
              </div>
            </div>
            <Toggle
              on={prefs[row.key]}
              disabled={updatePrefs.isPending}
              onClick={() => save({ [row.key]: !prefs[row.key] })}
              ariaLabel={row.label}
            />
          </div>
        ))}
        {updatePrefs.isError && (
          <p className="mt-3 text-[12.5px]" style={{ color: "var(--danger)" }}>
            Could not save your change. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
