import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import HeartbeatMotion from "@/components/HeartbeatMotion";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";
import FaqAccordion from "@/components/FaqAccordion";
import DashboardMosaic from "@/components/DashboardMosaic";

export const metadata: Metadata = {
  title: "Binectics — everything fitness runs on",
  description:
    "One marketplace, one set of dashboards, one tab. Discovery, payments, check-ins, and client health for gyms, trainers, and dietitians in 50+ countries.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Binectics",
  url: "https://binectics.com",
  description:
    "Everything fitness runs on. One marketplace connecting gyms, trainers, and dietitians in 50+ countries.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "help@binectics.com",
  },
};

const faqItems = [
  { q: "What is Binectics and who is it for?", a: "Binectics is a single platform that connects gyms, personal trainers, dietitians, and the members who work with them. Members find and subscribe to verified providers in their own currency. Providers get dashboards for plans, clients, check-ins, journals, and earnings — all in one tab." },
  { q: "How is Binectics different from a class-booking app?", a: "Class-booking apps point a member at one studio. Binectics is the rails underneath: discovery, payments, check-ins, client health, journals, plans, and reviews — for gyms, trainers, and dietitians, in one place. Members get one tab; providers get one set of tools." },
  { q: "Which countries and currencies are supported?", a: "Live in 50+ countries with eight currencies (USD, EUR, GBP, NGN, KES, ZAR, AED, INR). Payments route automatically — Stripe for USD / EUR / GBP / AED / INR, Paystack for NGN / KES / ZAR, and Flutterwave across NGN / GHS / KES / TZS / UGX." },
  { q: 'What does "verified" mean on a listing?', a: "It means a human on our team has reviewed the provider\u2019s documents — business registration, certifications, identity — and approved them. Verified listings get the green badge and appear in marketplace results. Rejection comes with a written reason and a path to resubmit." },
  { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. Payment credentials are handled by PCI-compliant processors (Stripe, Paystack, Flutterwave) — we never store card numbers. Infrastructure runs on Azure with SOC 2-aligned controls, automated backups, and region-isolated databases." },
  { q: "Can I cancel or downgrade anytime?", a: "Yes. Downgrade from Studio to Starter at any time — your listing stays live, and existing members keep their active subscriptions until they expire. No cancellation fees, no lock-in contracts. Enterprise plans follow the terms in your service agreement." },
  { q: "Can I bring my own payment processor?", a: "Yes — Studio and Enterprise plans let providers configure their own Stripe, Paystack, or Flutterwave keys. Payments settle directly to your account; Binectics never holds funds." },
  { q: "How do team and multi-location plans work?", a: "Gym owners create an organization, invite staff with role and permission scopes, and manage multiple listings — each with its own facility details, amenities, gallery, and documents. Assignment rules route new clients to the right staff automatically." },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
            {/* Live ticker pill */}
            <div className="flex items-center gap-2 sm:gap-4 border border-border rounded-full px-3 sm:px-3.5 py-1 bg-bg w-fit text-[11px] sm:text-[12.5px] text-fg-2 mb-5 sm:mb-7">
              <span className="w-4.5 h-4.5 rounded-full bg-signal-soft flex items-center justify-center">
                <span className="w-1.75 h-1.75 rounded-full bg-signal" />
              </span>
              <span>Live across 50+ countries</span>
              <span className="text-border-2">{"·"}</span>
              <span className="font-mono text-fg-3">2,481</span>
              <span className="hidden sm:inline">check-ins in the last hour</span>
              <span className="sm:hidden">check-ins/hr</span>
            </div>

            <h1
              className="text-[40px] sm:text-[60px] lg:text-[76px] leading-[0.94] font-medium"
              style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
            >
              Everything fitness
              <br />
              <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>runs on</em>.
            </h1>

            <p className="text-[16px] sm:text-[19px] text-fg-2 max-w-[580px] mt-5 sm:mt-7 leading-relaxed">
              One marketplace for gyms, trainers, and dietitians. One set of dashboards
              for the people who run them. Discovery, payments, check-ins — same rails, same tab.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7 sm:mt-9 items-start sm:items-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) bg-ink text-[14px] font-medium hover:bg-[oklch(0.08_0.008_80)] w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--bg)" }}
              >
                Get started free →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) text-[14px] font-medium border border-border hover:bg-bg-2 hover:border-border-2 w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--fg-2)" }}
              >
                Browse the marketplace
              </Link>
            </div>
          </div>

          {/* Right column — HeartbeatMotion */}
          <div className="w-full max-w-[480px] mx-auto lg:max-w-none" style={{ aspectRatio: "1 / 1" }}>
            <HeartbeatMotion />
          </div>
        </div>

        {/* Strap — proof stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-9 pt-7 border-t border-border">
          {[
            { n: "14,200+", l: "Providers" },
            { n: "8", l: "Currencies" },
            { n: "50+", l: "Countries" },
            { n: "43,000+", l: "Monthly check-ins" },
            { n: "4.82", l: "Avg rating" },
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
              Four roles,<br />one <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>product</em>.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              A marketplace is only as good as the operators on it. Binectics gives each role its
              own dashboard, its own KPIs, and the same calm chrome — so an admin reviewing
              verifications and a trainer writing a journal entry are working in the same product.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { accent: "bg-ink", micro: "Member", title: "Find a coach. Show up. Repeat.", desc: "Browse verified providers, subscribe in your own currency, check in by QR, and watch your streak count itself.", bullets: ["QR check-in & streaks", "Weight, meal, activity logs", "Read your coach\u2019s journal", "Loyalty & gamification"] },
            { accent: "bg-gym", micro: "Gym owner", title: "Run the floor and the books.", desc: "Multi-location management, plans, members, staff schedules, revenue dashboards — and a verified marketplace listing on top.", bullets: ["Multi-location facilities", "Plans, members, classes", "Staff & assignment rules", "Revenue + check-in analytics"] },
            { accent: "bg-trainer", micro: "Trainer", title: "Coach more humans, less inbox.", desc: "Workout plans, structured exercises, client journals with mood and adherence, sessions, and earnings — in one tab.", bullets: ["Workout plan library", "Client invites & journals", "Sessions & consultations", "Earnings dashboard"] },
            { accent: "bg-dietitian", micro: "Dietitian", title: "Plans, meals, progress — connected.", desc: "Build meal plans, attach PDFs, watch clients log feedback, and turn weight data into plan adjustments without spreadsheets.", bullets: ["Meal plan library", "Diet plans with PDF support", "Meal feedback & ratings", "Client weight tracking"] },
          ].map((role, i) => (
            <div key={role.micro} className={`p-6 sm:p-7 flex flex-col gap-3.5 min-h-60 sm:min-h-80 ${i < 3 ? "border-b sm:border-b-0 sm:border-r border-border" : ""} ${i === 1 ? "lg:border-r" : ""}`}>
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`role-icon role-icon-${i}`} style={{ color: `var(--${role.micro === "Member" ? "ink" : role.micro === "Gym owner" ? "gym" : role.micro === "Trainer" ? "trainer" : "dietitian"})` }}>
                  {role.micro === "Member" && <><circle cx="10" cy="5" r="2.5" /><path d="M5 18v-2a5 5 0 0 1 10 0v2" /><path d="M10 11v3" className="role-heartbeat" /></>}
                  {role.micro === "Gym owner" && <><rect x="2" y="6" width="16" height="12" rx="1.5" /><path d="M2 10h16" /><rect x="5" y="2" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" /><rect x="13" y="2" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" /><circle cx="10" cy="14" r="1.5" className="role-pulse" /></>}
                  {role.micro === "Trainer" && <><path d="M3 10h14" /><rect x="1" y="7" width="4" height="6" rx="1" /><rect x="15" y="7" width="4" height="6" rx="1" /><rect x="7" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" /><rect x="11" y="8.5" width="2" height="3" rx="0.5" fill="currentColor" stroke="none" className="role-lift" /></>}
                  {role.micro === "Dietitian" && <><circle cx="10" cy="10" r="7" /><path d="M10 5v4M8 7c0-2 4-2 4 0" /><path d="M10 13v2" className="role-grow" /><circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" /></>}
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

      {/* ═══ PRODUCT PREVIEW — Dashboard Mosaic ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              The dashboard is <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>calm</em>.<br />The work isn&apos;t.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              Dense data on flat surfaces. Tabular numerals everywhere. One signal color
              reserved for the action that actually matters — so when something asks for
              your attention, you know it earned it.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <DashboardMosaic />
        </ScrollReveal>
        <div className="text-center mt-5">
          <Link href="/marketplace" className="btn-ghost-v2">Explore the marketplace →</Link>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="how">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Three steps<br />from <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>signup</em><br />to <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>sweat</em>.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              Members find verified providers in seconds. Providers list once and earn from
              the first day. Payments route to the right rails per currency — Stripe, Paystack,
              Flutterwave — without anyone thinking about it.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={100} className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { num: "Step 01", title: "Find", desc: "Search, filter by city, rating, and price. Every listing is verified — green badge means we\u2019ve reviewed the documents ourselves." },
            { num: "Step 02", title: "Subscribe", desc: "Pick a plan in your own currency. One-time or monthly. Apple Pay, card, or local rails — all in a single checkout sheet." },
            { num: "Step 03", title: "Show up", desc: "Scan the QR at the door. Your streak counts itself; your coach sees the check-in in real time and writes the next journal entry." },
          ].map((step, i) => (
            <div key={step.title} className={`p-6 sm:p-7 pt-7 sm:pt-8 flex flex-col gap-4 ${i < 2 ? "border-b sm:border-b-0 sm:border-r border-border" : ""}`}>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-4">{step.num}</div>
              <h3 className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{step.title}</h3>
              <p className="text-[14px] text-fg-2 leading-relaxed m-0">{step.desc}</p>
              <div className="mt-auto pt-4 flex justify-center" style={{ borderTop: "1px solid var(--border)" }}>
                {step.title === "Find" && (
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
                {step.title === "Subscribe" && (
                  <svg viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--ink)", maxHeight: 80, width: "auto" }}>
                    <rect x="36" y="20" width="128" height="70" rx="6" />
                    <rect x="44" y="32" width="50" height="6" rx="1" fill="currentColor" />
                    <rect x="44" y="44" width="80" height="3" rx="1.5" fill="var(--fg-3)" stroke="none" />
                    <rect x="44" y="58" width="100" height="22" rx="4" fill="oklch(0.18 0.008 80)" stroke="none" className="step-sub-btn" />
                    <text x="94" y="73" textAnchor="middle" fontFamily="Geist" fontSize="10" fontWeight="500" fill="var(--bg)" stroke="none">Pay $48.00</text>
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
                {step.title === "Show up" && (
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

      {/* ═══ TRUST STRIP ═══ */}
      <div className="mx-auto max-w-360">
        <ScrollReveal stagger staggerInterval={60} className="grid grid-cols-5 border-b border-border">
          {["Stripe", "Paystack", "Flutterwave", "Apple Pay", "Google Pay"].map((name, i) => (
            <div key={name} className={`py-4 sm:py-7 px-2 sm:px-6 text-center text-fg-3 font-mono text-[9px] sm:text-[12px] uppercase tracking-[0.04em] ${i < 4 ? "border-r border-border" : ""}`}>
              {name}
            </div>
          ))}
        </ScrollReveal>
      </div>

      {/* ═══ TESTIMONIALS — Metric Cards ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              What they&apos;re<br /><em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>saying</em>.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              Gym owners, trainers, dietitians, and members — from Lagos to Cape Town to Dubai. Here&apos;s what switching to one platform actually feels like.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={120} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            {
              quote: "We went from three spreadsheets and a WhatsApp group to one dashboard. Check-ins are automatic, revenue is tracked, and I finally know which tiers actually show up. Should have switched two years ago.",
              name: "Adaeze Okonkwo",
              meta: "Gym owner · FitZone · Lagos",
              accent: "var(--gym)",
              stat: "94%",
              statLabel: "check-in accuracy",
            },
            {
              quote: "I used to spend 90 minutes a day on invoices and scheduling. Now I open one tab, see my sessions, and payments just land. The client journal means I actually remember what we did last Tuesday. My clients noticed the difference.",
              name: "Sarah Okafor",
              meta: "Personal trainer · Cape Town · CSCS",
              accent: "var(--trainer)",
              stat: "52 min",
              statLabel: "saved per day",
            },
            {
              quote: "The food database actually has the foods my clients eat. Not just chicken breast and broccoli — shawarma, biryani, machboos, hummus. I built 340 meal plans last year without manually entering a single macronutrient. That alone is worth it.",
              name: "Dr. Nadia Hassan",
              meta: "Clinical dietitian · Dubai · RD, ISAK",
              accent: "var(--dietitian)",
              stat: "2,400+",
              statLabel: "foods in FCDB",
            },
            {
              quote: "I found a verified gym two streets from my office, subscribed in Naira, and checked in with a QR code the same afternoon. My streak is at 247 days now. I have never stuck with a gym this long — the progress tracking makes it feel like a game I keep winning.",
              name: "Kemi Abayomi",
              meta: "Member · Lagos · 18-month streak",
              accent: "var(--ink)",
              stat: "247",
              statLabel: "day streak",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-(--r-3) border border-border bg-bg p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="mb-5 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="text-[36px] sm:text-[44px] font-medium leading-none" style={{ color: t.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{t.stat}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1.5" style={{ color: "var(--fg-3)" }}>{t.statLabel}</div>
                </div>
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-fg-2 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div>
                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.name}</div>
                <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>{t.meta}</div>
              </div>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              { v: "4.82", l: "avg rating" },
              { v: "14,200+", l: "providers" },
              { v: "52", l: "countries" },
              { v: "98%", l: "would recommend" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <span className="text-[20px] sm:text-[24px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="pricing">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Pricing<br />that <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>scales</em><br />with you.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              Free to list. Members pay providers directly; we take a transparent platform fee
              on processed payments. No setup fees, no per-seat charges, no annual lock-ins.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={100} className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {/* Starter */}
          <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border">
            <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Starter</div>
            <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Free</h3>
            <div className="font-mono text-[12px] text-fg-3">For new providers · forever free</div>
            <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
              {["One marketplace listing", "Up to 50 active members", "QR check-ins included", "5% platform fee on transactions"].map((b) => (
                <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
              ))}
            </ul>
            <Link href="/register" className="btn-ghost-v2 md mt-auto self-start">Start free</Link>
          </div>

          {/* Studio */}
          <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border" style={{ background: "var(--bg-2)" }}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Studio</span>
              <span className="inline-flex items-center gap-1.25 h-4.5 px-2 rounded-(--r-1) text-[11px] font-medium bg-signal-soft text-signal-ink border border-[oklch(0.88_0.05_148)]">Recommended</span>
            </div>
            <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
              $48 <span className="font-mono text-[13px] text-fg-3 font-normal">/ month</span>
            </h3>
            <div className="font-mono text-[12px] text-fg-3">For single-location operators</div>
            <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
              {["Up to 500 active members", "Staff & client management", "Custom payment gateway keys", "Revenue + check-in analytics", "Email digest, in-app inbox"].map((b) => (
                <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
              ))}
            </ul>
            <Link href="/register" className="btn-signal-v2 mt-auto self-start" style={{ height: "34px", padding: "0 14px" }}>Choose Studio</Link>
          </div>

          {/* Enterprise */}
          <div className="p-6 sm:p-7 flex flex-col gap-3.5" style={{ background: "var(--ink)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "oklch(0.78 0.005 85)" }}>Enterprise</div>
            <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--bg)" }}>Custom</h3>
            <div className="font-mono text-[12px]" style={{ color: "oklch(0.78 0.005 85)" }}>Multi-location · multi-country</div>
            <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
              {["Unlimited locations & members", "Org-level billing & SSO", "Assignment rules & team roles", "Dedicated provider success", "SLA & audit logs"].map((b) => (
                <li key={b} className="text-[12.5px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px" style={{ color: "oklch(0.78 0.005 85)" }}>{b}</li>
              ))}
            </ul>
            <Link href="/contact" className="btn-ghost-v2 md mt-auto self-start" style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }}>Talk to us</Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-16 sm:py-24 border-b border-border" id="faq">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 mb-10 sm:mb-14 items-end">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Questions,<br />answered <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>plainly</em>.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 max-w-[540px] leading-relaxed">
              If your question isn&apos;t here, contact provider success at help@binectics.com — most replies in under four hours during weekdays.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80} className="border border-border rounded-(--r-3) overflow-hidden bg-bg">
          <FaqAccordion items={faqItems} />
        </ScrollReveal>
      </section>

      {/* ═══ CTA ═══ */}
      <ScrollReveal className="max-w-340 mx-auto px-5 sm:px-10 my-10 sm:my-16">
        <div className="bg-ink rounded-(--r-3) px-6 sm:px-10 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 sm:gap-12 items-end">
          <h2
            className="text-[32px] sm:text-[56px] font-medium leading-[0.98] max-w-[12ch]"
            style={{ letterSpacing: "-0.035em", color: "var(--bg)" }}
          >
            Your next members are already searching.{" "}
            <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>Be ready for them.</em>
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[15px] sm:text-[16px] max-w-[36ch] leading-relaxed m-0" style={{ color: "oklch(0.78 0.005 85)" }}>
              List your gym, studio, or practice today. Free to start, three minutes to publish, verified within two business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-[42px] px-4.5 rounded-(--r-2) bg-signal text-[14px] font-medium hover:bg-[oklch(0.62_0.17_148)] w-full sm:w-auto"
                style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
              >
                Create your account →
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
