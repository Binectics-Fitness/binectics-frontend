import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team & Roles",
  description: "Manage admin team members and their role permissions.",
};

export default function AdminTeamRolesPage() {
  return (
    <AdminDashboardShell
      activeItem="Team & roles"
      crumb="Team & roles"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Audit log</button>
          <button className="btn-primary-v2">+ Invite admin</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Team &amp; roles
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          12 admins · 4 distinct roles · permissions matrix · last audit 18 May
        </p>
      </div>

      {/* Admins table */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Admins · 12</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Role", "Country lead", "Last active", "2FA"].map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Andile Khumalo", role: "Super admin", country: "ZA", active: "Now" },
                { name: "Lerato Mokoena", role: "Trust & safety lead", country: "-", active: "Now" },
                { name: "Sara Lin", role: "Support · L2", country: "-", active: "12m ago" },
                { name: "Marcus Tembo", role: "Support · L1", country: "ZA", active: "38m ago" },
                { name: "Dr Nadia Hassan", role: "Clinical reviewer", country: "NG", active: "2h ago" },
                { name: "Kemi Adebayo", role: "Country lead · NG", country: "NG", active: "4h ago" },
                { name: "Hassan Razavi", role: "Country lead · AE", country: "AE", active: "6h ago" },
                { name: "Alex Muller", role: "Country lead · DE", country: "DE", active: "Yesterday" },
              ].map((admin) => (
                <tr key={admin.name}>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{admin.name}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{admin.role}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{admin.country}</td>
                  <td className="py-[11px] px-3.5 font-mono text-[11.5px]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>{admin.active}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Pill variant="ok">{"✓"}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Permissions matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Capability", "Super admin", "Trust & safety", "Support L2", "Support L1"].map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { cap: "View any user · read", vals: ["✓", "✓", "✓", "✓"] },
                { cap: "Impersonate · read-only", vals: ["✓", "✓", "✓", "-"] },
                { cap: "Approve / reject listings", vals: ["✓", "✓", "-", "-"] },
                { cap: "Issue refund · any amount", vals: ["✓", "✓", "✓", "- (max R 500)"] },
                { cap: "Resolve dispute", vals: ["✓", "✓", "✓", "-"] },
                { cap: "Suspend account", vals: ["✓", "✓", "-", "-"] },
                { cap: "Toggle feature flag", vals: ["✓", "-", "-", "-"] },
                { cap: "Edit own role", vals: ["-", "-", "-", "-"] },
              ].map((row) => (
                <tr key={row.cap}>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{row.cap}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

function Pill({ variant, children }: { variant: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    ok: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
    warn: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    danger: { background: "var(--danger-soft)", color: "var(--danger)" },
  };
  return (
    <span className="font-mono text-[10px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em]" style={styles[variant]}>
      {children}
    </span>
  );
}
