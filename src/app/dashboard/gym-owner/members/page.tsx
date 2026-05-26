import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
  description: "View and manage your gym members and their subscriptions.",
};

const KPIS = [
  { label: "Total members", value: "1,284", delta: "+ 38 net this month" },
  { label: "MRR", value: "R 1.08M", delta: "+ 12.4% MoM" },
  { label: "Retention · 90d", value: "94%", delta: "+ 1.2 pts" },
  { label: "Avg LTV", value: "R 14.2k", delta: "− 2.1% MoM", down: true },
];

const FILTERS = [
  { label: "All", count: "1,284", on: true },
  { label: "Active", count: "1,243" },
  { label: "New · 30d", count: "38" },
  { label: "Paused", count: "27" },
  { label: "Past‑due", count: "14" },
  { label: "Churned · 90d", count: "62" },
];

const MEMBERS = [
  { init: "LM", name: "Linda Mokoena", email: "linda.m@gmail.com", plan: "Studio · 24‑pack", loc: "Sea Point", joined: "18 Mar 2025", streak: 32, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 16,800" },
  { init: "JS", name: "Jamal Sutherland", email: "jamal.s@outlook.com", plan: "Pro · monthly", loc: "Sea Point", joined: "02 May 2026", streak: 11, status: "New", statusColor: "oklch(0.42 0.13 75)", statusBg: "var(--trainer-soft)", ltv: "R 1,700", checked: true },
  { init: "WC", name: "Wei Chen", email: "wei.chen@me.com", plan: "Studio · monthly", loc: "Sea Point", joined: "14 Feb 2026", streak: 45, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 2,550", checked: true },
  { init: "PB", name: "Pier Botha", email: "pierb@uct.ac.za", plan: "Day pass", loc: "Woodstock", joined: "28 Apr 2026", streak: 2, status: "Refund req.", statusColor: "var(--danger)", statusBg: "var(--danger-soft)", ltv: "R 180", checked: true },
  { init: "TN", name: "Thandi Nkosi", email: "thandi.n@iol.co.za", plan: "Studio · monthly", loc: "Camps Bay", joined: "27 Apr 2026", streak: 18, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 2,550" },
  { init: "AA", name: "Aisha Adams", email: "aisha@adams.ae", plan: "Pro · annual", loc: "Sea Point", joined: "26 Apr 2026", streak: 22, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 9,200" },
  { init: "MK", name: "Mike Khumalo", email: "mk@example.za", plan: "Studio · monthly", loc: "Foreshore", joined: "25 Apr 2026", streak: 0, status: "Past‑due", statusColor: "var(--danger)", statusBg: "var(--danger-soft)", ltv: "R 850" },
  { init: "SO", name: "Sofia Almeida", email: "sofia@almeida.pt", plan: "Pro · annual", loc: "Sea Point", joined: "14 Aug 2025", streak: 0, status: "Paused", statusColor: "var(--fg-3)", statusBg: "var(--bg-2)", ltv: "R 11,400" },
  { init: "RJ", name: "Rashid Jansen", email: "rjansen@ananzi.co.za", plan: "Studio · 24‑pack", loc: "Woodstock", joined: "12 Mar 2026", streak: 52, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 12,800" },
  { init: "FA", name: "Folake Adebayo", email: "folake.a@gmail.com", plan: "Pro · monthly", loc: "Foreshore", joined: "02 Mar 2026", streak: 38, status: "Active", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", ltv: "R 6,800" },
];

function Fire() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--signal-ink)" }}><path d="M12 2s4 6 4 10a4 4 0 1 1-8 0c0-2 2-4 2-6 0 0 0 2 2 2s0-2 0-6z"/></svg>; }
function More() { return <span className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg></span>; }
function Check({ on }: { on?: boolean }) { return <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center cursor-pointer ${on ? "bg-ink border-ink" : "bg-bg border-border-2"}`}>{on && <span className="w-[7px] h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45 -translate-y-px" style={{ borderColor: "var(--bg)" }} />}</span>; }

export default function GymMembersPage() {
  const selectedCount = MEMBERS.filter(m => m.checked).length;
  return (
    <GymDashboardShell activeItem="Members" crumb="Members" actions={<><button className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }} aria-label="Export members"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button><button className="btn-ghost-v2 sm">Bulk import</button><button className="btn-primary-v2 sm">+ Add member</button></>}>
      <div><h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Members</h1><div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>1,284 active across 4 locations · 38 new this month · 27 paused · 4 past‑due</div></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{KPIS.map((k) => (<div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}><div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div><div className="text-[26px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div><div className="font-mono text-[11.5px] mt-1" style={{ color: k.down ? "var(--danger)" : "var(--signal-ink)" }}>{k.delta}</div></div>))}</div>

      {selectedCount > 0 && (<div className="flex items-center gap-4 px-5 py-3 rounded-(--r-3)" style={{ background: "var(--ink)", color: "var(--bg)" }}><span className="font-mono text-[12px] uppercase tracking-[0.04em]" style={{ color: "oklch(0.7 0.005 85)" }}><strong style={{ color: "var(--bg)", fontWeight: 500 }}>{selectedCount}</strong> members selected</span><div className="flex gap-1.5 ml-auto flex-wrap">{["Email", "Tag", "Export CSV", "Move plan"].map((a) => (<button key={a} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) min-h-11 sm:min-h-0" style={{ border: "1px solid oklch(0.3 0.005 85)", color: "var(--bg)", background: "transparent" }}>{a}</button>))}<button className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) min-h-11 sm:min-h-0" style={{ border: "1px solid oklch(0.45 0.1 25)", color: "oklch(0.85 0.05 25)", background: "transparent" }}>Suspend</button></div></div>)}

      <div className="flex items-center gap-3.5 p-3.5 rounded-(--r-3) flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-70" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span className="text-[13px]" style={{ color: "var(--fg-3)" }}>Search by name, email, or phone…</span></div>
        <div className="flex gap-1 overflow-x-auto">{FILTERS.map((f) => (<span key={f.label} className={`inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer shrink-0 border ${f.on ? "bg-ink border-ink" : "bg-bg border-border"}`} style={{ color: f.on ? "var(--bg)" : "var(--fg-3)" }}>{f.label} <span style={{ color: f.on ? "oklch(0.75 0.005 85)" : "var(--fg-4)" }}>{f.count}</span></span>))}</div>
        <div className="flex gap-1.5"><button className="btn-ghost-v2 sm">Filter</button><button className="btn-ghost-v2 sm">Sort</button><button className="btn-ghost-v2 sm">Columns</button></div>
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[900px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead><tr className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <th className="px-4.5 py-2.75 text-left font-medium w-[22px]"><Check /></th>
              <th className="px-4.5 py-2.75 text-left font-medium">Member</th>
              <th className="px-4.5 py-2.75 text-left font-medium">Plan</th>
              <th className="px-4.5 py-2.75 text-left font-medium">Location</th>
              <th className="px-4.5 py-2.75 text-left font-medium">Joined</th>
              <th className="px-4.5 py-2.75 text-left font-medium">Streak</th>
              <th className="px-4.5 py-2.75 text-left font-medium">Status</th>
              <th className="px-4.5 py-2.75 text-right font-medium">LTV</th>
              <th className="px-4.5 py-2.75 w-[22px]"></th>
            </tr></thead>
            <tbody>{MEMBERS.map((m, i) => (
              <tr key={m.init} className="hover:bg-bg-2 cursor-pointer" style={{ borderBottom: i < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                <td className="px-4.5 py-3"><Check on={m.checked} /></td>
                <td className="px-4.5 py-3"><div className="flex items-center gap-2.5"><span className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span><div><div className="text-[13.5px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{m.name}</div><div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{m.email}</div></div></div></td>
                <td className="px-4.5 py-3" style={{ color: "var(--ink)" }}>{m.plan}</td>
                <td className="px-4.5 py-3" style={{ color: "var(--ink)" }}>{m.loc}</td>
                <td className="px-4.5 py-3" style={{ color: "var(--fg-2)" }}>{m.joined}</td>
                <td className="px-4.5 py-3"><span className="inline-flex items-center gap-1.25 font-mono text-[11.5px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-2)", color: "var(--ink)" }}><Fire />{m.streak}</span></td>
                <td className="px-4.5 py-3"><span className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: m.statusColor, background: m.statusBg }}><span className="w-1.25 h-1.25 rounded-full bg-current" />{m.status}</span></td>
                <td className="px-4.5 py-3 text-right font-mono font-medium" style={{ color: "var(--ink)" }}>{m.ltv}</td>
                <td className="px-4.5 py-3"><More /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Showing <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>1–10</strong> of <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>1,284</strong> members</span>
          <div className="flex gap-0.5"><span className="w-7 h-7 flex items-center justify-center rounded-(--r-2) font-mono text-[12px]" style={{ color: "var(--fg-2)" }}>‹</span>{[1,2,3,4,5].map((n) => (<span key={n} className={`w-7 h-7 flex items-center justify-center rounded-(--r-2) font-mono text-[12px] cursor-pointer ${n===1?"bg-ink":"hover:bg-bg-2"}`} style={{ color: n===1?"var(--bg)":"var(--fg-2)" }}>{n}</span>))}<span className="font-mono text-[12px] px-1" style={{ color: "var(--fg-4)" }}>…</span><span className="w-7 h-7 flex items-center justify-center rounded-(--r-2) font-mono text-[12px] cursor-pointer hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>129</span><span className="w-7 h-7 flex items-center justify-center rounded-(--r-2) font-mono text-[12px]" style={{ color: "var(--fg-2)" }}>›</span></div>
        </div>
      </div>
    </GymDashboardShell>
  );
}
