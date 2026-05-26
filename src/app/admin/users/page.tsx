import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Search, view, and manage all platform user accounts.",
};

export default function AdminUsersPage() {
  return (
    <AdminDashboardShell
      activeItem="Users"
      crumb="Users"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Export</button>
          <button className="btn-primary-v2">Impersonate user</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Users
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          418,260 active across 52 countries · search any handle, email, ID, or phone
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total active", value: "418k", delta: "+ 6.4% MoM" },
          { label: "New · 30d", value: "28,142", delta: "↑ 12%" },
          { label: "Providers", value: "14.2k", delta: "+ 312 net" },
          { label: "Flagged", value: "42", delta: "8 priority", valueColor: "var(--danger)", deltaColor: "var(--danger)" },
          { label: "Suspended", value: "118", delta: "last 30d", deltaColor: "var(--fg-3)" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[280px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search by name · email · phone · USR_ID..." style={{ color: "var(--ink)" }} readOnly />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            { label: "All", count: "418k", active: true },
            { label: "Members", count: "404k", active: false },
            { label: "Trainers", count: "9.2k", active: false },
            { label: "Gyms", count: "684", active: false },
            { label: "Dietitians", count: "412", active: false },
            { label: "Flagged", count: "42", active: false },
          ].map((f) => (
            <span
              key={f.label}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: f.active ? "var(--ink)" : "var(--bg)",
                color: f.active ? "var(--bg)" : "var(--fg-3)",
                border: f.active ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f.label} <span style={{ color: f.active ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{f.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "ID", "Role", "Country", "Joined", "Status", "LTV"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 ${i === 6 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link href={`/admin/users/${u.id}`} className="flex gap-2.5 items-center no-underline" style={{ color: "inherit" }}>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0`}
                        style={{ background: u.avaBg, color: u.avaColor }}
                      >
                        {u.initials}
                      </span>
                      <div>
                        <div className="font-medium" style={{ color: "var(--ink)" }}>{u.name}</div>
                        <div className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{u.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{u.id}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <RolePill role={u.role} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{u.country}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{u.joined}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={u.status} statusText={u.statusText} />
                  </td>
                  <td className="py-3 px-4.5 text-right font-mono" style={{ borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>
                    {u.ltv}
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

/* ─── Data ──────────────────────────────────────────────────── */
const USERS = [
  { initials: "TA", name: "Tunde Adebayo", email: "tunde@gmail.com", id: "USR_412884", role: "member" as const, country: "ZA", joined: "Jan 2025", status: "active" as const, statusText: "Active", ltv: "R 18,400", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
  { initials: "SO", name: "Sarah Okafor", email: "sarah@binectics.com", id: "USR_018421", role: "trainer" as const, country: "ZA", joined: "Mar 2024", status: "active" as const, statusText: "Active", ltv: "R 182k", avaBg: "var(--trainer)", avaColor: "oklch(0.2 0.05 75)" },
  { initials: "IL", name: "Iron Lab (Lerato M.)", email: "lerato@ironlab.co.za", id: "USR_001182", role: "gym" as const, country: "ZA", joined: "Mar 2024", status: "active" as const, statusText: "Active", ltv: "R 14.2M", avaBg: "var(--gym)", avaColor: "oklch(0.95 0 0)" },
  { initials: "NH", name: "Dr Nadia Hassan", email: "nadia@binectics.com", id: "USR_022941", role: "diet" as const, country: "NG", joined: "Feb 2025", status: "active" as const, statusText: "Active", ltv: "₦ 8.62M", avaBg: "var(--dietitian)", avaColor: "oklch(0.95 0 0)" },
  { initials: "RM", name: "Reza M.", email: "reza.m@example.ae", id: "USR_412884", role: "member" as const, country: "AE", joined: "Aug 2025", status: "flagged" as const, statusText: "Refund abuse · 11 / 30d", ltv: "د.إ 12,400", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
  { initials: "DK", name: "\"Daniel Kane\"", email: "d.kane@protonmail.com", id: "USR_008198", role: "trainer" as const, country: "GB", joined: "May 2026", status: "flagged" as const, statusText: "ID mismatch · priority", ltv: "£ 0", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
  { initials: "PB", name: "Pier Botha", email: "pierb@uct.ac.za", id: "USR_322118", role: "member" as const, country: "ZA", joined: "Mar 2026", status: "active" as const, statusText: "Active · open dispute", ltv: "R 1,680", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
  { initials: "FR", name: "\"Fitness Republic\"", email: "contact@fitnessrepublic.in", id: "USR_008242", role: "gym" as const, country: "IN", joined: "May 2026", status: "suspended" as const, statusText: "Frozen · stolen card", ltv: "₹ 0", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
  { initials: "AK", name: "Andile K.", email: "andile@binectics.com", id: "USR_000003", role: "admin" as const, country: "ZA", joined: "Founder", status: "active" as const, statusText: "Active", ltv: "-", avaBg: "var(--bg-3)", avaColor: "var(--fg-2)" },
];

/* ─── Helpers ──────────────────────────────────────────────── */
function RolePill({ role }: { role: "member" | "trainer" | "gym" | "diet" | "admin" }) {
  const map: Record<string, { bg: string; color: string; border?: string; label: string }> = {
    member: { bg: "var(--gym-soft)", color: "var(--gym)", label: "Member" },
    trainer: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)", label: "Trainer" },
    gym: { bg: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)", label: "Gym owner" },
    diet: { bg: "var(--dietitian-soft)", color: "var(--dietitian)", label: "Dietitian" },
    admin: { bg: "var(--ink)", color: "var(--bg)", label: "Super admin" },
  };
  const s = map[role];
  return (
    <span className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: s.bg, color: s.color, border: s.border }}>
      {s.label}
    </span>
  );
}

function StatusBadge({ status, statusText }: { status: "active" | "flagged" | "suspended"; statusText: string }) {
  const map: Record<string, { bg: string; color: string; border?: string }> = {
    active: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    flagged: { bg: "var(--danger-soft)", color: "var(--danger)" },
    suspended: { bg: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" },
  };
  const s = map[status];
  return (
    <span className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]" style={{ background: s.bg, color: s.color, border: s.border }}>
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {statusText}
    </span>
  );
}
