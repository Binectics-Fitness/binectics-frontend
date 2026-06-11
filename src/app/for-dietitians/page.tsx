import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { DietitianDemo } from "@/components/ds/DietitianDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Dietitians — Binectics",
  description:
    "Credential-verified dietitian profiles, branded PDF meal plans, a 12,842-food database with West African staples, and client adherence tracking — all on one platform.",
  keywords:
    "dietitian platform, meal plan software, nutrition practice management, client adherence tracking, food database Nigeria, dietitian verification, clinical nutrition software",
};

const PAIN_POINTS = [
  { before: "Generic meal plan templates from a textbook", after: "12,842-food database with regional staples" },
  { before: "WhatsApp photos of meals with no structure", after: "Structured meal logs with auto adherence scoring" },
  { before: "Paper-based client notes and intake forms", after: "Digital client journals with macro compliance graphs" },
  { before: "Manual invoicing and chasing payments", after: "Auto-billing with branded receipts and tax exports" },
];

const FEATURES = [
  {
    title: "Credential verification",
    desc: "DAN, HPCSA, CDR verification against the regulator. We confirm your licence is active, check disciplinary history, and add a verified badge to your profile. Re-checked on a rolling cycle so clients always see current status.",
    stat: "Re-verified every 24 months",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  },
  {
    title: "Meal plan builder",
    desc: "Drag and drop meals across days, auto-calculate macros per meal and per day, and save plans as reusable templates. When you are done, export as a branded PDF with your name, credentials, and colour scheme.",
    stat: "12,842 foods in the database",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  },
  {
    title: "Food database",
    desc: "1,840 Nigerian FCDB entries, South African, Kenyan, and Indian staples. Jollof rice, ugali, dhal — accurate macros verified against government composition tables, not crowd-sourced guesswork.",
    stat: "1,840 West African entries",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  },
  {
    title: "Client adherence tracking",
    desc: "Daily macro compliance graphs, 7-day sparklines, and an adherence score from 0 to 100 for every client. Set thresholds and receive nudge alerts when a client falls below target for three consecutive days.",
    stat: "76% avg client adherence",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
  },
  {
    title: "Consultation calendar",
    desc: "Video call integration with prep notes, recurring consult scheduling, and timezone support for international clients. Clients book from your public profile and receive calendar invites automatically.",
    stat: "Avg 4.2 consults/day per dietitian",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>,
  },
  {
    title: "Protocol library",
    desc: "Save clinical methodologies for PCOS, T2DM, weight management, and other conditions. Track outcomes across clients who follow the same protocol. Reuse across similar cases without starting from scratch.",
    stat: "42 community protocols available",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h4"/></svg>,
  },
];

const REGIONS = [
  {
    name: "West Africa",
    entries: "1,840 entries",
    desc: "Jollof, egusi, pounded yam, suya, chin chin. Macros verified against the Nigerian Food Composition Database.",
  },
  {
    name: "South Africa",
    entries: "920 entries",
    desc: "Boerewors, bunny chow, chakalaka, biltong. Aligned with SAFOODS composition tables.",
  },
  {
    name: "East Africa and India",
    entries: "1,200+ entries",
    desc: "Ugali, chapati, dhal, biryani, samosa. Cross-referenced with IFCT and Kenya FCDB.",
  },
];

const KPIS = [
  { label: "Avg adherence", value: "76%" },
  { label: "Client retention lift", value: "+41%" },
  { label: "Consultations/day", value: "4.2" },
  { label: "Active dietitians", value: "328" },
];

export default function ForDietitiansPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          For dietitians
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[20ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Clinical care,{" "}
          <em className="font-serif font-normal italic">without</em> the
          admin.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Verified by your professional body. Branded PDF plans. Macro
          tracking that clients actually use. A food database with West
          African staples already in it.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup&role=dietitian" className="btn-primary-v2 lg">
            Apply to list &rarr;
          </Link>
          <Link href="/features/dashboard" className="btn-ghost-v2 lg">
            See the dietitian dashboard
          </Link>
        </div>
      </section>

      {/* Interactive demo */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Your practice, purpose-built
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Client adherence, meal plans, and action queue — all in one place.
          Click a tab to explore.
        </p>
        <DietitianDemo />
      </section>

      {/* Pain points */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          The admin load you can drop
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PAIN_POINTS.map((p) => (
            <div
              key={p.before}
              className="rounded-(--r-3) p-5"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="text-[14px] line-through mb-2"
                style={{ color: "var(--fg-3)" }}
              >
                {p.before}
              </div>
              <div
                className="text-[15px] font-medium"
                style={{ color: "var(--ink)" }}
              >
                {p.after}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expanded features */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Built for clinical nutrition practice
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Six capabilities designed around how dietitians actually work —
          not how generic SaaS thinks you should.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="w-8 h-8 rounded-(--r-2) mb-4 flex items-center justify-center"
                style={{ background: "var(--bg)", color: "var(--fg-2)" }}
              >
                {f.icon}
              </div>
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55] mb-4"
                style={{ color: "var(--fg-2)" }}
              >
                {f.desc}
              </p>
              <div
                className="font-mono text-[11px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                {f.stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Food database spotlight */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          A food database that knows your region
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Most nutrition software ships with USDA data and calls it done.
          We built regional databases from government composition tables so
          the macros are accurate for the foods your clients actually eat.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {REGIONS.map((r) => (
            <div
              key={r.name}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[11px] uppercase tracking-[0.04em] mb-2"
                style={{ color: "var(--fg-3)" }}
              >
                {r.entries}
              </div>
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {r.name}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg-2)" }}
        >
          <blockquote
            className="text-[17px] sm:text-[19px] leading-[1.5] max-w-[52ch] mb-5"
            style={{ color: "var(--ink)" }}
          >
            &ldquo;The protocol library changed how I practise. I built a
            PCOS protocol once, and now I deploy it to new clients in
            minutes with personalised macros. My adherence rates went from
            52% to 76% in three months.&rdquo;
          </blockquote>
          <div
            className="text-[14px] leading-[1.5]"
            style={{ color: "var(--fg-3)" }}
          >
            Dr. Priya Iyer, RD &middot; Clinical Dietitian &middot; Lagos
            &middot; 68 active clients
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-(--r-3) p-4.5"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                {k.label}
              </div>
              <div
                className="text-[24px] sm:text-[32px] font-medium mt-1"
                style={{
                  letterSpacing: "-0.024em",
                  color: "var(--ink)",
                }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Zero listing fees
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-6"
          style={{ color: "var(--fg-2)" }}
        >
          List your practice for free. We charge 4.9% on transactions —
          nothing else. Consultation fees, plan sales, and subscriptions
          all included.
        </p>
        <Link href="/pricing" className="btn-ghost-v2 lg">
          See full pricing
        </Link>
      </section>

      {/* CTA */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-14 sm:py-18 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[36px] font-medium mb-4"
          style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}
        >
          Your expertise deserves a proper platform
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[46ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Apply to list your practice. Verification takes 36 hours on
          average. Start seeing clients on Binectics this week.
        </p>
        <Link href="/login?mode=signup&role=dietitian" className="btn-primary-v2 lg">
          Apply to list &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
