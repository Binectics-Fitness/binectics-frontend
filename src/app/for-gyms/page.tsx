import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Gyms",
  description: "Manage memberships, check-ins, and revenue with Binectics gym management tools.",
};

/**
 * For Gyms — marketing landing page for gym owners.
 * Proto: for-gyms.html
 * Hero 56px h1, 3-col feature cards, 4-col KPI row.
 */

const FEATURES = [
  { title: "Member CRM", desc: "Profiles, streaks, payment history, custom tags. Search 10k members in 30ms." },
  { title: "Class schedule", desc: "Drag-drop weekly schedule, recurring classes, waitlists, instant cancellations." },
  { title: "QR check-ins", desc: "iPad kiosks at the door. 92.4% scan success. Streak nudges built in." },
  { title: "Direct payouts", desc: "Paystack · Stripe · Flutterwave. Money in your account in 2 days. We never hold it." },
  { title: "Multi-location", desc: "Iron Lab runs 4 locations on Binectics. One dashboard. Shared members. Separate payouts." },
  { title: "Tax-ready", desc: "SARS-compliant quarterly + annual reports. Your accountant pulls via API." },
];

const KPIS = [
  { label: "Avg setup time", value: "4 days" },
  { label: "Member churn drop", value: "−28%" },
  { label: "Admin time saved", value: "12 h/wk" },
  { label: "Active gyms", value: "684" },
];

export default function ForGymsPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>For gyms</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Run your gym in <em className="font-serif font-normal italic">one tab</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Members, schedule, check-ins, payouts, payroll, marketing — all in one place. No more Excel + Mindbody + WhatsApp groups.
        </p>
        <div className="mt-7">
          <Link href="/register" className="btn-primary-v2 lg">Get a free demo &rarr;</Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Built for the <em className="font-serif font-normal italic">whole</em> operation.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[16px] font-medium mb-3" style={{ color: "var(--ink)" }}>{f.title}</h3>
              <p className="text-[14px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg-2)" }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
              <div className="text-[32px] font-medium mt-1" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>{k.value}</div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
