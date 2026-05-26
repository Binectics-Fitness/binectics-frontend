"use client";

import { useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

type FlagStatus = "on" | "partial" | "off" | "killed";

interface Flag {
  key: string;
  status: FlagStatus;
  pct: number;
  desc: string;
  owner: string;
  created: string;
  lastToggled: string;
  metric: string;
  metricColor: string;
  segments: string[];
  section: string;
}

const FLAGS: Flag[] = [
  {
    key: "checkin_v2_animation",
    status: "partial",
    pct: 25,
    desc: "New full-screen success animation when a member checks in at the gate. Replaces the toast.",
    owner: "Marcus T.",
    created: "14d ago",
    lastToggled: "6 min ago",
    metric: "Lift on retention + 2.1%",
    metricColor: "var(--signal-ink)",
    segments: ["ZA only", "iOS+Android", "Sticky · 14d"],
    section: "Member-facing",
  },
  {
    key: "marketplace_video_intro",
    status: "partial",
    pct: 50,
    desc: "Provider listings can have 30s video intros above the photo gallery.",
    owner: "Leila K.",
    created: "32d ago",
    lastToggled: "2d ago",
    metric: "CTR + 18% · TTI + 480ms",
    metricColor: "var(--signal-ink)",
    segments: ["ZA · NG · AE", "All clients", "Sticky · 7d"],
    section: "Member-facing",
  },
  {
    key: "ai_provider_summary",
    status: "on",
    pct: 100,
    desc: "Claude-generated 2-line summary at top of provider profiles, regenerated nightly.",
    owner: "Andile K.",
    created: "62d ago",
    lastToggled: "21d ago",
    metric: "Booking lift + 6.8%",
    metricColor: "var(--signal-ink)",
    segments: ["All countries", "EN · AR", "Ship · cleanup ready"],
    section: "Member-facing",
  },
  {
    key: "checkin_v1_legacy",
    status: "killed",
    pct: 0,
    desc: "Old toast-based check-in success. Killed 24h after v2 cutover.",
    owner: "Marcus T.",
    created: "",
    lastToggled: "",
    metric: "Replaced by v2 · Cleanup PR #4821",
    metricColor: "var(--fg-3)",
    segments: ["Force off · permanent"],
    section: "Member-facing",
  },
  {
    key: "plan_builder_ai_assist",
    status: "partial",
    pct: 10,
    desc: '"Generate week" button in the plan builder. Calls Claude on the trainer\'s template library.',
    owner: "Sarah O.",
    created: "5d ago",
    lastToggled: "1h ago",
    metric: "Plans / week + 0.9",
    metricColor: "var(--signal-ink)",
    segments: ["Trainers", "ZA · GB", "Cohort · > 20 clients"],
    section: "Provider-facing",
  },
  {
    key: "provider_payouts_daily",
    status: "on",
    pct: 100,
    desc: "Providers can opt into daily (vs weekly) payouts. +0.4% fee absorbed by provider.",
    owner: "Andile K.",
    created: "118d ago",
    lastToggled: "3 mo ago",
    metric: "Opt-in rate 14%",
    metricColor: "var(--fg-3)",
    segments: ["All providers", "Stripe-only rails"],
    section: "Provider-facing",
  },
  {
    key: "search_rerank_v3",
    status: "partial",
    pct: 5,
    desc: "New marketplace ranker: weights distance, response rate, completion. A/B against v2.",
    owner: "Marcus T.",
    created: "1d ago",
    lastToggled: "",
    metric: "Experiment EXP-2026-018 · Sig p < 0.04",
    metricColor: "var(--fg-3)",
    segments: ["Holdout · 5% control", "ZA only", "Day 1 · monitor"],
    section: "Platform / experiments",
  },
  {
    key: "mpesa_fallback_to_card",
    status: "off",
    pct: 0,
    desc: "When M-Pesa STK fails twice, auto-offer card. Currently disabled while we investigate Daraja timeouts.",
    owner: "Andile K.",
    created: "9d ago",
    lastToggled: "4h ago",
    metric: "Reason: Daraja P2 incident",
    metricColor: "oklch(0.45 0.16 75)",
    segments: ["KE only", "Waiting on incident close"],
    section: "Platform / experiments",
  },
];

const FILTERS = ["All", "On", "Partial", "Off", "Killed", "Experiments"];

function ToggleVisual({ status }: { status: FlagStatus }) {
  const bg =
    status === "on"
      ? "var(--ink)"
      : status === "partial"
        ? "oklch(0.65 0.18 75)"
        : "var(--bg-3)";
  const on = status === "on" || status === "partial";
  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        width: 44,
        height: 24,
        background: bg,
        borderRadius: 999,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          background: "var(--bg)",
          borderRadius: "50%",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

function StatusLabel({ status, pct }: { status: FlagStatus; pct: number }) {
  const styles: Record<string, { bg: string; color: string; border?: string }> = {
    on: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    partial: { bg: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    off: { bg: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" },
    killed: { bg: "var(--danger-soft)", color: "var(--danger)" },
  };
  const s = styles[status];
  const label =
    status === "on"
      ? `On · ${pct}%`
      : status === "partial"
        ? `Partial · ${pct}%`
        : status === "off"
          ? "Off"
          : "Killed";
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: s.bg,
        color: s.color,
        border: s.border,
      }}
    >
      {label}
    </span>
  );
}

export default function FeatureFlagsPage() {
  const [filter, setFilter] = useState("All");

  const sections = [...new Set(FLAGS.map((f) => f.section))];

  const filtered =
    filter === "All"
      ? FLAGS
      : FLAGS.filter((f) => {
          if (filter === "On") return f.status === "on";
          if (filter === "Partial") return f.status === "partial";
          if (filter === "Off") return f.status === "off";
          if (filter === "Killed") return f.status === "killed";
          if (filter === "Experiments") return f.key.includes("rerank") || f.key.includes("fallback");
          return true;
        });

  return (
    <AdminDashboardShell activeItem="Feature flags" crumb="Feature flags">
      <div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.022em",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Feature flags
        </h1>
        <div style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 6 }}>
          42 flags &middot; 18 in rollout &middot; changes go live in &lt;5s and
          audit every toggle
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active", value: "42", delta: "8 marked for cleanup" },
          { label: "In rollout", value: "18", delta: "3 with experiments" },
          { label: "Killed last 30d", value: "2", delta: "checkin_v1 · search_rerank_b", danger: true },
          { label: "Changes today", value: "14", delta: "8 by Marcus · 6 by Andile" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              padding: "14px 16px",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: kpi.danger ? "var(--danger)" : "var(--ink)",
                letterSpacing: "-0.018em",
                fontVariantNumeric: "tabular-nums",
                marginTop: 4,
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
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
            placeholder={'filter:flag_key  env:prod  rollout:>25%'}
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
      </div>

      {/* Flag cards grouped by section */}
      {sections.map((section) => {
        const sectionFlags = filtered.filter((f) => f.section === section);
        if (sectionFlags.length === 0) return null;
        return (
          <div key={section}>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "12px 4px 4px",
              }}
            >
              {section}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sectionFlags.map((flag) => (
                <div
                  key={flag.key}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-3)",
                    padding: "16px 18px",
                    cursor: "pointer",
                  }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_280px_80px] gap-4.5 items-center"
                >
                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <code
                        className="font-mono"
                        style={{
                          fontSize: 13.5,
                          color: "var(--ink)",
                          fontWeight: 600,
                          background: "var(--bg-2)",
                          padding: "2px 7px",
                          borderRadius: "var(--r-1)",
                        }}
                      >
                        {flag.key}
                      </code>
                      <StatusLabel status={flag.status} pct={flag.pct} />
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--fg-2)",
                        marginTop: 6,
                      }}
                    >
                      {flag.desc}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        display: "flex",
                        gap: 14,
                        marginTop: 8,
                        fontSize: 10.5,
                        color: "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        Owner &middot;{" "}
                        <strong
                          style={{ color: "var(--ink)", fontWeight: 500 }}
                        >
                          {flag.owner}
                        </strong>
                      </span>
                      {flag.created && (
                        <span>
                          Created &middot;{" "}
                          <strong
                            style={{ color: "var(--ink)", fontWeight: 500 }}
                          >
                            {flag.created}
                          </strong>
                        </span>
                      )}
                      {flag.lastToggled && (
                        <span>
                          Last toggled &middot;{" "}
                          <strong
                            style={{ color: "var(--ink)", fontWeight: 500 }}
                          >
                            {flag.lastToggled}
                          </strong>
                        </span>
                      )}
                      <span style={{ color: flag.metricColor }}>
                        {flag.metric}
                      </span>
                    </div>
                  </div>

                  {/* Rollout bar */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Rollout</span>
                      <span
                        style={{
                          color:
                            flag.status === "killed"
                              ? "var(--danger)"
                              : "var(--ink)",
                          fontWeight: 500,
                        }}
                      >
                        {flag.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "var(--bg-2)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width:
                            flag.status === "killed"
                              ? "100%"
                              : `${flag.pct}%`,
                          borderRadius: 4,
                          background:
                            flag.status === "killed"
                              ? "var(--danger)"
                              : flag.status === "partial"
                                ? "linear-gradient(90deg, var(--signal-ink), oklch(0.65 0.18 75))"
                                : "var(--ink)",
                        }}
                      />
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        display: "flex",
                        gap: 4,
                        fontSize: 9.5,
                        color: "var(--fg-3)",
                      }}
                    >
                      {flag.segments.map((seg) => (
                        <span
                          key={seg}
                          style={{
                            padding: "1px 5px",
                            background:
                              seg.includes("cleanup")
                                ? "var(--signal-soft)"
                                : seg.includes("Force off")
                                  ? "var(--danger-soft)"
                                  : seg.includes("monitor")
                                    ? "oklch(0.96 0.06 75)"
                                    : "var(--bg-2)",
                            color:
                              seg.includes("cleanup")
                                ? "var(--signal-ink)"
                                : seg.includes("Force off")
                                  ? "var(--danger)"
                                  : seg.includes("monitor")
                                    ? "oklch(0.45 0.16 75)"
                                    : undefined,
                            borderRadius: "var(--r-1)",
                          }}
                        >
                          {seg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Toggle or kill button */}
                  <div style={{ justifySelf: "end" }}>
                    {flag.status === "killed" ? (
                      <button
                        className="font-mono"
                        style={{
                          background: "var(--danger-soft)",
                          color: "var(--danger)",
                          fontSize: 10,
                          padding: "4px 8px",
                          borderRadius: "var(--r-1)",
                          border: 0,
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Delete
                      </button>
                    ) : (
                      <ToggleVisual status={flag.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </AdminDashboardShell>
  );
}
