import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans",
  description: "Create and manage membership plans for your gym.",
};

/**
 * Plans & pricing — gym-plans.html prototype.
 * KPI strip, plan table with grip handles, toggle visibility, promo codes.
 */

const KPIS = [
  { label: "Active subscribers", value: "1,243", delta: "+ 38 this month" },
  { label: "Most picked", value: "Studio · monthly", small: true, delta: "562 members" },
  { label: "Highest LTV", value: "Pro · annual", small: true, delta: "R 14.2k avg" },
  { label: "Promo redemptions", value: "182", delta: "↑ 28% MoM" },
];

const PLANS = [
  { name: "Studio · monthly", pill: "Most picked", desc: "Unlimited 5am–10pm · 1 location · group classes included · auto‑renew", price: "R 850", per: "/ month", members: "562 active", on: true },
  { name: "Pro · monthly", desc: "24/7 access · all 4 locations · 1 free PT session / month · guest passes × 2", price: "R 1,200", per: "/ month", members: "214 active", on: true },
  { name: "Pro · annual", desc: "10 months for 12 · 24/7 access · 1 free PT session / month · 6 guest passes", price: "R 12,000", per: "/ year", members: "142 active", on: true },
  { name: "Studio · 24‑pack", desc: "24 session block · 4‑month window · no auto‑renew · group classes included", price: "R 18,400", per: "/ pack", members: "86 active", on: true },
  { name: "Day pass", desc: "Single visit · all amenities · 24/7 access · no commitment", price: "R 180", per: "once", members: "214 / mo", on: true },
  { name: "Student · monthly", desc: "5am–10pm · 1 location · proof of enrolment required · ID at check‑in", price: "R 480", per: "/ month", members: "182 active", on: true },
  { name: "Corporate · 10‑seat", desc: "Discounted rate for teams of 10+ · invoiced quarterly · paused since Feb", price: "R 6,800", per: "/ month", members: "0 active", on: false },
];

const PROMOS = [
  { name: "First month free", code: "WELCOME01", meta: "82 redeemed · unlimited · new members only" },
  { name: "Bring a friend · 50% off", code: "REFER50", meta: "48 redeemed · 1 per member · 30‑day window" },
  { name: "Student summer", code: "SUMMER25", meta: "38 redeemed · expires 31 Aug 2026 · student plan only" },
  { name: "Comeback offer", code: "MISSEDU", meta: "14 redeemed · 6+ months churned · 90 days at R 480/mo" },
];

function Grip() {
  return (
    <span className="flex flex-col gap-0.5 cursor-grab" style={{ color: "var(--fg-4)" }}>
      <span className="w-2.5 h-0.5 rounded-sm bg-current" />
      <span className="w-2.5 h-0.5 rounded-sm bg-current" />
    </span>
  );
}

function More() {
  return (
    <span className="w-6 h-6 rounded-(--r-1) flex items-center justify-center cursor-pointer hover:bg-bg-2" style={{ color: "var(--fg-3)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
    </span>
  );
}

export default function GymPlansPage() {
  return (
    <GymDashboardShell
      activeItem="Plans & pricing"
      crumb="Plans & pricing"
      actions={
        <>
          <button className="btn-ghost-v2 sm">Promo codes</button>
          <Link href="/dashboard/gym-owner/plans/create" className="btn-primary-v2 sm">+ New plan</Link>
        </>
      }
    >
      {/* Page head */}
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Plans & pricing</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>7 active plans · 4 promo codes running · drag to reorder how members see them on your profile</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium mt-1.5 ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Plans table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Membership plans</h3>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Toggle off to hide from your profile · existing members keep their plan</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid gap-4.5 px-5.5 py-2.75 font-mono text-[10.5px] uppercase tracking-[0.04em] min-w-[800px]" style={{ gridTemplateColumns: "20px 1fr 200px 130px 100px 90px", background: "var(--bg-2)", color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>
            <span /><span>Plan</span><span>Price</span><span>Members</span><span>Visible</span><span />
          </div>

          {/* Rows */}
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`grid gap-4.5 px-5.5 py-4 items-center hover:bg-bg-2 min-w-[800px] ${!p.on ? "opacity-55" : ""}`}
              style={{ gridTemplateColumns: "20px 1fr 200px 130px 100px 90px", borderBottom: i < PLANS.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}
            >
              <Grip />
              <div>
                <div className="text-[14.5px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>
                  {p.name}
                  {p.pill && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-(--r-1) ml-1.5 align-[1px]" style={{ background: "var(--ink)", color: "var(--bg)" }}>{p.pill}</span>}
                </div>
                <div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)" }}>{p.desc}</div>
              </div>
              <div className="font-mono text-[16px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {p.price} <small className="font-mono text-[11px] font-normal" style={{ color: "var(--fg-3)" }}>{p.per}</small>
              </div>
              <div className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{p.members}</div>
              <span className="w-[30px] h-[18px] rounded-full relative cursor-pointer" style={{ background: p.on ? "var(--ink)" : "var(--border-2)" }}>
                <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: p.on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
              </span>
              <More />
            </div>
          ))}
        </div>
      </div>

      {/* Promo codes */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Promo codes</h3>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>4 active · auto‑expire after redemption limit hits</div>
          </div>
          <button className="btn-ghost-v2 sm">+ New code</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4.5">
          {PROMOS.map((pr) => (
            <div key={pr.name} className="p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{pr.name}</div>
              <span className="inline-block font-mono text-[12px] px-2 py-0.5 rounded-(--r-1) mt-1.5" style={{ color: "var(--ink)", background: "var(--bg-2)" }}>{pr.code}</span>
              <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-2" style={{ color: "var(--fg-3)" }}>{pr.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </GymDashboardShell>
  );
}
