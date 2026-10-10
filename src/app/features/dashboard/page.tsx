import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { DashboardDemo } from "@/components/ds/DashboardDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Four role-based dashboards in one login. Gym owners, trainers, dietitians, and members each get purpose-built views, KPIs, and actions.",
  keywords:
    "gym dashboard, trainer dashboard, dietitian dashboard, fitness management software, role-based dashboard",
};

const PAIN_POINTS = [
  { before: "5 tabs to see one client's history", after: "Everything on one screen" },
  { before: "Export to Excel for monthly reports", after: "Revenue and check-ins on your dashboard" },
  { before: "Separate logins for billing, schedule, CRM", after: "One login, one set of data" },
  { before: "WhatsApp groups to coordinate staff", after: "Built-in team views and roles" },
];

const ROLE_VIEWS = [
  {
    role: "Gym Owner",
    accent: "var(--gym)",
    headline: "Operations at a glance",
    items: [
      "Revenue for the last 30 days, with a daily chart and revenue by plan",
      "Today's check-ins, with who arrived and when",
      "Members list with plan, status and payment history, exportable to CSV",
      "Class timetable with capacity and waitlists",
      "Staff roles with their own permission scopes",
      "Several branches as listings under one organization",
    ],
  },
  {
    role: "Personal Trainer",
    accent: "var(--trainer)",
    headline: "Clients and sessions",
    items: [
      "Client roster with each client's program, journal and weight logs",
      "Session types and weekly hours that clients book from",
      "Program builder with daily tasks on a schedule",
      "Program adherence: the share of due tasks each client has done",
      "Earnings, with each currency shown as it was paid",
      "Sessions log you can export to CSV",
    ],
  },
  {
    role: "Dietitian",
    accent: "var(--dietitian)",
    headline: "Plans and clients",
    items: [
      "Weekly meal plans, built day by day and meal by meal",
      "Food library with macros per food, exportable to CSV",
      "Meal feedback: clients log meals and rate how each one went",
      "Consultation types and weekly hours that clients book from",
      "Intake and check-in forms, with answers on the client profile",
      "Earnings from your consultations and plans",
    ],
  },
  {
    role: "Member",
    accent: "var(--consumer)",
    headline: "Your fitness in one place",
    items: [
      "Active memberships and plans with renewal dates",
      "Check-in streak, with your current and longest streak",
      "Upcoming sessions with your trainer or dietitian",
      "Your own weight, meal and workout logs, next to your provider's notes",
      "A receipt page for every booking, printable from your browser",
      "Marketplace to find gyms, trainers and dietitians near you",
    ],
  },
];

const SHARED_FEATURES = [
  { title: "Unified notifications", desc: "One inbox for bookings, payments, check-ins, and journal updates. Push, email, or in-app, you pick." },
  { title: "Cross-role visibility", desc: "Gym owners see trainer schedules. Trainers see member check-ins. Everyone works from the same data." },
  { title: "Check-ins without refreshing", desc: "The kiosk page updates every few seconds and the check-ins page every 30 seconds, so arrivals show up on their own." },
  { title: "Works on your phone", desc: "Every dashboard is built to work on a phone as well as on a desktop." },
  { title: "Quick search", desc: "Press Cmd+K, or Ctrl+K on Windows, to jump to any page." },
  { title: "CSV exports", desc: "Export your member list, sessions log, or food library to CSV." },
  { title: "Roles and permissions", desc: "Create staff roles and choose what each one can see and change, from check-ins to payouts." },
  { title: "Messaging", desc: "Message your clients and members directly. Gyms can also send one message to every member." },
];

export default function DashboardFeaturePage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          Platform
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[20ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Four dashboards.{" "}
          <em className="font-serif font-normal italic">One login</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Gym owners, trainers, dietitians, and members each get a
          purpose-built dashboard with role-specific KPIs, actions, and views,
          all on the same platform, all sharing the same data layer.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup" className="btn-primary-v2 lg">
            Try it free &rarr;
          </Link>
          <Link href="/#roles" className="btn-ghost-v2 lg">
            See role overview
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
          One platform, four views
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Click a role to see what their dashboard looks like. Same data
          layer, purpose-built surfaces.
        </p>
        <DashboardDemo />
      </section>

      {/* Pain points */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[24px] sm:text-[28px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          The problem with &ldquo;good enough&rdquo; tools
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

      {/* Role-specific dashboards */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What each role actually sees
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Same platform, different views. Every role gets exactly the
          information and actions they need, nothing more, nothing less.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ROLE_VIEWS.map((rv) => (
            <div
              key={rv.role}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: rv.accent }}
                />
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  {rv.role}
                </span>
              </div>
              <h3
                className="text-[18px] font-medium mb-3"
                style={{ color: "var(--ink)" }}
              >
                {rv.headline}
              </h3>
              <ul className="space-y-2">
                {rv.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-[1.5]"
                    style={{ color: "var(--fg-2)" }}
                  >
                    <span
                      className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--border-2)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Shared features */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Shared across every role
        </h2>
        <p
          className="text-[16px] max-w-[52ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          These features work the same whether you&apos;re a gym owner with 4
          locations or a member with one subscription.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SHARED_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-5"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[15px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-[13.5px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
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
          See it for yourself
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[46ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Create a free account and explore the dashboard for your role. No
          credit card, no demo call, no 14-day countdown.
        </p>
        <Link href="/login?mode=signup" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
