import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import HeartbeatMotion from "@/components/HeartbeatMotion";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";
import FaqAccordion from "@/components/FaqAccordion";
import DashboardMosaic from "@/components/DashboardMosaic";
import LandingPricing from "@/components/LandingPricing";
import { GatewayStrip, PaidInPhrase } from "@/components/marketing/CurrencyFacts";

export const metadata: Metadata = {
  title: "Binectics: run your gym, coaching and payments in one place",
  description:
    "Memberships, Paystack payments, QR check-in, classes, bookings, training programs and meal plans for gyms, personal trainers and dietitians in Nigeria. Priced per seat, with no cut of your takings.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Binectics",
  url: "https://www.binectics.com",
  description: "Fitness business platform for gyms, personal trainers and dietitians.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "help@binectics.com",
  },
};

const faqItems = [
  { q: "What is Binectics and who is it for?", a: "Binectics runs a fitness business and the coaching around it in one place. Gyms manage memberships, plans, classes, check-ins and staff. Trainers build training programs and take bookings. Dietitians run weekly meal plans and consultations. Members find providers on the marketplace, pay, check in, and follow their plan in one app." },
  { q: "Is my client data used to train AI models?", a: "No. Binectics doesn\u2019t use client data to train AI models." },
  { q: "How is Binectics different from a class-booking app?", a: "A class-booking app points a member at one studio\u2019s timetable. Binectics also runs the coaching and the money: training programs, meal plans, client check-ins and journals, membership payments, and reviews, for gyms, trainers, and dietitians in one place." },
  { q: "Which countries and currencies are supported?", a: "Payments run through the payment providers we have integrated, in the currencies they can charge for us. More open as each one is enabled, and a price can only be set in a currency we can actually charge. The currencies open to you are listed when you set a price." },
  { q: "When can I start?", a: "Early access is open now. Founding providers get hands-on onboarding and a direct line to the team." },
  { q: 'What does "verified" mean on a listing?', a: "It means a human on our team has reviewed the provider\u2019s documents, business registration, certifications, identity, and approved them. Verified listings get the green badge and appear in marketplace results. Rejection comes with a written reason and a path to resubmit." },
  { q: "Is my data secure?", a: "Data is encrypted in transit and at rest. Card payments are handled by Paystack, so Binectics never sees or stores card numbers." },
  { q: "Can I cancel or downgrade anytime?", a: "Yes. Move to the free plan at any time, your listing stays live, and existing members keep their active subscriptions until they expire. No cancellation fees, no lock-in contracts. Custom plans follow the terms in your service agreement." },
  { q: "Can I use my own payment account?", a: "Yes. Providers connect their own Paystack account, and member payments settle directly into it. Binectics takes no cut." },
  { q: "How do team and multi-location plans work?", a: "Gym owners create an organization, invite staff with role and permission scopes, and manage multiple listings, each with its own facility details, amenities, gallery, and documents. Assignment rules route new clients to the right staff automatically." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <MarketingTopbar
        activeLabel="Home"
        links={[
          { href: "#how", label: "How it works" },
          { href: "/marketplace", label: "Marketplace" },
          { href: "#roles", label: "For providers" },
          { href: "#pricing", label: "Pricing" },
          { href: "#faq", label: "FAQ" },
        ]}
      />

      {/* ═══ HERO ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-12 sm:pt-18 pb-16 sm:pb-25 border-b border-border relative">
        {/* hero-top: 2-column grid on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-y-10 lg:gap-x-14 items-center mb-12 sm:mb-18">
          {/* Left column — hero text */}
          <div>
            {/* Early access pill */}
            <div className="flex items-center gap-2 sm:gap-4 border border-border rounded-full px-3 sm:px-3.5 py-1 bg-bg w-fit text-[11px] sm:text-[12.5px] text-fg-2 mb-5 sm:mb-7">
              <span className="w-4.5 h-4.5 rounded-full bg-signal-soft flex items-center justify-center">
                <span className="w-1.75 h-1.75 rounded-full bg-signal" />
              </span>
              <span>Early access now open</span>
              <span className="text-border-2">{"·"}</span>
              <span className="font-mono text-fg-3">2026</span>
              <span className="hidden sm:inline">founding cohort</span>
              <span className="sm:hidden">cohort</span>
            </div>

            <h1
              className="text-[40px] sm:text-[60px] lg:text-[76px] leading-[0.94] font-medium"
              style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
            >
              Run your gym,
              <br />
              coaching and payments
              <br />
              <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>in one place</em>.
            </h1>

            <p className="text-[16px] sm:text-[19px] text-fg-2 max-w-[580px] mt-5 sm:mt-7 leading-relaxed">
              Whether you coach ten clients or run three locations: memberships, classes,
              QR check-in, training programs, and meal plans, with payments<PaidInPhrase />{" "}
              straight into your own Paystack account. Built for Nigeria, priced per seat,
              with no cut of your takings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7 sm:mt-9 items-start sm:items-center">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) bg-ink text-[14px] font-medium hover:bg-[oklch(0.08_0.008_80)] w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--bg)" }}
              >
                Start free →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) text-[14px] font-medium border border-border hover:bg-bg-2 hover:border-border-2 w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--fg-2)" }}
              >
                Browse the marketplace
              </Link>
            </div>

            <p className="text-sm text-fg-3 mt-3.5 m-0">
              Free to start. No card needed.
            </p>
          </div>

          {/* Right column — HeartbeatMotion */}
          <div className="w-full max-w-[480px] mx-auto lg:max-w-none" style={{ aspectRatio: "1 / 1" }} aria-hidden="true">
            <HeartbeatMotion />
          </div>
        </div>

        {/* Strap — by-design stats */}
        <div className="grid grid-cols-3 gap-6 sm:gap-9 pt-7 border-t border-border">
          {[
            { n: "0%", l: "Cut of member payments" },
            { n: "4", l: "Roles, one product" },
            { n: "0", l: "Card numbers stored" },
          ].map((s) => (
            <div key={s.l}>
              <CountUp value={s.n} className="text-[24px] sm:text-[36px] font-medium text-ink block" style={{ letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }} />
              <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.04em] text-fg-3 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="roles">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Four roles.<br />One product.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              Built for the professionals first. Trainers and dietitians get programs, meal plans,
              and bookings; gyms get memberships, classes, check-in, and staff; members get one app
              for everything, and every role works in the same calm chrome.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { accent: "bg-trainer", micro: "Trainer", title: "Coach more humans, less admin.", desc: "Build training programs once and assign them, take 1:1 bookings against your own hours, and see who\u2019s keeping up from their check-ins and journals.", bullets: ["Training programs & daily tasks", "1:1 booking against your hours", "Client invites & journals", "Earnings dashboard"] },
            { accent: "bg-dietitian", micro: "Dietitian", title: "Plans, meals, progress, connected.", desc: "Intake forms, weekly meal plans, and consultations in one place. Client meal feedback and weight logs land on their profile, no spreadsheets.", bullets: ["Intake forms", "Meal feedback & ratings", "Diet plans with PDF support", "Client weight tracking"] },
            { accent: "bg-gym", micro: "Gym owner", title: "Run the floor and the books.", desc: "Multi-location management, plans, members, classes, staff, and revenue dashboards, with your staff trainers coaching from the same workspace.", bullets: ["Multi-location facilities", "Plans, members, classes", "Staff, roles & staff trainers", "Revenue + check-in analytics"] },
            { accent: "bg-ink", micro: "Member", title: "Find a coach. Show up. Repeat.", desc: "Browse verified providers, subscribe in your own currency, check in by QR, and watch your streak count itself.", bullets: ["QR check-in & streaks", "Weight, meal, activity logs", "Read your coach’s journal", "Verified providers, local pricing"] },
          ].map((role, i) => (
            <div key={role.micro} className={`p-6 sm:p-7 flex flex-col gap-3.5 min-h-60 sm:min-h-80 ${i < 3 ? "border-b sm:border-b-0 sm:border-r border-border" : ""} ${i === 1 ? "lg:border-r" : ""}`}>
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: `var(--${role.micro === "Member" ? "ink" : role.micro === "Gym owner" ? "gym" : role.micro === "Trainer" ? "trainer" : "dietitian"})` }}>
                  {role.micro === "Member" && <><circle cx="10" cy="5" r="2.5" /><path d="M5 18v-2a5 5 0 0 1 10 0v2" /><path d="M10 11v3" className="role-heartbeat" /></>}
                  {role.micro === "Gym owner" && <><rect x="2" y="6" width="16" height="12" rx="1.5" /><path d="M2 10h16" /><rect x="5" y="2" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" /><rect x="13" y="2" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" /><circle cx="10" cy="14" r="1.5" className="role-pulse" /></>}
                  {role.micro === "Trainer" && <g className="role-lift"><path d="M3 10h14" /><rect x="1" y="7" width="4" height="6" rx="1" /><rect x="15" y="7" width="4" height="6" rx="1" /><rect x="7" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" /><rect x="11" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" /></g>}
                  {role.micro === "Dietitian" && <><circle cx="10" cy="10" r="7" /><path d="M10 5v4M8 7c0-2 4-2 4 0" className="role-grow" /><path d="M10 13v2" /><circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" /></>}
                </svg>
                <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">{role.micro}</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>{role.title}</h3>
              <p className="text-[13.5px] text-fg-2 leading-relaxed">{role.desc}</p>
              <ul className="mt-auto flex flex-col gap-1.5 list-none p-0">
                {role.bullets.map((b) => (
                  <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="mx-auto max-w-360 px-5 sm:px-10">
        <GatewayStrip />
      </div>

      {/* ═══ PRODUCT PREVIEW — Dashboard Mosaic ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-20 sm:py-32 border-b border-border">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              The dashboard is <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>calm</em>. The work isn&apos;t.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 mt-4 leading-relaxed">
              Dense data, flat surfaces, one signal color.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <DashboardMosaic />
        </ScrollReveal>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="how">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg-3 mb-3">3 steps</div>
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              How it works
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 mt-4 leading-relaxed max-w-120 mx-auto">
              Bring your clients, coach them, and get paid, all in one tab.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={100} className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { num: "Step 01", title: "Connect", desc: "List your practice or bulk-invite your existing roster. Verified listings bring new client leads; your current clients join in minutes." },
            { num: "Step 02", title: "Coach", desc: "Clients check in by QR and log weight, meals, and workouts. Every data point lands in their profile, no spreadsheets, no chasing." },
            { num: "Step 03", title: "Get paid", desc: "Members pay by card or bank transfer straight into your own Paystack account. You see who\u2019s active, who\u2019s due, and who has lapsed." },
          ].map((step, i) => (
            <div key={step.title} className={`p-6 sm:p-7 pt-7 sm:pt-8 flex flex-col gap-4 ${i < 2 ? "border-b sm:border-b-0 sm:border-r border-border" : ""}`}>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-4">{step.num}</div>
              <h3 className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{step.title}</h3>
              <p className="text-[14px] text-fg-2 leading-relaxed m-0">{step.desc}</p>
              <div className="mt-auto pt-4 flex justify-center" style={{ borderTop: "1px solid var(--border)" }}>
                {step.title === "Connect" && (
                  <svg viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--ink)", maxHeight: 80, width: "auto" }}>
                    <rect x="14" y="14" width="172" height="22" rx="4" />
                    <circle cx="26" cy="25" r="4" className="step-find-lens" />
                    <path d="m31 30 5 5" className="step-find-lens" />
                    <rect x="14" y="46" width="80" height="50" rx="4" fill="var(--bg-3)" />
                    <rect x="106" y="46" width="80" height="50" rx="4" />
                    <rect x="22" y="86" width="40" height="4" rx="2" fill="currentColor" />
                    <rect x="22" y="78" width="30" height="3" rx="1.5" fill="var(--fg-3)" stroke="none" />
                    <circle cx="183" cy="53" r="3" fill="oklch(0.68 0.16 148)" stroke="none" className="step-find-dot" />
                  </svg>
                )}
                {step.title === "Get paid" && (
                  <svg viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--ink)", maxHeight: 80, width: "auto" }}>
                    <rect x="36" y="20" width="128" height="70" rx="6" />
                    <rect x="44" y="32" width="50" height="6" rx="1" fill="currentColor" />
                    <rect x="44" y="44" width="80" height="3" rx="1.5" fill="var(--fg-3)" stroke="none" />
                    <rect x="44" y="58" width="100" height="22" rx="4" fill="oklch(0.18 0.008 80)" stroke="none" className="step-sub-btn" />
                    <text x="94" y="73" textAnchor="middle" fontFamily="Geist" fontSize="10" fontWeight="500" fill="var(--bg)" stroke="none">Pay now →</text>
                    <rect x="44" y="58" width="100" height="22" rx="4" fill="url(#shimmer)" stroke="none" className="step-sub-shimmer" />
                    <defs>
                      <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="white" stopOpacity="0" />
                        <stop offset="0.5" stopColor="white" stopOpacity="0.12" />
                        <stop offset="1" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                {step.title === "Coach" && (
                  <svg viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--ink)", maxHeight: 80, width: "auto" }}>
                    <rect x="60" y="14" width="80" height="80" rx="6" />
                    <g fill="currentColor" stroke="none">
                      <rect x="70" y="24" width="18" height="18" rx="1" />
                      <rect x="112" y="24" width="18" height="18" rx="1" />
                      <rect x="70" y="66" width="18" height="18" rx="1" />
                      <rect x="96" y="50" width="6" height="6" />
                      <rect x="108" y="58" width="6" height="6" />
                      <rect x="118" y="68" width="10" height="6" />
                      <rect x="100" y="74" width="6" height="10" />
                    </g>
                    <rect x="76" y="30" width="6" height="6" fill="var(--bg)" stroke="none" />
                    <rect x="118" y="30" width="6" height="6" fill="var(--bg)" stroke="none" />
                    <rect x="76" y="72" width="6" height="6" fill="var(--bg)" stroke="none" />
                    <line x1="60" y1="54" x2="140" y2="54" stroke="oklch(0.68 0.16 148)" strokeWidth="1.5" strokeOpacity="0.6" className="step-qr-scan" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="pricing">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Transparent pricing.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 mt-4 leading-relaxed">
              Start free and pay per seat as you grow. No cut of your members’ payments, no lock-in.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={100}>
          <LandingPricing />
        </ScrollReveal>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-14 sm:py-20 border-b border-border" id="faq">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Common questions
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80} className="border border-border rounded-(--r-3) overflow-hidden bg-bg">
          <FaqAccordion items={faqItems} />
        </ScrollReveal>

        <div className="text-center mt-6">
          <p className="font-mono text-[11px] text-fg-3 tracking-[0.02em]">
            Still have questions? Reach us at help@binectics.com.
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <ScrollReveal className="max-w-340 mx-auto px-5 sm:px-10 my-10 sm:my-16">
        <div className="bg-ink rounded-(--r-3) px-6 sm:px-10 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 sm:gap-12 items-end">
          <h2
            className="text-[32px] sm:text-[56px] font-medium leading-[0.98] max-w-[12ch]"
            style={{ letterSpacing: "-0.035em", color: "var(--bg)" }}
          >
            Your whole business, one tab.
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[15px] sm:text-[16px] max-w-[36ch] leading-relaxed m-0" style={{ color: "oklch(0.78 0.005 85)" }}>
              Bring your clients, connect your Paystack account, and run memberships, coaching, and payments from one place. Free to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) bg-signal text-[14px] font-medium hover:bg-[oklch(0.62_0.17_148)] w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
              >
                Start free →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) text-[14px] font-medium border hover:bg-[oklch(0.20_0.008_80)] w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--bg)", borderColor: "oklch(0.35 0.008 80)" }}
              >
                Browse first
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <MarketingFooter />
    </>
  );
}
