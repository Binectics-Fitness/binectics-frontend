import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Platform overview with key metrics, activity, and alerts.",
};

/**
 * Admin console — Platform overview
 * Hardcoded to match admin.html prototype.
 * Uses AdminDashboardShell for the dark sidebar chrome.
 */

function I({ d, children }: { d?: string; children?: React.ReactNode }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d ? <path d={d} /> : children}</svg>;
}

const STATS = [
  { l: "GMV · 30d", v: "$ 4.82M", d: "↑ 18.2%" },
  { l: "Active providers", v: "12,408", d: "+ 312 net" },
  { l: "Active members", v: "418,260", d: "↑ 6.4%" },
  { l: "Pending listings", v: "38", d: "12 over SLA", down: true },
  { l: "Disputes · open", v: "7", d: "+ 2 today", down: true },
  { l: "Take rate · blended", v: "8.6", suffix: "%", d: "↑ 0.2 pts" },
];

interface CheckItem { t: string; ok?: boolean; warn?: boolean; x?: boolean; }
interface Approval { ph: string; name: string; loc: string; badge: string; badgeCls: string; checks: CheckItem[]; age: string; }

const APPROVALS: Approval[] = [
  { ph: "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 8px, oklch(0.93 0.012 248) 8px 16px)", name: "Strathmore Strength Co.", loc: "Gym · Nairobi, KE · submitted by James M.", badge: "Gym", badgeCls: "gym", checks: [{ ok: true, t: "Business reg verified (KRA #X29481)" }, { ok: true, t: "Photos · 18 uploaded" }, { warn: true, t: "Insurance · expires in 22 days" }, { ok: true, t: "Address match · Google & Maps" }], age: "⚠ 5h over SLA · queued 18h ago" },
  { ph: "repeating-linear-gradient(135deg, oklch(0.92 0.012 75) 0 8px, oklch(0.94 0.01 75) 8px 16px)", name: "Olufemi Adesanya", loc: "Trainer · Lagos, NG · NASM L2", badge: "Trainer", badgeCls: "trainer", checks: [{ ok: true, t: "ID verified (BVN match)" }, { ok: true, t: "NASM certification · current" }, { ok: true, t: "References · 3 / 3 confirmed" }, { warn: true, t: "Profile photo · low resolution" }], age: "2h ago · within SLA" },
  { ph: "repeating-linear-gradient(135deg, oklch(0.90 0.018 300) 0 8px, oklch(0.93 0.014 300) 8px 16px)", name: "Dr. Hyun‑woo Park, RD", loc: "Dietitian · Seoul, KR · KDA member", badge: "Dietitian", badgeCls: "dietitian", checks: [{ ok: true, t: "License · KDA #114‑829‑003" }, { ok: true, t: "ID verified · passport" }, { ok: true, t: "Insurance · valid through 2027" }, { x: true, t: "Translation · awaiting EN docs" }], age: "12h ago · 4h to SLA" },
  { ph: "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 8px, oklch(0.93 0.012 248) 8px 16px)", name: "CrossPower Stuttgart", loc: "Gym · Stuttgart, DE · 2 locations", badge: "Gym", badgeCls: "gym", checks: [{ ok: true, t: "Handelsregister · HRB 47291" }, { ok: true, t: "USt‑IdNr verified" }, { warn: true, t: "2nd location · photos missing" }, { ok: true, t: "GDPR DPA accepted" }], age: "22h ago · over SLA ⚠" },
];

const FRAUD = [
  { severity: "high", signal: "Stolen card", init: "FR", avatarBg: "oklch(0.94 0.03 25)", avatarColor: "var(--danger)", entity: "Fitness Republic, Mumbai", id: "PRV_8242 · 14 charges in 9 min", country: "IN", score: "94", scoreColor: "var(--danger)", detected: "12m ago", actions: [{ label: "Investigate", type: "ghost" }, { label: "Freeze", type: "danger" }] },
  { severity: "high", signal: "Identity mismatch", init: "DK", entity: '"Daniel Kane" trainer profile', id: "PRV_8198 · selfie ≠ ID", country: "UK", score: "88", scoreColor: "var(--danger)", detected: "38m ago", actions: [{ label: "Investigate", type: "ghost" }, { label: "Suspend", type: "danger" }] },
  { severity: "med", signal: "Refund abuse", init: "RM", entity: "Member · Reza M.", id: "USR_412884 · 11 refunds / 30d", country: "AE", score: "71", scoreColor: "var(--warn)", detected: "2h ago", actions: [{ label: "Review", type: "ghost" }, { label: "Limit", type: "ghost" }] },
  { severity: "med", signal: "Velocity", init: "P2", entity: "Provider · IP cluster 41.21.x", id: "8 sign‑ups · same device hash", country: "ZA", score: "68", scoreColor: "var(--warn)", detected: "4h ago", actions: [{ label: "Review", type: "ghost" }] },
  { severity: "low", signal: "Review pattern", init: "AB", entity: "Apex Body, Manila", id: "14 ★ 5 reviews · 24h window", country: "PH", score: "42", scoreColor: "var(--fg-3)", detected: "6h ago", actions: [{ label: "Review", type: "ghost" }] },
];

