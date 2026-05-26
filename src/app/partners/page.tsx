import Link from "next/link";
import type { Metadata } from "next";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * Partners — integrations and ecosystem partners.
 * Hero 56px h1, 3 tier cards, CTA section.
 */

export const metadata: Metadata = {
  title: "Partners & Integrations | Binectics",
  description: "Explore our payment, technology, and fitness ecosystem partners powering the global Binectics platform.",
};

const TIERS = [
  {
    label: "Payment partners",
    desc: "The rails that move money across 50+ countries in local currency.",
    partners: [
      { name: "Stripe", role: "Card processing, subscription billing, and payouts for EU/US/UK markets." },
      { name: "Paystack", role: "Naira payments, bank transfers, and USSD checkout across Nigeria and Ghana." },
      { name: "Flutterwave", role: "Pan-African coverage including Kenya, South Africa, Tanzania, and 10+ markets." },
    ],
  },
  {
    label: "Technology",
    desc: "Infrastructure we rely on to stay fast, reliable, and secure.",
    partners: [
      { name: "Vercel", role: "Edge-first frontend hosting with instant rollbacks and preview deployments." },
      { name: "Azure", role: "API compute, blob storage, and managed Postgres across three regions." },
      { name: "Cloudflare", role: "DDoS protection, CDN, and DNS for sub-50ms TTFB globally." },
    ],
  },
  {
    label: "Fitness ecosystem",
    desc: "Industry bodies and certification authorities we work with.",
    partners: [
      { name: "REPSSA", role: "Register of Exercise Professionals South Africa — credential verification for SA trainers." },
      { name: "IHRSA", role: "International Health, Racquet & Sportsclub Association — gym industry standards and benchmarks." },
      { name: "ACE", role: "American Council on Exercise — trainer and dietitian certification validation." },
    ],
  },
];

export default function PartnersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Partners</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[22ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Partners &amp; <em className="font-serif font-normal italic">integrations</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          We partner with the best payment processors, cloud providers, and fitness industry bodies to deliver a reliable platform across every market we serve.
        </p>
      </section>

      {/* Partner tiers */}
      {TIERS.map((tier) => (
        <section key={tier.label} className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="text-[28px] sm:text-[32px] font-medium mb-2" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
            {tier.label.split(" ")[0]}{" "}
            <em className="font-serif font-normal italic">{tier.label.split(" ").slice(1).join(" ")}</em>.
          </h2>
          <p className="text-[15px] leading-[1.55] mb-5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>{tier.desc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {tier.partners.map((p) => (
              <div key={p.name} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
                <h3 className="text-[17px] font-medium mb-2" style={{ color: "var(--ink)" }}>{p.name}</h3>
                <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{p.role}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="rounded-(--r-3) p-8 sm:p-12 text-center" style={{ background: "var(--bg-2)" }}>
          <h2 className="text-[28px] sm:text-[36px] font-medium mb-3" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
            Become a <em className="font-serif font-normal italic">partner</em>.
          </h2>
          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-[50ch] mx-auto mb-6" style={{ color: "var(--fg-2)" }}>
            We&apos;re always looking for payment processors, fitness bodies, and technology partners who share our mission to make fitness accessible everywhere.
          </p>
          <Link href="/contact" className="btn-primary-v2">Get in touch &rarr;</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
