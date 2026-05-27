import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Binectics team and help build the operating system for global fitness.",
};

/**
 * Careers — open roles + culture page.
 * Proto: careers.html
 * Hero 56px h1, role list cards (1-col, grid: 1fr auto), culture 3-col cards.
 */

const ROLES = [
  {
    title: "Senior product designer",
    team: "Design · Cape Town · hybrid",
    desc: "Lead design for member surface — the front door to everything we do.",
  },
  {
    title: "Staff engineer · payments",
    team: "Engineering · Remote · ZA / NG / EU",
    desc: "Own the payments substrate · Stripe, Paystack, Flutterwave, M-Pesa.",
  },
  {
    title: "Trust & safety lead",
    team: "Ops · Cape Town",
    desc: "Build the team that resolves disputes, fights fraud, keeps it human.",
  },
  {
    title: "Country lead · India",
    team: "Growth · Mumbai · Bengaluru",
    desc: "Open our largest greenfield market end-to-end.",
  },
];

const CULTURE = [
  { title: "Default to writing", desc: "A 6-page memo beats a 1-hour meeting. We read together, then talk." },
  { title: "Ship every week", desc: "No quarterly planning theatre. Real users see new work every Tuesday." },
  { title: "Capital-efficient", desc: "We're cash positive. Equity grants vest like they should." },
];

export default function CareersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Careers · 4 open roles</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Build the <em className="font-serif font-normal italic">OS</em> for fitness.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Cape Town HQ · remote-friendly · 28 people · cash positive · we ship every week. We hire for taste, judgment, and the ability to do hard things without being asked twice.
        </p>
      </section>

      {/* Open roles */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Open <em className="font-serif font-normal italic">roles</em>.
        </h2>
        <div className="flex flex-col gap-2.5">
          {ROLES.map((r) => (
            <div key={r.title} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-4.5 items-center rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <div>
                <div className="text-[17px] font-medium" style={{ color: "var(--ink)" }}>{r.title}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>{r.team}</div>
                <p className="text-[13.5px] leading-[1.55] mt-2.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>{r.desc}</p>
              </div>
              <div className="flex flex-col gap-2 items-start sm:items-end">
                <span className="font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Live</span>
                <Link href="/login?mode=signup" className="btn-primary-v2 sm">Apply &rarr;</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Culture */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          How we <em className="font-serif font-normal italic">work</em>.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {CULTURE.map((c) => (
            <div key={c.title} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[16px] font-medium mb-3" style={{ color: "var(--ink)" }}>{c.title}</h3>
              <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
