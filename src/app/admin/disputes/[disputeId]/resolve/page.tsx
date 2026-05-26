"use client";

import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { useState, use } from "react";

export default function AdminDisputeResolvePage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = use(params);
  void disputeId;

  const [selected, setSelected] = useState(1);

  const options = [
    { label: "Full refund to member", desc: "Iron Lab keeps nothing · platform absorbs fee", amount: "R 1,200" },
    { label: "50 / 50 split + UI fix", desc: "Recommended given the UI confusion · both parties get something", amount: "R 600 each" },
    { label: "Provider keeps in full", desc: "Cancellation falls inside policy window · member gets nothing", amount: "R 0" },
    { label: "Escalate to senior support", desc: "L2 reviewer takes over · 48h response", amount: "-" },
  ];

  return (
    <AdminDashboardShell activeItem="Disputes" crumb="Resolve">
      <h1 className="text-[28px] font-medium mb-4.5" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
        Resolve · DSP-2401
      </h1>

      <div style={{ maxWidth: 720 }}>
        <div className="rounded-[12px] p-[22px] mb-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Resolution</h3>

          <div className="flex flex-col gap-2 mb-4.5">
            {options.map((opt, i) => (
              <label
                key={opt.label}
                className="flex gap-3 p-[12px_14px] rounded-[8px] cursor-pointer"
                style={{
                  border: `1px solid ${selected === i ? "var(--ink)" : "var(--border)"}`,
                  background: selected === i ? "var(--bg-2)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="resolution"
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{opt.label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{opt.desc}</div>
                </div>
                <div className="font-mono text-[13px] whitespace-nowrap" style={{ color: "var(--ink)" }}>{opt.amount}</div>
              </label>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>
              Public message to both parties
            </div>
            <textarea
              className="w-full rounded-[8px] p-3 text-[13.5px] outline-none resize-y"
              style={{
                minHeight: 90,
                background: "var(--bg)",
                border: "1px solid var(--border-2)",
                font: "inherit",
              }}
              defaultValue="After review, we found the cancellation UI showed an incorrect notice value due to a reschedule timing issue. Splitting the difference seems most fair to both parties. We're patching the UI now to prevent this happening again."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2" onClick={() => history.back()}>Cancel</button>
          <button className="btn-primary-v2">Apply resolution &amp; close</button>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
