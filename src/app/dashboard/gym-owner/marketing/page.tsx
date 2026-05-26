import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Referral code uses", value: "42", delta: "This month" },
  { label: "Share-kit downloads", value: "128", delta: "↑ 28% MoM" },
  { label: "Member-of-the-month picked", value: "May", delta: "Folake A." },
  { label: "Discount redemptions", value: "62", delta: "R 18k discounted" },
];

const CODES = [
  { code: "SUMMER25", discount: "25% off first 3 months", used: "14 / 50", expires: "30 Jun", action: "Pause" },
  { code: "FRIEND50", discount: "R 500 off · referral", used: "18 / ∞", expires: "Never", action: "Edit" },
  { code: "SARAH", discount: "R 200 off · trainer code", used: "28 / 100", expires: "Dec 26", action: "Edit" },
];

export default function GymMarketingPage() {
  return (
    <GymDashboardShell activeItem="Settings" crumb="Marketing">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Marketing tools</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium tracking-[-0.02em] tabular-nums mt-1" style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Discount codes */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Discount codes</h3>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Code", "Discount", "Used", "Expires", ""].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CODES.map((c) => (
              <tr key={c.code} className="hover:bg-[var(--bg-2)]">
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong className="font-mono" style={{ color: "var(--ink)" }}>{c.code}</strong></td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{c.discount}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{c.used}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{c.expires}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>{c.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <button className="mt-3.5 px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>+ New code</button>
      </div>

      {/* Share kit + Embed widget */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Share kit</h3>
          <p className="text-[13.5px] mb-3.5" style={{ color: "var(--fg-2)" }}>Branded social templates for Instagram, WhatsApp status, and Facebook. Auto-generates with your gym name + photos.</p>
          <div className="grid grid-cols-3 gap-2 mb-3.5">
            <div className="aspect-square rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 60), oklch(0.72 0.06 40))" }} />
            <div className="aspect-square rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 200), oklch(0.72 0.06 220))" }} />
            <div className="aspect-square rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 120), oklch(0.72 0.06 140))" }} />
          </div>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Download &middot; 9 templates</button>
        </div>

        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Embed widget</h3>
          <p className="text-[13.5px] mb-3" style={{ color: "var(--fg-2)" }}>Drop on your website. Live class schedule with one-tap booking. ~3kb gzipped.</p>
          <div className="font-mono text-[12px] px-3.5 py-3 rounded-(--r-2) overflow-x-auto whitespace-nowrap" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
            {`<script src="binectics.com/w/iron-lab.js" defer></script>`}
          </div>
          <button className="mt-3.5 px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Copy snippet</button>
        </div>
      </div>
    </GymDashboardShell>
  );
}