const COUNTRIES = [
  { code: "ZA · ZAR", name: "South Africa", w: "100%", gmv: "$ 1.24M", gw: "Paystack" },
  { code: "NG · NGN", name: "Nigeria", w: "72%", gmv: "$ 894k", gw: "Paystack" },
  { code: "KE · KES", name: "Kenya", w: "58%", gmv: "$ 718k", gw: "M‑Pesa" },
  { code: "GB · GBP", name: "United Kingdom", w: "50%", gmv: "$ 624k", gw: "Stripe" },
  { code: "AE · AED", name: "UAE", w: "44%", gmv: "$ 548k", gw: "Stripe · Tabby" },
  { code: "IN · INR", name: "India", w: "36%", gmv: "$ 442k", gw: "Razorpay" },
  { code: "DE · EUR", name: "Germany", w: "24%", gmv: "$ 298k", gw: "Stripe" },
  { code: "PH · PHP", name: "Philippines", w: "16%", gmv: "$ 196k", gw: "GCash · PayMongo" },
];

const DISPUTES = [
  { id: "DSP_2401", member: "Pier Botha", provider: "Iron Lab · Sea Point", reason: "Service not provided · cancelled session", amt: "R 1,200", opened: "2h ago", owner: "AK", ownerName: "Andile K.", status: "Awaiting provider", statusColor: "var(--warn)" },
  { id: "DSP_2398", member: "Aman R.", provider: "Apex Body · Manila", reason: "Refund denied · ToS section 4.2", amt: "₱ 3,400", opened: "9h ago", owner: "NJ", ownerName: "Nikhil J.", status: "In review", statusColor: "var(--fg-2)" },
  { id: "DSP_2394", member: "Card holder · ••• 4421", provider: "CrossPower Stuttgart", reason: "Stripe chargeback · code 4855", amt: "€ 89.00", opened: "1d ago", owner: "AK", ownerName: "Andile K.", status: "Evidence due 36h", statusColor: "var(--danger)" },
  { id: "DSP_2391", member: "Halima D.", provider: "Lagos Lift Club", reason: "Trainer no‑show · 2 sessions", amt: "₦ 28,000", opened: "1d ago", owner: "FA", ownerName: "Farah A.", status: "In review", statusColor: "var(--fg-2)" },
  { id: "DSP_2387", member: "Wei Chen", provider: "Velo Cycling Club", reason: "Plan downgrade not applied", amt: "R 380", opened: "2d ago", owner: "NJ", ownerName: "Nikhil J.", status: "Resolved · pending close", statusColor: "var(--signal-ink)", signal: true },
];

const SEVERITY_COLOR: Record<string, string> = { high: "var(--danger)", med: "var(--warn)", low: "var(--fg-3)" };
const BADGE_CLS: Record<string, React.CSSProperties> = {
  gym: { background: "var(--gym-soft)", border: "1px solid oklch(0.88 0.04 248)", color: "var(--gym)" },
  trainer: { background: "var(--trainer-soft)", border: "1px solid oklch(0.88 0.05 75)", color: "oklch(0.45 0.12 75)" },
  dietitian: { background: "var(--dietitian-soft)", border: "1px solid oklch(0.88 0.04 300)", color: "var(--dietitian)" },
};

/* ═══ PAGE ═══ */

