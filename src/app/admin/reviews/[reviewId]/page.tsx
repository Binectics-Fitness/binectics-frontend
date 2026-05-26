import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import React from "react";

export default function AdminSingleReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = React.use(params);
  void reviewId;

  return (
    <AdminDashboardShell
      activeItem="Reviews"
      crumb="RVW-2026-008"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Keep public</button>
          <button className="btn-ghost-v2">Hide</button>
          <button className="btn-primary-v2" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "oklch(0.98 0 0)" }}>
            Remove
          </button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Review · flagged for moderation
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Iron Lab · posted 2 days ago · flagged by 3 providers
        </p>
      </div>

      {/* Review card */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Review content */}
        <div className="flex gap-4.5 items-start mb-4.5">
          <div
            className="w-12 h-12 rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 30), oklch(0.72 0.06 50))" }}
          />
          <div className="flex-1">
            <div className="flex gap-2.5 items-baseline">
              <strong className="text-[14px]" style={{ color: "var(--ink)" }}>Mike Khumalo</strong>
              <span style={{ color: "oklch(0.65 0.18 75)", letterSpacing: 1 }}>{"★★"}</span>
              <span className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)" }}>
                2 days ago · Iron Lab Sea Point
              </span>
            </div>
            <p className="text-[14px] leading-relaxed mt-2" style={{ color: "var(--fg-2)" }}>
              &ldquo;This place is a SCAM. The staff are racist. The owner [redacted in moderation] should be in jail. Don&apos;t believe the fake reviews — they&apos;re paid by the gym.&rdquo;
            </p>
          </div>
        </div>

        {/* Auto-moderation alert */}
        <div
          className="p-[14px_16px] rounded-[8px] mb-4.5 flex gap-2.5 items-start"
          style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.88 0.05 25)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.7" className="mt-0.5 shrink-0">
            <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <div className="text-[13px]">
            <strong style={{ color: "var(--ink)" }}>Auto-moderation triggers:</strong> 2 flags · racism accusation (unsubstantiated) · personal attack on owner (named person, defamatory) · accusation of bribery without evidence
          </div>
        </div>

        {/* Reporters table */}
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {[
              { reporter: "Reporter 1", from: "Iron Lab (owner)", reason: "\"Personal attack and false claims about staff behaviour\"" },
              { reporter: "Reporter 2", from: "Sarah Okafor (trainer)", reason: "\"Defamatory · I work here and this isn't true\"" },
              { reporter: "Reporter 3", from: "Thandi Nkosi (trainer)", reason: "\"Personal attack on owner by name\"" },
            ].map((r) => (
              <tr key={r.reporter}>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.reporter}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.from}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Member context */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Member context</h3>
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "Account", val: "Mike Khumalo · 14 months · 18 bookings · 1 prior dispute (declined)" },
              { label: "Plan status", val: "Cancelled monthly subscription 3 days before review · refund denied" },
              { label: "Pattern", val: "Posted 4 negative reviews in 5 days across different gyms" },
            ].map((r) => (
              <tr key={r.label}>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

