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
  { name: "Marketplace · public", uptime: "99.998%", status: "Operational", ok: true },
  { name: "Booking · payment", uptime: "99.997%", status: "Operational", ok: true },
  { name: "Dashboards · gym · trainer · dietitian", uptime: "99.99%", status: "Operational", ok: true },
  { name: "QR check-in kiosks", uptime: "99.95%", status: "Operational", ok: true },
  { name: "Admin · support", uptime: "100%", status: "Operational", ok: true },
  { name: "Email notifications · Postmark", uptime: "99.98%", status: "Operational", ok: true },
  { name: "Push notifications · OneSignal", uptime: "99.92%", status: "Degraded", ok: false },
  { name: "Audit log · cold storage", uptime: "100%", status: "Operational", ok: true },
];

const INCIDENTS = [
  { date: "18 May · 14:32", desc: "M-Pesa Daraja API timeouts", resolution: "Fixed in 38m" },
  { date: "12 May · 02:14", desc: "Scheduled maintenance · dashboards", resolution: "30 min planned" },
  { date: "28 Apr · 09:42", desc: "Stripe webhook lag in EU", resolution: "Fixed in 22m" },
  { date: "12 Apr · 11:18", desc: "Search results ranking drift after deploy", resolution: "Fixed in 14m" },
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
          Live status of every Binectics service. Subscribe to incident updates or use the RSS feed.
        </p>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Services</h2>
        <div className="flex flex-col gap-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="grid grid-cols-[1fr_auto_auto] gap-4.5 items-center rounded-(--r-3) px-4.5 py-3.5" style={{ background: "var(--bg-2)" }}>
              <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{s.name}</span>
              <span className="font-mono text-[13px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.uptime}</span>
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
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Incidents · last 90 days</h2>
        <div className="flex flex-col gap-2.5">
          {INCIDENTS.map((inc) => (
            <div key={inc.date} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_120px_80px] gap-2 sm:gap-4.5 items-center rounded-(--r-3) px-4.5 py-3.5" style={{ background: "var(--bg-2)" }}>
              <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{inc.date}</span>
              <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>{inc.desc}</span>
              <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{inc.resolution}</span>
              <span className="font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Resolved</span>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