export default function AdminDashboard() {
  const headerActions = (
    <div className="flex items-center gap-2.5 text-[12px]" style={{ color: "var(--fg-3)" }}>
      {/* Health */}
      <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1.25 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />
        <span style={{ color: "var(--ink)" }}>All systems normal</span>
        <span> · 99.97% uptime · p95 142ms</span>
      </div>
      <button className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }} aria-label="Notifications"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0"/></svg></button>
      <button className="btn-ghost-v2 sm hidden sm:inline-flex">Impersonate user</button>
    </div>
  );

  return (
    <AdminDashboardShell activeItem="Overview" crumb="Overview" actions={headerActions}>
          {/* Head */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Platform overview</h1>
              <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Mon · May 11 · 14:22 SAST — moderation, payments, and country health</div>
            </div>
            <div className="inline-flex h-8 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Global", "Africa", "MEA", "EU", "APAC", "AMER"].map((r, i) => (
                <span key={r} className={`px-3 flex items-center text-[12.5px] font-mono cursor-pointer ${i < 5 ? "border-r" : ""}`} style={{ color: r === "Global" ? "var(--bg)" : "var(--fg-2)", background: r === "Global" ? "var(--ink)" : "transparent", borderColor: "var(--border)", letterSpacing: "0.02em" }}>{r}</span>
              ))}
            </div>
          </div>

          {/* Stats — 6 cols */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATS.map((s) => (
              <div key={s.l} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.l}</div>
                <div className="text-[22px] font-medium" style={{ letterSpacing: "-0.018em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}{s.suffix && <small className="font-mono text-[11px] font-normal ml-[3px]" style={{ color: "var(--fg-3)" }}>{s.suffix}</small>}</div>
                <div className="font-mono text-[11px]" style={{ color: s.down ? "var(--danger)" : "var(--signal-ink)" }}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* Approval queue */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Provider listings · approval queue</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>38 awaiting · sorted by SLA · oldest first</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost-v2 sm">Bulk actions</button>
                <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Full queue →</span>
              </div>
            </div>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5 px-4.5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
              {[
                { label: "All", count: "38", on: true },
                { label: "Gyms", count: "14" },
                { label: "Trainers", count: "19" },
                { label: "Dietitians", count: "5" },
                { label: "Over SLA", count: "12", danger: true },
              ].map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1.5 h-6.5 px-2.5 rounded-full text-[12px] cursor-pointer" style={{ border: `1px solid ${c.danger ? "var(--danger)" : c.on ? "var(--ink)" : "var(--border)"}`, background: c.on ? "var(--ink)" : "var(--bg)", color: c.danger ? "var(--danger)" : c.on ? "var(--bg)" : "var(--fg-2)" }}>
                  {c.label} <span className="font-mono text-[10.5px]" style={{ color: c.on ? "oklch(0.85 0.005 85)" : "var(--fg-4)" }}>{c.count}</span>
                </span>
              ))}
              <div className="ml-auto flex gap-1.5">
                <span className="inline-flex items-center h-6.5 px-2.5 rounded-full text-[12px]" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>Region: Global</span>
                <span className="inline-flex items-center h-6.5 px-2.5 rounded-full text-[12px]" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>Sort: Oldest</span>
              </div>
            </div>
            {/* Approval cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4.5">
              {APPROVALS.map((a) => (
                <div key={a.name} className="flex gap-3.5 p-3.5 rounded-(--r-3)" style={{ border: "1px solid var(--border)" }}>
                  <div className="w-20 h-20 shrink-0 rounded-(--r-2)" style={{ background: a.ph, border: "1px solid var(--border)" }} />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>{a.name}</div>
                        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{a.loc}</div>
                      </div>
                      <span className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={BADGE_CLS[a.badgeCls]}>{a.badge}</span>
                    </div>
                    <div className="flex flex-col gap-[3px] font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>
                      {a.checks.map((ck, j) => (
                        <div key={j} className="flex items-center gap-1.5">
                          <span className="w-[9px] h-[9px] rounded-sm flex items-center justify-center shrink-0" style={{
                            background: ck.warn ? "var(--warn)" : ck.x ? "var(--bg)" : "var(--signal)",
                            border: ck.x ? "1px solid var(--border-2)" : `1px solid ${ck.warn ? "var(--warn)" : "var(--signal)"}`,
                          }}>
                            {ck.ok && <span className="w-[5px] h-[2px] border-l-[1.4px] border-b-[1.4px] -rotate-45 -translate-y-[1px]" style={{ borderColor: "var(--bg)" }} />}
                            {ck.warn && <span className="text-[8px] font-bold leading-none" style={{ color: "var(--bg)" }}>!</span>}
                            {ck.x && <span className="w-1.5 h-px" style={{ background: "var(--fg-4)" }} />}
                          </span>
                          {ck.t}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{a.age}</span>
                      <div className="flex gap-1">
                        <button className="btn-ghost-v2 sm" style={{ padding: "4px 10px", fontSize: "12px" }}>Review</button>
                        <button className="btn-signal-v2" style={{ height: "28px", padding: "0 10px", fontSize: "12px" }}>Approve</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud + Countries — 1.5fr 1fr */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 items-start">
            {/* Fraud table */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Fraud &amp; risk signals</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Auto‑flagged · ranked by score</div>
                </div>
                <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Open full feed →</span>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {["Signal", "Entity", "Country", "Score", "Detected", "Action"].map((h, i) => (
                      <th key={h} className={`text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] px-4.5 py-2.5 ${i === 5 ? "text-right pr-4.5" : ""}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FRAUD.map((f, i) => (
                    <tr key={i} className="hover:bg-bg-2">
                      <td className="px-4.5 py-3 align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: SEVERITY_COLOR[f.severity] }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                          {f.signal}
                        </span>
                      </td>
                      <td className="px-4.5 py-3 align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: f.avatarBg || "var(--bg-3)", color: f.avatarColor || "var(--fg-2)" }}>{f.init}</span>
                          <div>
                            <div>{f.entity}</div>
                            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{f.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4.5 py-3 font-mono text-[11.5px] align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)" }}>{f.country}</td>
                      <td className="px-4.5 py-3 font-mono align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none", color: f.scoreColor }}>{f.score}</td>
                      <td className="px-4.5 py-3 font-mono text-[11.5px] align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)" }}>{f.detected}</td>
                      <td className="px-4.5 py-3 text-right align-middle" style={{ borderBottom: i < FRAUD.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div className="flex gap-1.5 justify-end">
                          {f.actions.map((a) => (
                            a.type === "danger"
                              ? <button key={a.label} className="h-7 px-2.5 rounded-(--r-2) text-[12px] font-medium" style={{ background: "var(--danger)", color: "oklch(0.98 0 0)" }}>{a.label}</button>
                              : <button key={a.label} className="btn-ghost-v2 sm">{a.label}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Countries */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Top countries · GMV 30d</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>52 countries live · 8 currencies</div>
                </div>
                <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>All →</span>
              </div>
              {COUNTRIES.map((c, i) => (
                <div key={c.code} className="grid gap-3 px-4.5 py-2.5 items-center text-[13px]" style={{ gridTemplateColumns: "100px 1fr 80px 60px", borderBottom: i < COUNTRIES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span className="font-mono text-[11px] tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{c.code}</span>
                  <span style={{ color: "var(--ink)" }}>
                    {c.name}
                    <div className="h-1 rounded-sm overflow-hidden mt-1" style={{ background: "var(--bg-3)" }}><div className="h-full" style={{ width: c.w, background: "var(--ink)" }} /></div>
                  </span>
                  <span className="font-mono text-[12px] text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.gmv}</span>
                  <span className="font-mono text-[10.5px] text-right" style={{ color: "var(--fg-3)" }}>{c.gw}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disputes */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Open disputes</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>7 active · response SLA 24h</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[{ l: "All", n: "7" }, { l: "Member ↔ Provider", n: "5" }, { l: "Gateway chargeback", n: "2" }].map((c) => (
                  <span key={c.l} className="inline-flex items-center gap-1.5 h-6.5 px-2.5 rounded-full text-[12px]" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>
                    {c.l} <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>{c.n}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["ID", "Member", "Provider", "Reason", "Amount", "Opened", "Owner", "Status"].map((h, i) => (
                    <th key={h} className={`text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] px-4.5 py-2.5 ${i >= 4 ? "text-right" : ""} ${i === 7 ? "pr-4.5" : ""}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISPUTES.map((d, i) => (
                  <tr key={d.id} className="hover:bg-bg-2">
                    <td className="px-4.5 py-3 font-mono text-[11px]" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)" }}>{d.id}</td>
                    <td className="px-4.5 py-3" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{d.member}</td>
                    <td className="px-4.5 py-3" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{d.provider}</td>
                    <td className="px-4.5 py-3" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{d.reason}</td>
                    <td className="px-4.5 py-3 text-right font-mono" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{d.amt}</td>
                    <td className="px-4.5 py-3 font-mono text-[11.5px]" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)" }}>{d.opened}</td>
                    <td className="px-4.5 py-3" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{d.owner}</span>
                        {d.ownerName}
                      </div>
                    </td>
                    <td className="px-4.5 py-3 text-right" style={{ borderBottom: i < DISPUTES.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{
                        color: d.statusColor,
                        borderColor: d.statusColor,
                        border: `1px solid ${d.statusColor}`,
                        background: d.signal ? "var(--signal-soft)" : "transparent",
                      }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.statusColor }} />
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
    </AdminDashboardShell>
  );
}
