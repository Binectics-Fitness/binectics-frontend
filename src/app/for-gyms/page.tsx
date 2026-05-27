import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { GymOwnerDemo } from "@/components/ds/GymOwnerDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Gym Owners — Binectics",
  description:
    "Manage memberships, check-ins, payouts, staff, and multi-location operations from a single dashboard. Replace Mindbody, spreadsheets, and WhatsApp groups with one platform.",
  keywords:
    "gym management software, gym dashboard, member CRM, QR check-in, gym payouts, multi-location gym, class scheduling, gym owner tools",
};

const PAIN_POINTS = [
  {
    before: "Mindbody for bookings, Excel for members, WhatsApp for staff",
    after: "One dashboard for everything",
  },
  {
    before: "Manual attendance sheets at the front desk",
    after: "QR check-in with streaks and live feed",
  },
  {
    before: "Monthly revenue guesswork until the accountant calls",
    after: "Real-time P&L with payout timeline",
  },
  {
    before: "5 logins across 5 tools that don't talk to each other",
    after: "Single sign-on, unified data layer",
  },
];

const FEATURES = [
  {
    title: "Member CRM",
    desc: "Profiles, streaks, payment history, and custom tags in one searchable directory. Filter by status, plan, last check-in, or any custom field you create.",
    stat: "10k members indexed in 30ms",
  },
  {
    title: "Class scheduling",
    desc: "Drag-and-drop weekly schedule with recurring classes, waitlists, and capacity alerts. Members book from the app and get automatic reminders.",
    stat: "Avg class fill rate 84%",
  },
  {
    title: "QR check-in",
    desc: "Mount an iPad at the door and let members scan in. The kiosk shows their name, streak count, and next class. Offline queue syncs when connectivity returns.",
    stat: "92.4% first-scan success",
  },
  {
    title: "Revenue dashboard",
    desc: "Daily, weekly, and monthly revenue graphs with comparison overlays. Payout timeline shows the next amount, date, and destination bank. Gateway reconciliation built in.",
    stat: "R 1.08M avg monthly processed",
  },
  {
    title: "Multi-location",
    desc: "Shared member directory across all branches with separate P&Ls per location. Consolidated reporting when you need the big picture, location switcher when you don't.",
    stat: "Up to 12 locations per account",
  },
  {
    title: "Staff management",
    desc: "Define roles with granular permissions. Receptionists see check-ins but not payouts. Managers edit schedules but can't change billing. Shift scheduling and attendance tracking included.",
    stat: "Granular access for 6 role types",
  },
];

const KPIS = [
  { label: "Avg setup time", value: "4 days" },
  { label: "Member churn drop", value: "-28%" },
  { label: "Admin time saved", value: "12 h/wk" },
  { label: "Active gyms", value: "684" },
];

export default function ForGymsPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          For gym owners
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[20ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Run your gym in{" "}
          <em className="font-serif font-normal italic">one tab</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Members, schedule, check-ins, payouts, payroll, marketing — all in
          one place. No more Excel + Mindbody + WhatsApp groups.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-primary-v2 lg">
            Get started free &rarr;
          </Link>
          <Link href="/features/dashboard" className="btn-ghost-v2 lg">
            See the dashboard
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
          Your gym, at a glance
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Revenue, members, classes, and payouts — all on one screen.
          Click a tab to explore.
        </p>
        <GymOwnerDemo />
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
          The problem with bolted-together tools
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
          Everything a gym needs to operate
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Six core modules that replace the patchwork of tools most gyms
          cobble together. Each one is built for fitness, not retrofitted
          from generic SaaS.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="w-8 h-8 rounded-(--r-2) mb-4"
                style={{ background: "var(--bg)" }}
              />
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

      {/* Testimonial */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-8"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What gym owners are saying
        </h2>
        <div
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg-2)" }}
        >
          <p
            className="text-[17px] leading-[1.55] max-w-[58ch]"
            style={{ color: "var(--ink)" }}
          >
            &ldquo;We replaced Mindbody, a spreadsheet, and three WhatsApp
            groups with Binectics. Setup took four days. Our front desk staff
            figured it out without training.&rdquo;
          </p>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.04em] mt-5"
            style={{ color: "var(--fg-3)" }}
          >
            David Okafor, Owner &middot; Iron Lab Sea Point &middot; 1,284
            members &middot; 4 locations
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          By the numbers
        </h2>
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
        className="mx-auto max-w-280 px-5 sm:px-8 py-12 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Transparent pricing
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[48ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          One plan, no tiers, no per-member fees. 4.9% on transactions.
          That&rsquo;s it.
        </p>
        <Link href="/pricing" className="btn-ghost-v2 lg">
          See full pricing &rarr;
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
          Your gym deserves better tools
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[50ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Create a free account and see the dashboard in under 10 minutes.
          No credit card required.
        </p>
        <Link href="/register" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
