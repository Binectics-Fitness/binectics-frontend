import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { DietitianDemo } from "@/components/ds/DietitianDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Dietitians, Binectics",
  description:
    "Credential-verified dietitian profiles, weekly meal plans, consultations, and client meal feedback, all on one platform.",
  keywords:
    "dietitian platform, meal plan software, nutrition practice management, client adherence tracking, dietitian verification, clinical nutrition software",
};

const PAIN_POINTS = [
  { before: "Generic meal plan templates from a textbook", after: "Weekly meal plans built for each client" },
  { before: "WhatsApp photos of meals with no structure", after: "Clients log meals and rate how each one went" },
  { before: "Paper-based client notes and intake forms", after: "Digital intake forms and client journals" },
  { before: "Manual invoicing and chasing payments", after: "Clients pay for consultations when they book" },
];

const FEATURES = [
  {
    title: "Credential verification",
    desc: "Upload your certifications and registration. Our team reviews them and adds the verified badge to your profile.",
    stat: "Reviewed by our team",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  },
  {
    title: "Meal plan builder",
    desc: "Plan each day of the week meal by meal, using food items with their macros.",
    stat: "Day-by-day weekly plans",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  },
  {
    title: "Food items",
    desc: "Add the foods your clients actually eat, with their macros, and use them in your meal plans.",
    stat: "Macros per food",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  },
  {
    title: "Meal feedback",
    desc: "Clients log their meals and rate how each one went, alongside their weight. See how a plan is landing before the next consultation.",
    stat: "Logged in the client app",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
  },
  {
    title: "Consultation calendar",
    desc: "Set your consultation types and weekly hours. Clients book an open slot from your profile and pay when they book.",
    stat: "Pay when they book",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>,
  },
  {
    title: "Intake forms",
    desc: "Build intake and check-in forms and send them to clients. Their answers land on their profile.",
    stat: "Answers on the client profile",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h4"/></svg>,
  },
];

const KPIS = [
  { label: "Cut of client payments", value: "0%" },
  { label: "Card numbers stored", value: "0" },
  { label: "Client app", value: "Included" },
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
          Intake forms, weekly meal plans, and consultations in one place.
          Clients log their meals and weight, and you see how the plan is
          landing before the next session.
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
          Client adherence, meal plans, and action queue, all in one place.
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
          Six capabilities designed around how dietitians actually work -
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

      {/* KPIs */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
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
          List your practice for free. Paid plans are sized by how many
          clients you work with. We take no cut of your consultation fees,
          plan sales, or subscriptions.
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
