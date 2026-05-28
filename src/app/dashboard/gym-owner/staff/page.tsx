"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddStaffModal } from "@/components/ds/modals/AddStaffModal";

interface StaffMeta { k: string; v: string; warn?: boolean }

const STAFF: { init: string; name: string; role: string; avaType: "trainer" | "dietitian" | "front"; meta: StaffMeta[]; status: string; statusColor: string; statusBg: string; locs: string }[] = [
  { init: "SO", name: "Sarah Okafor", role: "Trainer · CSCS", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "68" }, { k: "Rating", v: "4.9 · 312" }, { k: "Joined", v: "Mar 2024" }, { k: "Cert renewal", v: "Mar 2028" }], status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", locs: "Sea Point · Foreshore" },
  { init: "TM", name: "Themba Mokoena", role: "Trainer · USAW L2", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "54" }, { k: "Rating", v: "4.8 · 192" }, { k: "Joined", v: "Jun 2024" }, { k: "Cert renewal", v: "14 Jun 2026", warn: true }], status: "Cert due · 27 days", statusColor: "var(--danger)", statusBg: "var(--danger-soft)", locs: "Sea Point" },
  { init: "MB", name: "Marcus Bell", role: "Trainer · mobility", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "42" }, { k: "Rating", v: "4.9 · 142" }, { k: "Joined", v: "Aug 2024" }, { k: "Cert renewal", v: "Jul 2027" }], status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", locs: "Camps Bay" },
  { init: "TN", name: "Thandi Nkosi", role: "Trainer · postnatal", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "28" }, { k: "Rating", v: "5.0 · 64" }, { k: "Joined", v: "Jan 2025" }, { k: "Cert renewal", v: "Jan 2027" }], status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", locs: "Foreshore · Sea Point" },
  { init: "CK", name: "Coach K (Khanyi)", role: "Trainer · NSCA", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "71" }, { k: "Rating", v: "4.8 · 218" }, { k: "Joined", v: "Sep 2024" }, { k: "Cert renewal", v: "02 Jun 2026", warn: true }], status: "Cert due · 15 days", statusColor: "var(--danger)", statusBg: "var(--danger-soft)", locs: "Sea Point" },
  { init: "NH", name: "Dr Nadia Hassan", role: "Dietitian · RD", avaType: "dietitian" as const, meta: [{ k: "Consults · MTD", v: "22" }, { k: "Rating", v: "4.9 · 84" }, { k: "Joined", v: "Feb 2025" }, { k: "License renewal", v: "Sep 2027" }], status: "Away · back Wed", statusColor: "oklch(0.42 0.13 75)", statusBg: "var(--trainer-soft)", locs: "Foreshore · Online" },
  { init: "PM", name: "Pamela Mthembu", role: "Front desk · manager", avaType: "front" as const, meta: [{ k: "Shifts · MTD", v: "18" }, { k: "Check‑ins", v: "2,418" }, { k: "Joined", v: "Apr 2024" }, { k: "Role scope", v: "Members + payouts" }], status: "Active · on shift", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", locs: "Sea Point" },
  { init: "DV", name: "Dineo van Wyk", role: "Front desk", avaType: "front" as const, meta: [{ k: "Shifts · MTD", v: "14" }, { k: "Check‑ins", v: "1,684" }, { k: "Joined", v: "Aug 2025" }, { k: "Role scope", v: "Members only" }], status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", locs: "Woodstock" },
  { init: "OB", name: "Olu Bankole", role: "Trainer · Olympic", avaType: "trainer" as const, meta: [{ k: "Sessions · MTD", v: "38" }, { k: "Rating", v: "4.9 · 96" }, { k: "Joined", v: "Nov 2024" }, { k: "Cert renewal", v: "22 Jun 2026", warn: true }], status: "Cert due · 35 days", statusColor: "var(--danger)", statusBg: "var(--danger-soft)", locs: "Foreshore" },
];

const AVA_STYLES: Record<string, { bg: string; color: string }> = {
  trainer: { bg: "var(--trainer)", color: "oklch(0.2 0.05 75)" },
  dietitian: { bg: "var(--dietitian)", color: "oklch(0.95 0 0)" },
  front: { bg: "var(--gym)", color: "oklch(0.98 0 0)" },
};

export default function GymStaffPage() {
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  return (
    <GymDashboardShell
      activeItem="Staff"
      crumb="Staff"
      actions={
        <>
          <button className="btn-ghost-v2 sm">Invite link</button>
          <button className="btn-primary-v2 sm" onClick={() => setAddStaffOpen(true)}>+ Add staff</button>
        </>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Staff</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>22 active across 4 locations · 3 cert renewals due in next 30 days</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total staff", value: "22", delta: "+ 2 this quarter" },
          { label: "Coaches", value: "18", delta: "3 PRs in May" },
          { label: "Cert renewals", value: "3", warn: true, delta: "Due in 30 days" },
          { label: "Utilization", value: "82%", delta: "↑ 4 pts MoM" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[26px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: k.warn ? "oklch(0.45 0.16 75)" : "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: k.warn ? "oklch(0.45 0.16 75)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3.5 p-3.5 rounded-(--r-3) flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-70" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>Search by name or certification…</span>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {[
            { label: "All", count: "22", on: true },
            { label: "Coaches", count: "18" },
            { label: "Front desk", count: "3" },
            { label: "Manager", count: "1" },
            { label: "Cert due", count: "3" },
          ].map((p) => (
            <span key={p.label} className={`inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer shrink-0 border ${p.on ? "bg-ink border-ink" : "bg-bg border-border"}`} style={{ color: p.on ? "var(--bg)" : "var(--fg-3)" }}>
              {p.label} <span style={{ color: p.on ? "oklch(0.75 0.005 85)" : "var(--fg-4)" }}>{p.count}</span>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button className="btn-ghost-v2 sm">Filter</button>
          <button className="btn-ghost-v2 sm">Sort</button>
        </div>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {STAFF.map((s) => {
          const ava = AVA_STYLES[s.avaType];
          return (
            <div key={s.init} className="rounded-(--r-3) overflow-hidden cursor-pointer" style={{ background: "var(--bg)", border: "1px solid var(--border)", transition: "border-color var(--motion-fast) var(--ease)" }}>
              {/* Head row */}
              <div className="flex items-center gap-3.5 px-5 py-4.5">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0" style={{ background: ava.bg, color: ava.color }}>{s.init}</span>
                <div className="flex-1">
                  <div className="text-[15px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{s.name}</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{s.role}</div>
                </div>
                <span className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                </span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 px-5 pb-3.5">
                {s.meta.map((m) => (
                  <div key={m.k}>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{m.k}</div>
                    <div className="text-[12.5px] font-medium mt-0.5" style={{ color: m.warn ? "oklch(0.45 0.16 75)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                <span className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: s.statusColor, background: s.statusBg }}>
                  <span className="w-1.25 h-1.25 rounded-full bg-current" />{s.status}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.locs}</span>
              </div>
            </div>
          );
        })}
      </div>
      <AddStaffModal open={addStaffOpen} onClose={() => setAddStaffOpen(false)} />
    </GymDashboardShell>
  );
}
