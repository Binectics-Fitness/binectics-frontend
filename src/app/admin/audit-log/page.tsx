"use client";

import { useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

interface AuditRow {
  time: string;
  sev: "info" | "warn" | "alert" | "ok";
  actor: string;
  actorType: "admin" | "system";
  event: React.ReactNode;
  expandable?: boolean;
  expandContent?: React.ReactNode;
}

const SEV_STYLES: Record<string, { bg: string; color: string; border?: string }> = {
  info: { bg: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)" },
  warn: { bg: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
  alert: { bg: "var(--danger-soft)", color: "var(--danger)" },
  ok: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
};

const FILTERS = ["All", "Money", "PII", "Roles", "Flags", "Auth", "Tickets"];

const EVENTS: AuditRow[] = [
  {
    time: "18:42:18.412", sev: "info", actor: "andile@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>user.bypass_qr</span> <span style={{ color: "var(--fg-2)" }}>USR_412884</span> &middot; gate device <span style={{ color: "var(--fg-2)" }}>DEV_IL_SP_03</span> <span style={{ color: "var(--fg-3)", fontSize: 11 }}>(SUP-2026-04841)</span></>,
  },
  {
    time: "18:41:02.118", sev: "alert", actor: "system", actorType: "system",
    event: <><span style={{ color: "var(--brand)" }}>fraud.flag</span> <span style={{ color: "var(--fg-2)" }}>USR_412884 [Reza M.]</span> <span style={{ color: "var(--danger)" }}>refund_velocity = 11 / 30d</span> <span style={{ color: "var(--fg-3)", fontSize: 11 }}>→ queued for review</span></>,
  },
  {
    time: "18:38:44.291", sev: "warn", actor: "sara.l@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>refund.approve</span> <span style={{ color: "var(--fg-2)" }}>REF-2026-04835</span> <span style={{ color: "var(--fg-3)", fontSize: 11 }}>no-show &middot; Lagos Lift Club</span> <span style={{ color: "var(--signal-ink)" }}>+ ₦ 28,000</span></>,
    expandable: true,
    expandContent: (
      <div style={{ color: "var(--fg-2)" }}>
        Reason: &quot;Provider failed to respond within 48h SLA. Auto-favor member per policy P-04.&quot; &middot; IP 41.220.18.4 &middot; session sess_3OqL18_3914
        <pre style={{ background: "var(--ink)", color: "oklch(0.85 0.005 85)", padding: "10px 14px", borderRadius: "var(--r-2)", overflow: "auto", fontSize: 11, marginTop: 6 }}>
{`{
  "ref_id": "REF-2026-04835",
  "amount_cents": 2800000,
  "currency": "NGN",
  "member": "USR_098124",
  "provider": "USR_044118",
  "policy_applied": "P-04",
  "ledger_entry": "LE_2026_184422"
}`}
        </pre>
      </div>
    ),
  },
  {
    time: "18:32:18.882", sev: "info", actor: "marcus.t@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>flag.toggle</span> <span style={{ color: "var(--fg-2)" }}>checkin_v2_animation</span> <span style={{ color: "var(--signal-ink)" }}>on &middot; ZA / 25% rollout</span></>,
  },
  {
    time: "18:28:02.118", sev: "alert", actor: "andile@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>user.suspend</span> <span style={{ color: "var(--fg-2)" }}>USR_008242 [Fitness Republic]</span> <span style={{ color: "var(--fg-3)", fontSize: 11 }}>stolen card &middot; 4 disputed txns</span></>,
  },
  {
    time: "18:24:41.018", sev: "warn", actor: "stripe-webhook", actorType: "system",
    event: <><span style={{ color: "var(--brand)" }}>payment.chargeback</span> <span style={{ color: "var(--fg-2)" }}>PI_3OqL08</span> <span style={{ color: "var(--danger)" }}>−€ 89.00</span> &middot; CrossPower Stuttgart <span style={{ color: "var(--fg-3)", fontSize: 11 }}>reason: service_not_described</span></>,
  },
  {
    time: "18:18:08.412", sev: "info", actor: "sara.l@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>user.role_change</span> <span style={{ color: "var(--fg-2)" }}>USR_018421 [Sarah Okafor]</span> &middot; <span style={{ color: "var(--signal-ink)" }}>+ verified_trainer</span></>,
  },
  {
    time: "18:12:44.291", sev: "ok", actor: "payout-cron", actorType: "system",
    event: <><span style={{ color: "var(--brand)" }}>payout.run</span> &middot; <span style={{ color: "var(--signal-ink)" }}>812 recipients, $ 642k queued for 18:00 UTC batch</span></>,
  },
  {
    time: "18:08:18.118", sev: "info", actor: "marcus.t@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>listing.approve</span> <span style={{ color: "var(--fg-2)" }}>LST_008812</span> &middot; BridgeFit Pretoria &middot; <span style={{ color: "var(--fg-3)", fontSize: 11 }}>photos + documents OK</span></>,
  },
  {
    time: "18:02:11.882", sev: "alert", actor: "andile@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>data.export</span> <span style={{ color: "var(--fg-2)" }}>USR_022941 [Dr Nadia Hassan]</span> &middot; <span style={{ color: "var(--fg-3)", fontSize: 11 }}>GDPR Art. 20 portability request</span></>,
  },
  {
    time: "17:58:02.412", sev: "warn", actor: "stripe-webhook", actorType: "system",
    event: <><span style={{ color: "var(--brand)" }}>payment.failed</span> <span style={{ color: "var(--fg-2)" }}>PI_3OqL12</span> &middot; 3DS challenge timeout &middot; € 89.00 &middot; DE</>,
  },
  {
    time: "17:54:18.291", sev: "info", actor: "leila.k@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>policy.update</span> <span style={{ color: "var(--fg-2)" }}>P-04 cancellation_grace</span> &middot; <span style={{ color: "var(--danger)" }}>24h → 33h notice</span> <span style={{ color: "var(--fg-3)", fontSize: 11 }}>ZA only</span></>,
  },
  {
    time: "17:48:08.118", sev: "info", actor: "marcus.t@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>listing.reject</span> <span style={{ color: "var(--fg-2)" }}>LST_008809</span> &middot; &quot;Iron Garage NSP&quot; &middot; <span style={{ color: "var(--fg-3)", fontSize: 11 }}>insurance certificate missing</span></>,
  },
  {
    time: "17:42:44.412", sev: "ok", actor: "reconcile", actorType: "system",
    event: <><span style={{ color: "var(--brand)" }}>ledger.reconcile</span> &middot; <span style={{ color: "var(--signal-ink)" }}>All gateways &middot; 4,184 txns &middot; Δ $ 0.00</span></>,
  },
  {
    time: "17:38:02.882", sev: "info", actor: "andile@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>impersonate.start</span> <span style={{ color: "var(--fg-2)" }}>USR_098124 [Halima D.]</span> &middot; <span style={{ color: "var(--fg-3)", fontSize: 11 }}>ticket SUP-2026-04832</span></>,
  },
  {
    time: "17:33:18.018", sev: "info", actor: "andile@binectics", actorType: "admin",
    event: <><span style={{ color: "var(--brand)" }}>impersonate.end</span> <span style={{ color: "var(--fg-2)" }}>USR_098124</span> &middot; <span style={{ color: "var(--fg-3)", fontSize: 11 }}>read-only &middot; 4m 48s &middot; 0 writes</span></>,
  },
];

export default function AuditLogPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(2);
  const [filter, setFilter] = useState("All");

  return (
    <AdminDashboardShell activeItem="Audit log" crumb="Audit log">
      <div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.022em",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Audit log
        </h1>
        <div style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 6 }}>
          Immutable record of every privileged action on production. Streaming
          &middot; 14,824 events in last 24h &middot; queryable up to 7 years.
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          padding: "12px 16px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 280,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 12px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-2)",
            background: "var(--bg-2)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="var(--fg-3)"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            defaultValue="actor:admin AND action:user.suspend"
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              fontSize: 13,
              outline: "none",
              fontFamily: "ui-monospace, monospace",
              color: "var(--ink)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono"
              style={{
                padding: "5px 10px",
                fontSize: 10.5,
                color: filter === f ? "var(--bg)" : "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                border:
                  filter === f
                    ? "1px solid var(--ink)"
                    : "1px solid var(--border)",
                background: filter === f ? "var(--ink)" : "var(--bg)",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--fg-2)",
            padding: "6px 10px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            borderRadius: "var(--r-2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          Last 24h
        </div>
      </div>

      {/* Feed */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          overflow: "hidden",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        <div className="overflow-x-auto">
        {EVENTS.map((row, i) => {
          const sevS = SEV_STYLES[row.sev];
          const isExpanded = expandedIdx === i && row.expandable;
          return (
            <div
              key={i}
              style={{
                borderBottom:
                  i < EVENTS.length - 1
                    ? "1px solid var(--border)"
                    : undefined,
                background: isExpanded ? "var(--bg-2)" : undefined,
              }}
            >
              <div
                onClick={() =>
                  row.expandable &&
                  setExpandedIdx(expandedIdx === i ? null : i)
                }
                className="grid grid-cols-[144px_80px_200px_1fr_24px] gap-4 min-w-[700px]"
                style={{
                  padding: "11px 18px",
                  alignItems: "baseline",
                  cursor: row.expandable ? "pointer" : "default",
                }}
              >
                <span style={{ color: "var(--fg-3)" }}>{row.time}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    padding: "2px 6px",
                    borderRadius: "var(--r-1)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "inline-block",
                    textAlign: "center",
                    background: sevS.bg,
                    color: sevS.color,
                    border: sevS.border,
                  }}
                >
                  {row.sev.charAt(0).toUpperCase() + row.sev.slice(1)}
                </span>
                <span
                  style={{
                    color:
                      row.actorType === "admin"
                        ? "oklch(0.42 0.13 75)"
                        : "var(--fg-3)",
                    fontWeight: row.actorType === "admin" ? 600 : 400,
                    fontStyle:
                      row.actorType === "system" ? "italic" : undefined,
                  }}
                >
                  {row.actor}
                </span>
                <span style={{ color: "var(--ink)" }}>{row.event}</span>
                <span
                  style={{
                    color: "var(--fg-3)",
                    textAlign: "right",
                  }}
                >
                  ›
                </span>
              </div>
              {isExpanded && row.expandContent && (
                <div
                  style={{
                    padding: "0 18px 14px",
                    borderTop: "1px dashed var(--border)",
                    marginTop: 0,
                  }}
                >
                  <div style={{ paddingTop: 10 }}>{row.expandContent}</div>
                </div>
              )}
            </div>
          );
        })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 18px",
            color: "var(--fg-3)",
            fontSize: 11,
            textAlign: "center",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>Streaming &middot; 14,824 events in last 24h</span>
          <span style={{ display: "flex", gap: 12 }}>
            <span>‹ Newer</span>
            <span style={{ color: "var(--ink)" }}>Page 1 of 624</span>
            <span>Older ›</span>
          </span>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
