import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

const PREVIEW_ROWS = [
  { name: "Adaora Tunde", email: "adaora@gmail.com", phone: "+234 80 ••• 4218", status: "Ready", ok: true },
  { name: "Reza Mohammadi", email: "reza.m@example.ae", phone: "+971 50 ••• 8812", status: "Ready", ok: true },
  { name: "Sara Lim", email: "sara@example", phone: "—", status: "Invalid email", ok: false },
  { name: "Themba Mokoena", email: "themba@email.co.za", phone: "+27 82 ••• 1284", status: "Already a client", ok: false },
];

export default function TrainerBulkInvitePage() {
  return (
    <TrainerDashboardShell activeItem="Clients" crumb="Bulk invite">
      <div className="max-w-[760px]">
        <h1 className="text-[30px] font-medium tracking-[-0.024em] mb-2" style={{ color: "var(--ink)" }}>Bulk invite &middot; CSV</h1>
        <p className="text-[13.5px] mb-5.5" style={{ color: "var(--fg-3)" }}>
          Upload a CSV of existing clients. We&apos;ll email each one a unique join link and pre-fill their profile. Standard 3-column format:{" "}
          <code className="font-mono px-1.5 py-0.5 rounded-[3px]" style={{ background: "var(--bg-2)" }}>name, email, phone</code>
        </p>

        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          {/* Upload zone */}
          <div className="rounded-(--r-3) p-8 text-center mb-4.5" style={{ border: "2px dashed var(--border-2)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.3" className="mx-auto mb-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <div className="text-[14px] font-medium mb-1" style={{ color: "var(--ink)" }}>Drop your CSV here</div>
            <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>or click to browse &middot; max 5,000 rows</div>
          </div>

          {/* Preview table */}
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Preview &middot; clients.csv &middot; 24 rows valid &middot; 2 errors</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Name", "Email", "Phone", "Status"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((r) => (
                <tr key={r.name} className="hover:bg-[var(--bg-2)]">
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.name}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.email}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.phone}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
                      style={r.ok
                        ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                        : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="text-center py-3 text-[12.5px]" style={{ color: "var(--fg-3)" }}>+ 22 more rows</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3.5 px-5 py-4 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            <strong className="font-medium" style={{ color: "var(--ink)" }}>24 invites will be sent.</strong>{" "}
            2 errors will be skipped -- fix and re-upload to include them.
          </div>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer flex-shrink-0" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Send 24 invites</button>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
