import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { KioskDemo } from "@/components/ds/KioskDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Check-in — Binectics",
  description:
    "Touchless attendance with 92% scan success. iPad kiosks at the door, real-time streak tracking, and a 2-second check-in that members actually enjoy.",
  keywords:
    "gym check-in, QR attendance, touchless check-in, gym kiosk, attendance tracking, member streaks, gym access control",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Mount a kiosk at the door",
    desc: "Any iPad or Android tablet running the Binectics Kiosk app. Mount it, connect to Wi-Fi, pair it to your gym in settings. Setup takes under 10 minutes.",
  },
  {
    step: "02",
    title: "Members scan on entry",
    desc: "Each member has a unique QR code in the Binectics app. Hold it up to the kiosk camera — no tap, no PIN, no card. The scanner auto-detects in under 400ms.",
  },
  {
    step: "03",
    title: "The kiosk responds instantly",
    desc: "Name, photo, streak count, next class — all rendered in a 2-second animated sequence. The member feels recognized. The gym gets timestamped attendance data.",
  },
];

const GYM_OWNER_FEATURES = [
  { title: "Live attendance feed", desc: "Every check-in appears on your dashboard in real time. Name, photo, timestamp, subscription status. See your gym fill up as the morning rush hits." },
  { title: "Streak analytics", desc: "Members with active streaks churn 43% less. See streak distribution, identify members at risk of breaking, and send auto-nudges at configurable thresholds." },
  { title: "Capacity monitoring", desc: "Set your gym's max capacity. The dashboard shows current occupancy as a percentage. Optional: kiosk displays 'at capacity' when the limit is reached." },
  { title: "Peak hour heatmap", desc: "Hourly check-in volume for every day of the week, visualised as a heatmap. Use it to plan staffing, schedule popular classes, and identify dead hours." },
  { title: "Multi-location support", desc: "Members can check in at any of your locations. Each location has its own kiosk, its own attendance data, and its own leaderboard — or one combined view." },
  { title: "Offline resilience", desc: "If Wi-Fi drops, the kiosk queues check-ins locally and syncs when connectivity returns. Members never get stuck at the door." },
];

const MEMBER_FEATURES = [
  { title: "Personal streaks", desc: "Consecutive-day and weekly visit counters. Personal best tracking. Break a streak and start rebuilding — the counter remembers your record." },
  { title: "Visit history", desc: "Every check-in logged with date, time, and location. Exportable as CSV. Useful for insurance claims, employer wellness programs, and personal records." },
  { title: "Next class preview", desc: "The kiosk shows your next scheduled class, trainer name, and time. First-timers see a welcome message and their assigned trainer's name." },
  { title: "Personalised welcome", desc: "Four flavours: standard returning member, PR potential day, first-timer welcome, and lapsed member re-engagement. The kiosk knows who's at the door." },
];

const TECH_SPECS = [
  { label: "Scan success rate", value: "92.4%" },
  { label: "Avg scan time", value: "380 ms" },
  { label: "Animation duration", value: "2.05 s" },
  { label: "Offline queue", value: "∞" },
  { label: "Min hardware", value: "iPad 8th gen" },
  { label: "Connectivity", value: "Wi-Fi / 4G" },
];

const KPIS = [
  { label: "Daily check-ins (platform)", value: "14.2K" },
  { label: "Member streak avg", value: "18 days" },
  { label: "Churn reduction (streakers)", value: "−43%" },
  { label: "Gyms using kiosk", value: "412" },
];

export default function QRCheckinFeaturePage() {
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
          Two seconds at the door.{" "}
          <em className="font-serif font-normal italic">Every visit counts</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          A QR scan that takes under 400ms. A personalised welcome
          sequence that takes 2 seconds. Attendance data that hits your
          dashboard in real time. No card readers, no PINs, no friction.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup&role=gym" className="btn-primary-v2 lg">
            Set up your kiosk &rarr;
          </Link>
          <Link href="/qr-help" className="btn-ghost-v2 lg">
            Member check-in guide
          </Link>
        </div>
      </section>

      {/* Kiosk demo */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          The check-in experience
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Four members, four contexts. The kiosk recognises who&rsquo;s at
          the door and responds accordingly — standard return, PR day,
          first-timer, or a member who&rsquo;s been away. Click a name to
          see each flow.
        </p>
        <KioskDemo />
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
          Setup in three steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((w) => (
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

      {/* For gym owners */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What gym owners see
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Every scan generates data. Your dashboard turns it into decisions
          — staffing, capacity, retention, and engagement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GYM_OWNER_FEATURES.map((f) => (
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

      {/* For members */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What members get
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Check-in is not just access control — it&rsquo;s the moment the
          gym acknowledges a member by name. That matters for retention.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MEMBER_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[16px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech specs */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[24px] sm:text-[28px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Technical specifications
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {TECH_SPECS.map((s) => (
            <div
              key={s.label}
              className="rounded-(--r-3) p-4"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.04em] mb-1"
                style={{ color: "var(--fg-3)" }}
              >
                {s.label}
              </div>
              <div
                className="text-[20px] font-medium"
                style={{
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {s.value}
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

      {/* CTA */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-14 sm:py-18 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[36px] font-medium mb-4"
          style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}
        >
          Your door should know who&rsquo;s walking through it
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[46ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Set up your first kiosk in under 10 minutes. Free on every
          Binectics gym plan.
        </p>
        <Link href="/login?mode=signup&role=gym" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
