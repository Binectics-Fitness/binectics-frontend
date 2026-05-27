import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { JournalDemo } from "@/components/ds/JournalDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Journals — Binectics",
  description:
    "Trainers and dietitians log workouts, meals, metrics, and notes. Clients see their own progress in real time. Built for accountability.",
  keywords:
    "client journal, fitness progress tracking, trainer notes, dietitian meal log, workout journal, adherence tracking",
};

const WORKFLOW = [
  {
    step: "01",
    title: "Log an entry",
    desc: "After a session, consultation, or weigh-in — tap, type, done. Structured fields for metrics, free text for everything else. Under 90 seconds per entry.",
  },
  {
    step: "02",
    title: "Client gets notified",
    desc: "In-app notification the moment you save. Optional weekly email digest with a summary of the week's entries and trend direction.",
  },
  {
    step: "03",
    title: "Both see the trend",
    desc: "Weight graph, adherence score, streak counter, photo timeline. The same data, the same view — no information asymmetry between provider and client.",
  },
];

const ENTRY_TYPES = [
  {
    title: "Workout log",
    desc: "Exercises, sets, reps, weight, RPE, tempo, and rest periods. Superset grouping, drop sets, and notes per exercise. Auto-calculates total volume.",
    fields: "Exercise · Sets × Reps · Weight · RPE · Tempo · Rest · Notes",
  },
  {
    title: "Nutrition log",
    desc: "Meals logged against the prescribed plan. Per-meal macro breakdown (protein, carbs, fat, fibre). Daily adherence score calculated automatically from plan vs actual.",
    fields: "Meal name · Foods · Portion · Protein · Carbs · Fat · Fibre · Score",
  },
  {
    title: "Body metrics",
    desc: "Weight, body fat percentage, circumference measurements (waist, chest, arms, thighs), and progress photos. Photo comparison slider for 30/60/90-day views.",
    fields: "Weight · Body fat % · Waist · Chest · Arms · Thighs · Photo",
  },
  {
    title: "Progress notes",
    desc: "Free-text clinical notes visible only to the provider, or shared notes the client can read. Mood, energy, sleep quality, and pain-level selectors for quick structured input.",
    fields: "Notes · Mood · Energy · Sleep · Pain level · Visibility toggle",
  },
];

const PROVIDER_VIEWS = [
  {
    role: "For Trainers",
    accent: "var(--trainer)",
    items: [
      "Program adherence rate — percentage of prescribed workouts completed",
      "Volume progression graph — total weekly volume trending over 12 weeks",
      "Exercise PB tracking — automatic personal best detection per lift",
      "Session attendance — no-show rate, cancellation rate, reschedule patterns",
      "Client comparison — anonymised benchmarks across your roster",
    ],
  },
  {
    role: "For Dietitians",
    accent: "var(--dietitian)",
    items: [
      "Macro compliance graph — daily actuals vs prescribed targets over 30 days",
      "Meal plan adherence — which meals get skipped, which get substituted",
      "Weight trend with moving average — smooths out daily fluctuation noise",
      "Clinical note timeline — filterable by date, tag, or condition",
      "Photo timeline — side-by-side comparison with measurement overlay",
    ],
  },
];

const FEATURES = [
  { title: "Photo timeline", desc: "Front, side, and back photos with date stamps. Swipe comparison and overlay mode for visual progress tracking." },
  { title: "Trend graphs", desc: "Weight, volume, adherence, and custom metrics graphed over 7, 30, 90, or 365 days. Exportable as PNG or CSV." },
  { title: "Adherence scoring", desc: "0–100 score calculated from plan compliance. Configurable thresholds: what counts as 'on track' is up to you." },
  { title: "Client-visible feed", desc: "Clients see their own journal entries, graphs, and milestones. Read-only — they can't edit your notes." },
  { title: "PDF export", desc: "Generate a branded progress report for any date range. Logo, client name, metrics, graphs, and notes in a clean 2-page layout." },
  { title: "Milestone alerts", desc: "Automatic celebrations at streak milestones (7, 30, 90 days), PBs, and weight targets. Custom milestones available." },
  { title: "Smart reminders", desc: "If a client hasn't logged in 3+ days, they get a gentle nudge. If a provider hasn't journaled post-session, they get one too." },
  { title: "Template entries", desc: "Save common entry structures as templates. 'Leg day log', 'Weekly weigh-in', 'Initial consultation' — one tap to start." },
];

const KPIS = [
  { label: "Avg entries / client / week", value: "3.4" },
  { label: "Client retention lift", value: "+34%" },
  { label: "Time to log", value: "82 s" },
  { label: "Active journals", value: "9,241" },
];

export default function ClientJournalsPage() {
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
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[22ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Progress you can see.{" "}
          <em className="font-serif font-normal italic">Notes they can read</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Trainers and dietitians log workouts, meals, weight, mood, and
          adherence after every session. Clients see their own journal in
          real time — same data, same graphs, no surprises.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-primary-v2 lg">
            Start journaling free &rarr;
          </Link>
          <Link href="/for-trainers" className="btn-ghost-v2 lg">
            For trainers
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
          Two perspectives, one timeline
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Watch entries appear as a trainer logs them, then switch to
          the client&rsquo;s read-only view of the same data.
        </p>
        <JournalDemo />
      </section>

      {/* How it works */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-8"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WORKFLOW.map((w) => (
            <div
              key={w.step}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[28px] font-medium mb-3"
                style={{ color: "var(--border-2)" }}
              >
                {w.step}
              </div>
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {w.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Entry types */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Four entry types, one timeline
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Each entry type has structured fields for fast input and free text
          for context. Everything lands on the same chronological timeline.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ENTRY_TYPES.map((et) => (
            <div
              key={et.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {et.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55] mb-4"
                style={{ color: "var(--fg-2)" }}
              >
                {et.desc}
              </p>
              <div
                className="font-mono text-[11px] leading-[1.6] px-3 py-2 rounded-(--r-2)"
                style={{
                  background: "var(--bg)",
                  color: "var(--fg-3)",
                  border: "1px solid var(--border)",
                }}
              >
                {et.fields}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provider-specific views */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Same journal, different lens
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Trainers care about volume and attendance. Dietitians care about
          compliance and weight trends. Each role sees the metrics that
          matter to their practice.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PROVIDER_VIEWS.map((pv) => (
            <div
              key={pv.role}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: pv.accent }}
                />
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  {pv.role}
                </span>
              </div>
              <ul className="space-y-2.5">
                {pv.items.map((item) => (
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

      {/* Features grid */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Everything you need to track progress
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FEATURES.map((f) => (
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
          Your clients deserve better than a spreadsheet
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[48ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Start logging today. Your first 5 clients are free — no trial
          countdown, no feature gates.
        </p>
        <Link href="/register" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
