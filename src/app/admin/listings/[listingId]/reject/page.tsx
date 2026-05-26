"use client";

import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { useState, use } from "react";

export default function AdminListingRejectPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = use(params);
  void listingId;

  const [selected, setSelected] = useState(0);

  const reasons = [
    { label: "Missing / expired documents", desc: "Provider re-uploads · auto re-queue" },
    { label: "Photo quality below standard", desc: "Specific photos called out · provider replaces" },
    { label: "Misleading or unverified claims", desc: "Provider edits · re-submits" },
    { label: "Safety concern (medical · legal)", desc: "Escalates to senior reviewer · 48h hold" },
    { label: "Sanctions / restricted region", desc: "Hard reject · no re-submission" },
  ];

  return (
    <AdminDashboardShell activeItem="Listings" crumb="Reject">
      <h1 className="text-[28px] font-medium mb-4.5" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
        Reject · Aisha Adams
      </h1>

      <div style={{ maxWidth: 720 }}>
        <div className="rounded-[12px] p-[22px] mb-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Reason</h3>
          <div className="flex flex-col gap-2">
            {reasons.map((r, i) => (
              <label
                key={r.label}
                className="flex gap-3 p-[12px_14px] rounded-[8px] cursor-pointer"
                style={{
                  border: `1px solid ${selected === i ? "var(--ink)" : "var(--border)"}`,
                  background: selected === i ? "var(--bg-2)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{r.label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] p-[22px] mb-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Message to provider</h3>
          <textarea
            className="w-full rounded-[8px] p-3 text-[13.5px] outline-none resize-y"
            style={{
              minHeight: 120,
              background: "var(--bg)",
              border: "1px solid var(--border-2)",
              font: "inherit",
            }}
            defaultValue="Hi Aisha, your NASM cert is verified but page 2 of the liability insurance scan is unreadable. Please re-upload at a higher resolution (1200x1500 or above) and re-submit — we'll re-review within 24h."
          />
        </div>

        <div className="flex items-center gap-2 mt-3.5">
          <button className="btn-ghost-v2" onClick={() => history.back()}>Cancel</button>
          <button className="btn-primary-v2" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "oklch(0.98 0 0)" }}>
            Send rejection
          </button>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
