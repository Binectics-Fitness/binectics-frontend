import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description: "Check the current operational status of all Binectics platform services.",
};

/**
 * Status — system status page with service list + incident log.
 * Proto: status.html
 * Hero with green dot + pill, 1-col service rows (name · uptime · pill),
 * incident log with date · description · resolution · pill.
 */

const SERVICES = [
  { name: "Marketplace · public", status: "Operational", ok: true },
  { name: "Booking · payment", status: "Operational", ok: true },
  { name: "Dashboards · gym · trainer · dietitian", status: "Operational", ok: true },
  { name: "QR check-in kiosks", status: "Operational", ok: true },
  { name: "Copilot · drafting", status: "Early access", ok: true },
  { name: "Admin · support", status: "Operational", ok: true },
  { name: "Email notifications", status: "Operational", ok: true },
  { name: "Audit log · cold storage", status: "Operational", ok: true },
];

export default function StatusPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="flex gap-2.5 items-center mb-3.5">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: "var(--signal)" }} />
          <span className="font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal)", color: "oklch(0.18 0.05 148)" }}>All systems operational</span>
        </div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          System <em className="font-serif font-normal italic">status</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Live status of every Binectics service. Public uptime history and the incident log begin at general launch.
        </p>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Services</h2>
        <div className="flex flex-col gap-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="grid grid-cols-[1fr_auto] gap-4.5 items-center rounded-(--r-3) px-4.5 py-3.5" style={{ background: "var(--bg-2)" }}>
              <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{s.name}</span>
              <span
                className="font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em]"
                style={{
                  background: s.ok ? "var(--signal-soft)" : "oklch(0.96 0.06 75)",
                  color: s.ok ? "var(--signal-ink)" : "oklch(0.45 0.16 75)",
                }}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Incidents */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Incidents</h2>
        <div className="rounded-(--r-3) px-4.5 py-8 text-center" style={{ background: "var(--bg-2)" }}>
          <p className="text-[14px] m-0" style={{ color: "var(--fg-2)" }}>No incidents recorded.</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] mt-2 m-0" style={{ color: "var(--fg-3)" }}>Public incident history begins at launch</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
