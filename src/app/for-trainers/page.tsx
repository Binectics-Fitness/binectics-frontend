import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { TrainerDemo } from "@/components/ds/TrainerDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Personal Trainers — Binectics",
  description:
    "Grow your personal training business on Binectics. Get discovered by local clients, manage bookings, build programs, and get paid — all from one platform.",
  keywords:
    "personal trainer software, fitness client management, trainer booking system, online coaching platform, personal training marketplace",
};

const PAIN_POINTS = [
  {
    before: "Instagram DMs for bookings, voice notes for programs",
    after: "Calendar with instant booking + program builder",
  },
  {
    before: "Chase clients for payment every month",
    after: "Auto-billing with smart retry on failed cards",
  },
  {
    before: "Lose 30% of new leads because you respond too slowly",
    after: "Instant booking from your marketplace profile",
  },
  {
    before: "No idea which clients are about to churn",
    after: "Rebooking signals and streak alerts on your dashboard",
  },
];

const FEATURES = [
  {
    title: "Marketplace profile",
    desc: "SEO-optimized listing with verified badge, specialties, photo gallery, and client reviews. Prospective clients find you through search and location filters.",
    stat: "Avg 8.4 leads/month per profile",
  },
  {
    title: "Smart calendar",
    desc: "Recurring sessions, configurable buffer time, timezone support. Syncs with Google Calendar and Apple Calendar so you never double-book.",
    stat: "Zero double-bookings reported",
  },
  {
    title: "Client management",
    desc: "Full roster with session history, rebooking status, and progress tracking. See who is overdue, who is thriving, and who needs a check-in.",
    stat: "42 avg active clients per trainer",
  },
  {
    title: "Program builder",
    desc: "Sets, reps, tempo, rest. Drag-and-drop exercises. Copy-to-next-week for progressive overload. Template library for common goals.",
    stat: "8 min avg program build time",
  },
  {
    title: "Earnings dashboard",
    desc: "Per-client revenue breakdown, monthly trends, projected earnings, and payout timeline. Know exactly what is coming and when.",
    stat: "R 38.4K avg monthly earnings",
  },
  {
    title: "Client journals",
    desc: "Log workouts, notes, and metrics after every session. Clients see their own feed with progress over time. Builds accountability and trust.",
    stat: "+34% client retention with journals",
  },
];

const EARNINGS = [
  {
    title: "In-person sessions",
    desc: "Charge per session or sell packs of 12/24. Members book from your calendar. You get paid in 2 days.",
  },
  {
    title: "Online programs",
    desc: "Sell PDF or interactive programs to clients anywhere. Multi-currency. No shipping, no inventory.",
  },
  {
    title: "Recurring subscriptions",
    desc: "Monthly retainers for ongoing coaching. Auto-renew with smart retry. Predictable income.",
  },
];

const KPIS = [
  { label: "Avg leads/month", value: "8.4" },
  { label: "Client retention lift", value: "+34%" },
  { label: "Avg monthly earnings", value: "R 38.4K" },
  { label: "Active trainers", value: "1,241" },
];

export default function ForTrainersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          For personal trainers
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Get more clients.{" "}
          <em className="font-serif font-normal italic">Keep</em> them longer.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          A profile that ranks in local search. A calendar that never
          double-books. Payouts in 2 days. Programming tools that save you
          hours every week.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-primary-v2 lg">
            List your practice — free
          </Link>
          <Link href="/features/dashboard" className="btn-ghost-v2 lg">
            See the trainer dashboard
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
          Built for how trainers work
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Schedule, clients, and earnings in one dashboard.
          Click a tab to see each view.
        </p>
        <TrainerDemo />
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
          The hustle you can skip
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
          Everything you need to build a practice
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Six core tools that replace the patchwork of apps, spreadsheets,
          and group chats most trainers rely on.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
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
                style={{ color: "var(--trainer)" }}
              >
                {f.stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings breakdown */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          How trainers earn on Binectics
        </h2>
        <p
          className="text-[16px] max-w-[52ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Three revenue streams, one payout schedule. Diversify your income
          without adding complexity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {EARNINGS.map((e) => (
            <div
              key={e.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {e.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {e.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg-2)" }}
        >
          <blockquote
            className="text-[17px] sm:text-[19px] leading-[1.5] max-w-[58ch] mb-5"
            style={{ color: "var(--ink)" }}
          >
            &ldquo;I went from 12 clients managing everything via WhatsApp to
            42 clients with zero admin overhead. The rebooking nudges alone
            are worth it — I stopped losing clients to forgetfulness.&rdquo;
          </blockquote>
          <div
            className="text-[14px] leading-[1.5]"
            style={{ color: "var(--fg-3)" }}
          >
            Sarah Okafor, CSCS &middot; Certified Personal Trainer &middot;
            Cape Town &middot; 42 active clients
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
                className="text-[32px] font-medium mt-1"
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
          className="text-[16px] max-w-[52ch] leading-[1.5] mb-6"
          style={{ color: "var(--fg-2)" }}
        >
          List your practice for free. We charge 4.9% on transactions —
          nothing else. No monthly fee, no per-client charge.
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
          Your next client is searching right now
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[46ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Create your profile in under 10 minutes. Start showing up in
          marketplace results today.
        </p>
        <Link href="/register" className="btn-primary-v2 lg">
          List your practice — free
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
