import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { KioskDemo } from "@/components/ds/KioskDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Check-in",
  description:
    "QR check-in for gyms: a screen at your door shows a QR code that changes every minute, members scan it with their phone, and each visit lands on your dashboard.",
  keywords:
    "gym check-in, QR attendance, touchless check-in, gym kiosk, attendance tracking, member streaks, gym access control",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Put a screen at the door",
    desc: "Any tablet, phone or computer with a web browser. There is no app to install and nothing to pair.",
  },
  {
    step: "02",
    title: "Open the check-in kiosk",
    desc: "Open Check-in kiosk from your dashboard on that screen and leave it on. It shows a QR code that changes every minute, so a photo or screenshot of it stops working.",
  },
  {
    step: "03",
    title: "Members scan with their phone",
    desc: "With the Binectics app or their phone camera. Members with an active plan are checked in and see their streak on their phone. Anyone else is turned away.",
  },
];

const GYM_OWNER_FEATURES = [
  { title: "Today's arrivals", desc: "Every check-in shows on your kiosk page with the member's name and time. The kiosk page updates every few seconds, so there is no need to refresh." },
  { title: "Declined attempts", desc: "Scans from people without an active plan are turned away and listed on the kiosk page, so the front desk can follow up." },
  { title: "Check-in history", desc: "A check-ins page with your gym's recent check-ins, updated every 30 seconds while it is open." },
  { title: "Only paying members get in", desc: "A scan only counts when the member has an active plan at your gym. Lapsed members are declined at the door." },
  { title: "A code that can't be shared", desc: "The QR code changes every minute and is checked when it is scanned, so printed copies, photos and shared links stop working." },
  { title: "Free on every plan", desc: "QR check-in is included on every gym plan, including Free." },
];

const MEMBER_FEATURES = [
  { title: "Scan with your phone", desc: "Open Check in in the Binectics app, or use your phone's camera, and point it at the code at the door. No card, no PIN." },
  { title: "Streaks", desc: "Your current and longest check-in streak, counted per day at your gym. Miss a day and the current streak starts again." },
  { title: "Visit history", desc: "Every check-in is kept with its date and time, and shows in your activity in the app." },
  { title: "Milestone badges", desc: "The streaks page on the web shows badges for streaks of 7, 30, 50, 100 and 365 days, and for 10 to 500 total check-ins." },
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
          A quick scan at the door.{" "}
          <em className="font-serif font-normal italic">Every visit counts</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          A QR code on a screen at your door, scanned by members with their
          own phone. Each visit lands on your dashboard, and only members
          with an active plan get in. No card readers, no PINs, nothing to
          install.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup&role=gym" className="btn-primary-v2 lg">
            Set up check-in &rarr;
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
          The gym&rsquo;s screen shows the code. The member scans it with
          their phone, and the arrival shows on the kiosk page. Pick a member
          to see a check-in, or a scan from someone without an active plan.
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
          Every scan is recorded, so you know who came in and when, and who
          was turned away.
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
          Checking in takes a few seconds and counts toward the
          member&rsquo;s streak.
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
          Open the check-in kiosk from your dashboard on any screen. Free on
          every Binectics gym plan.
        </p>
        <Link href="/login?mode=signup&role=gym" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
