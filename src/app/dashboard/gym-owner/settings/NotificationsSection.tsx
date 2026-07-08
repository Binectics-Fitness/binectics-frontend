"use client";

import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgNotificationSettings,
  useUpdateOrgNotificationSettings,
} from "@/lib/queries/teams";
import {
  ORG_NOTIFICATION_EVENTS,
  ORG_NOTIFICATION_CHANNELS,
} from "@/lib/api/teams";

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
};

/**
 * Org-level notification matrix: 7 events × email/SMS/push. Each cell saves
 * immediately (partial PATCH — only the flipped toggle is sent).
 */
export function NotificationsSection() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: settings, isLoading } = useOrgNotificationSettings(orgId);
  const update = useUpdateOrgNotificationSettings(orgId);

  const fieldFor = (channel: string, eventKey: string) =>
    `${channel}${eventKey}`;

  const valueOf = (channel: string, eventKey: string): boolean => {
    const v = settings?.[fieldFor(channel, eventKey)];
    // Server defaults: email on, SMS/push off — mirror while loading.
    return typeof v === "boolean" ? v : channel === "email";
  };

  const flip = (channel: string, eventKey: string) => {
    if (!settings) return;
    void update.mutateAsync({
      [fieldFor(channel, eventKey)]: !valueOf(channel, eventKey),
    });
  };

  return (
    <section id="notifications">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Notifications</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        Which channels your organization uses per event. Individual staff control their own in-app preferences.
      </p>
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="grid items-center gap-2 px-5.5 py-2.5" style={{ gridTemplateColumns: "1fr repeat(3, 56px)", borderBottom: "1px solid var(--border)" }}>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Event</span>
          {ORG_NOTIFICATION_CHANNELS.map((c) => (
            <span key={c} className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-center" style={{ color: "var(--fg-3)" }}>{CHANNEL_LABELS[c]}</span>
          ))}
        </div>
        {ORG_NOTIFICATION_EVENTS.map((ev, i) => (
          <div key={ev.key} className="grid items-center gap-2 px-5.5 py-3" style={{ gridTemplateColumns: "1fr repeat(3, 56px)", borderBottom: i < ORG_NOTIFICATION_EVENTS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div>
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{ev.label}</div>
              <div className="text-[12.5px] mt-0.75 leading-relaxed" style={{ color: "var(--fg-3)" }}>{ev.desc}</div>
            </div>
            {ORG_NOTIFICATION_CHANNELS.map((channel) => {
              const on = valueOf(channel, ev.key);
              return (
                <div key={channel} className="flex justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${CHANNEL_LABELS[channel]} for ${ev.label}`}
                    disabled={isLoading || !settings}
                    onClick={() => flip(channel, ev.key)}
                    className="w-[30px] h-[18px] rounded-full relative cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: on ? "var(--ink)" : "var(--border-2)", border: "none", padding: 0 }}
                  >
                    <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {update.isError && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger, #b00020)" }}>Couldn&rsquo;t save that change — try again.</p>
      )}
    </section>
  );
}
