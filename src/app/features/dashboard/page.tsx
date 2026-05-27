import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { DashboardDemo } from "@/components/ds/DashboardDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Binectics",
  description:
    "Four role-based dashboards in one login. Gym owners, trainers, dietitians, and members each get purpose-built views, KPIs, and actions.",
  keywords:
    "gym dashboard, trainer dashboard, dietitian dashboard, fitness management software, role-based dashboard",
};

const PAIN_POINTS = [
  { before: "5 tabs to see one client's history", after: "Everything on one screen" },
  { before: "Export to Excel for monthly reports", after: "Real-time KPIs, always current" },
  { before: "Separate logins for billing, schedule, CRM", after: "Single sign-on, unified data" },
  { before: "WhatsApp groups to coordinate staff", after: "Built-in team views and roles" },
];

const ROLE_VIEWS = [
  {
    role: "Gym Owner",
    accent: "var(--gym)",
    headline: "Operations at a glance",
    items: [
      "Daily / weekly / monthly revenue graph with comparison overlay",
      "Live check-in feed — member name, photo, timestamp, streak count",
      "Class schedule heatmap — see which slots are full, which need promotion",
      "Payout timeline — next payout amount, date, and bank destination",
      "Member churn alerts — flags accounts with no check-in in 14+ days",
      "Multi-location switcher — one dashboard, separate P&Ls",
    ],
  },
  {
    role: "Personal Trainer",
    accent: "var(--trainer)",
    headline: "Clients and sessions",
    items: [
      "Active client roster with last session date and rebooking status",
      "Weekly calendar with drag-drop rescheduling and buffer time",
      "Program builder — sets, reps, tempo, rest, with copy-to-next-week",
      "Earnings breakdown — per-client revenue, monthly trend, projected",
      "Session completion rate — how many clients finish prescribed programs",
      "Rebooking nudges — auto-drafted follow-up for clients who haven't rebooked",
    ],
  },
  {
    role: "Dietitian",
    accent: "var(--dietitian)",
    headline: "Plans and compliance",
    items: [
      "Active client list with meal plan status and adherence score",
      "Meal plan editor — drag-drop meals across days, auto-calculate macros",
      "Macro compliance graph — daily actuals vs targets per client",
      "Consultation calendar with video call integration and prep notes",
      "Protocol library — save and reuse plans for common conditions",
      "Revenue dashboard — consultation fees, plan sales, subscription income",
    ],
  },
  {
    role: "Member",
    accent: "var(--consumer)",
    headline: "Your fitness in one place",
    items: [
      "Active subscriptions with renewal dates and payment history",
      "Check-in streak counter with personal best and gym leaderboard",
      "Upcoming sessions — trainer or dietitian, with join/cancel buttons",
      "Progress journal — weight, measurements, photos, mood over time",
      "Invoices and receipts — downloadable PDF for every transaction",
      "Provider discovery — recommended gyms and trainers near you",
    ],
  },
];

const SHARED_FEATURES = [
  { title: "Unified notifications", desc: "One inbox for bookings, payments, check-ins, and journal updates. Push, email, or in-app — you pick." },
  { title: "Cross-role visibility", desc: "Gym owners see trainer schedules. Trainers see member check-ins. Everyone works from the same data." },
  { title: "Real-time sync", desc: "A check-in at the door shows on the gym dashboard in under 400ms. No polling, no refresh button." },
  { title: "Mobile-first responsive", desc: "Every dashboard renders cleanly from 320px phone to 2560px ultrawide. No pinch-zooming required." },
  { title: "Keyboard shortcuts", desc: "Power users navigate with G+D for dashboard, G+C for clients, G+S for settings. Vim-style, discoverable." },
  { title: "Export and API", desc: "CSV and PDF exports for every data table. REST API for gyms that want to pipe data into their own BI tool." },
  { title: "Granular permissions", desc: "Gym staff can view check-ins but not payouts. Receptionist role can't edit class schedules. You set the rules." },
  { title: "Audit log", desc: "Every action is timestamped and attributed. See who changed a member's plan, when, and from what." },
];

const KPIS = [
  { label: "Avg session time", value: "4.2 min" },
  { label: "Actions per session", value: "8.3" },
  { label: "Mobile usage", value: "62%" },
  { label: "Uptime (12mo)", value: "99.97%" },
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
          purpose-built dashboard with role-specific KPIs, actions, and views
          — all on the same platform, all sharing the same data layer.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-primary-v2 lg">
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
          information and actions they need — nothing more, nothing less.
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
          These features work the same whether you're a gym owner with 4
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
        <Link href="/register" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
