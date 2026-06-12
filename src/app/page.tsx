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

export const metadata: Metadata = {
  title: "Binectics — the copilot your fitness business runs on",
  description:
    "AI-drafted client summaries, weekly reports, and program updates — plus payments in 8 currencies and a verified marketplace. For trainers, dietitians, and gyms in 50+ countries.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Binectics",
  url: "https://binectics.com",
  description:
    "The copilot fitness professionals run their business on. AI-drafted client reports, payments, and a verified marketplace in 50+ countries.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "help@binectics.com",
  },
};

const faqItems = [
  { q: "What is Binectics and who is it for?", a: "Binectics is the platform fitness professionals run their business on. Trainers and dietitians get an AI copilot that drafts client summaries, weekly reports, and plan updates from the data clients already log — plus payments, scheduling, and a verified marketplace listing. Gyms get the full operations suite; members get one tab to find providers, subscribe, and check in." },
  { q: "What does the AI copilot actually draft?", a: "Client check-in summaries, weekly progress reports, program adjustment suggestions, intake-form-to-plan drafts, and nudge messages for clients going quiet. Everything is generated only from your own clients’ data — journals, weight logs, meal feedback, and check-ins." },
  { q: "Does the AI send anything to my clients directly?", a: "No. Every AI output is a draft. Nothing reaches a client until you review it, edit it if you want, and press send. Sent reports carry an “AI-assisted, reviewed by you” note, and there is a full audit trail." },
  { q: "Is my client data used to train AI models?", a: "No. Generation runs only on your own clients’ data, scoped to your account, and is never used to train models or shared across providers without explicit opt-in. Voice notes are deleted after transcription." },
  { q: "How is Binectics different from a class-booking app?", a: "Class-booking apps point a member at one studio. Binectics is the rails underneath: an AI copilot for client work, payments, check-ins, client health, journals, plans, and reviews — for gyms, trainers, and dietitians, in one place." },
  { q: "Which countries and currencies are supported?", a: "Launching with payment support in 50+ countries and eight currencies (USD, EUR, GBP, NGN, KES, ZAR, AED, INR). Payments route automatically — Stripe for USD / EUR / GBP / AED / INR, Paystack for NGN / KES / ZAR, and Flutterwave across NGN / GHS / KES / TZS / UGX." },
  { q: "When can I start?", a: "Early access is open now. Founding-cohort providers get hands-on onboarding, early-access pricing that stays locked after launch, and a direct line to the team building the copilot. General availability follows in 2026." },
  { q: 'What does "verified" mean on a listing?', a: "It means a human on our team has reviewed the provider\u2019s documents — business registration, certifications, identity — and approved them. Verified listings get the green badge and appear in marketplace results. Rejection comes with a written reason and a path to resubmit." },
  { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. Payment credentials are handled by PCI-compliant processors (Stripe, Paystack, Flutterwave) — we never store card numbers. Infrastructure runs on Azure with SOC 2-aligned controls, automated backups, and region-isolated databases." },
  { q: "Can I cancel or downgrade anytime?", a: "Yes. Downgrade from Studio to Starter at any time — your listing stays live, and existing members keep their active subscriptions until they expire. No cancellation fees, no lock-in contracts. Enterprise plans follow the terms in your service agreement." },
  { q: "Can I bring my own payment processor?", a: "Yes — Studio and Enterprise plans let providers configure their own Stripe, Paystack, or Flutterwave keys. Payments settle directly to your account; Binectics never holds funds." },
  { q: "How do team and multi-location plans work?", a: "Gym owners create an organization, invite staff with role and permission scopes, and manage multiple listings — each with its own facility details, amenities, gallery, and documents. Assignment rules route new clients to the right staff automatically." },
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
              The copilot your
              <br />
              fitness business
              <br />
              <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>runs on</em>.
            </h1>

            <p className="text-[16px] sm:text-[19px] text-fg-2 max-w-[580px] mt-5 sm:mt-7 leading-relaxed">
              Whether you coach ten clients or run three locations, Binectics drafts the
              client summaries, weekly reports, and program updates from the data your
              clients already log — and runs your payments in 8 currencies. You review,
              send, and get back to the floor.
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
              Free plan includes 3 AI summaries a month. No card needed.
            </p>
          </div>

          {/* Right column — HeartbeatMotion */}
          <div className="w-full max-w-[480px] mx-auto lg:max-w-none" style={{ aspectRatio: "1 / 1" }} aria-hidden="true">
            <HeartbeatMotion />
          </div>
        </div>

        {/* Strap — by-design stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-9 pt-7 border-t border-border">
          {[
            { n: "8", l: "Currencies" },
            { n: "50+", l: "Countries supported" },
            { n: "3", l: "Payment rails" },
            { n: "5", l: "Draft types" },
            { n: "0", l: "Drafts sent without your review" },
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
              Built for the professionals first. Trainers and dietitians get a copilot that drafts
              the busywork; gyms get the full operations suite with copilot seats for every staff
              trainer; members get one tab for everything — and every role works in the same calm chrome.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { accent: "bg-trainer", micro: "Trainer", title: "Coach more humans, less inbox.", desc: "The copilot drafts check-in summaries, weekly reports, and program tweaks from your clients\u2019 data. You review, send, and coach.", bullets: ["AI client summaries & weekly reports", "Workout plan library", "Client invites & journals", "Earnings dashboard"] },
            { accent: "bg-dietitian", micro: "Dietitian", title: "Plans, meals, progress — connected.", desc: "Intake forms become draft meal plans. Client feedback and weight data become drafted adjustments — no spreadsheets, no blank pages.", bullets: ["Intake → draft meal plan", "Meal feedback & ratings", "Diet plans with PDF support", "Client weight tracking"] },
            { accent: "bg-gym", micro: "Gym owner", title: "Run the floor and the books.", desc: "Multi-location management, plans, members, staff schedules, revenue dashboards — and copilot seats for your staff trainers.", bullets: ["Multi-location facilities", "Plans, members, classes", "Staff, roles & copilot seats", "Revenue + check-in analytics"] },
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
        <ScrollReveal stagger staggerInterval={60} className="grid grid-cols-5 border-b border-border">
          {["Stripe", "Paystack", "Flutterwave", "Apple Pay", "Google Pay"].map((name, i) => (
            <div key={name} className={`py-4 sm:py-7 px-1 sm:px-6 text-center text-fg-3 font-mono text-[10px] sm:text-[12px] uppercase tracking-[0.02em] sm:tracking-[0.04em] ${i < 4 ? "border-r border-border" : ""}`}>
              {name}
            </div>
          ))}
        </ScrollReveal>
      </div>

      {/* ═══ PRODUCT PREVIEW — Dashboard Mosaic ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-20 sm:py-32 border-b border-border">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              The dashboard is <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>calm</em>. The work isn&apos;t.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 mt-4 leading-relaxed">
              Dense data, flat surfaces, one signal color — and a copilot that drafts the busywork.
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
              Bring your clients, let the data flow in, review the drafts — all in one tab.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger staggerInterval={100} className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
          {[
            { num: "Step 01", title: "Connect", desc: "List your practice or bulk-invite your existing roster. Verified listings bring new client leads; your current clients join in minutes." },
            { num: "Step 02", title: "Coach", desc: "Clients check in by QR and log weight, meals, and workouts. Every data point lands in their profile — no spreadsheets, no chasing." },
            { num: "Step 03", title: "Review & send", desc: "Each week the copilot drafts client reports and program tweaks. You edit, approve, send — and plans bill in each client’s currency." },
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
                {step.title === "Review & send" && (
                  <svg viewBox="0 0 200 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--ink)", maxHeight: 80, width: "auto" }}>
                    <rect x="36" y="20" width="128" height="70" rx="6" />
                    <rect x="44" y="32" width="50" height="6" rx="1" fill="currentColor" />
                    <rect x="44" y="44" width="80" height="3" rx="1.5" fill="var(--fg-3)" stroke="none" />
                    <rect x="44" y="58" width="100" height="22" rx="4" fill="oklch(0.18 0.008 80)" stroke="none" className="step-sub-btn" />
                    <text x="94" y="73" textAnchor="middle" fontFamily="Geist" fontSize="10" fontWeight="500" fill="var(--bg)" stroke="none">Approve & send →</text>
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

      {/* ═══ PRODUCT PROOF — sample draft + workflow vignettes ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-14 sm:py-20 border-b border-border">
        <ScrollReveal>
          <h2 className="text-[32px] sm:text-[48px] font-medium leading-none mb-10 sm:mb-14" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
            See what it drafts.
          </h2>
        </ScrollReveal>

        {/* The artifact — sample copilot output, full width */}
        <ScrollReveal>
          <div className="rounded-(--r-3) border border-border bg-bg p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center mb-3.5">
            <div className="sm:border-r sm:border-border sm:pr-10">
              <div className="text-[48px] sm:text-[64px] font-medium leading-none" style={{ color: "var(--trainer)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>12</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1.5" style={{ color: "var(--fg-3)" }}>data points behind this draft</div>
            </div>
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mb-3" style={{ color: "var(--fg-3)" }}>Sample — weekly check-in summary</div>
              <p className="text-[16px] sm:text-[18px] leading-[1.65] text-fg-2 mb-5">
                Tunde logged 4 of 5 planned sessions this week. Squat working weight is up 2.5 kg,
                but sleep dipped Thursday and the journal mentions work stress. Suggest keeping
                Friday&apos;s deload as planned and opening the next session with a recovery check-in.
              </p>
              <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>Drafted by the copilot · reviewed, edited, and sent by you</div>
            </div>
          </div>
        </ScrollReveal>

        {/* Workflow vignettes — 3-col grid */}
        <ScrollReveal stagger staggerInterval={100} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            {
              copy: "Four client reports drafted overnight from last week's logs. You edit two sentences, approve, and send them all before your first session.",
              name: "The Monday morning",
              meta: "Trainer workflow",
              accent: "var(--trainer)",
              stat: "8:04",
              statLabel: "drafts waiting at login",
            },
            {
              copy: "A new client's intake form arrives as a draft meal plan, built around the foods they actually eat. You refine portions and send it the same day.",
              name: "The new client",
              meta: "Dietitian workflow",
              accent: "var(--dietitian)",
              stat: "1",
              statLabel: "sitting, intake to plan",
            },
            {
              copy: "Members check in by QR, revenue reconciles itself, and every staff trainer's report drafts are written for them. You watch the floor, not the spreadsheet.",
              name: "The front desk",
              meta: "Gym workflow",
              accent: "var(--gym)",
              stat: "3",
              statLabel: "locations, one login",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-(--r-3) border border-border bg-bg p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="mb-5 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="text-[36px] sm:text-[44px] font-medium leading-none" style={{ color: t.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{t.stat}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1.5" style={{ color: "var(--fg-3)" }}>{t.statLabel}</div>
                </div>
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-fg-2 mb-6">
                  {t.copy}
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
              { v: "100%", l: "of sends human-reviewed" },
              { v: "0", l: "client data used for training" },
              { v: "0", l: "card numbers stored" },
              { v: "8", l: "currencies at launch" },
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
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[32px] sm:text-[48px] font-medium leading-none" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
              Transparent pricing.
            </h2>
            <p className="text-[15px] sm:text-[17px] text-fg-2 mt-4 leading-relaxed">
              Start free with three AI summaries a month. Upgrade when the drafts win you over — local pricing in 8 currencies, no lock-ins. Founding-cohort pricing stays locked after launch.
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
            Still have questions? Reach us at help@binectics.com — you&apos;ll hear back from the team building the copilot.
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
            Your Monday reports are already drafted.
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[15px] sm:text-[16px] max-w-[36ch] leading-relaxed m-0" style={{ color: "oklch(0.78 0.005 85)" }}>
              Bring your clients, connect payouts, and let the copilot handle the busywork. Free to start — your first three summaries are included.
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
