import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MemberDemo } from "@/components/ds/MemberDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Members — Binectics",
  description:
    "Find your gym, trainer, or dietitian across 52 countries. One profile, one inbox, one checkout. Binectics is free for members — you pay your provider directly.",
  keywords:
    "fitness marketplace, find gym, find trainer, find dietitian, gym check-in, fitness app, verified trainers, meal tracking, progress journal",
};

const PAIN_POINTS = [
  {
    before:
      "Different app for every gym, trainer, and meal plan",
    after: "One profile across all providers",
  },
  {
    before:
      "WhatsApp booking, bank transfer payment, no receipt",
    after: "Book and pay in the app, receipts auto-generated",
  },
  {
    before:
      "Trainer says you’re progressing but you can’t see the data",
    after: "Same journal, same graphs — no information gap",
  },
  {
    before: "Cancel a session and chase a refund for weeks",
    after: "Refund within 24 hours, mediated by Binectics",
  },
];

const FEATURES = [
  {
    title: "Verified providers",
    desc: "Every trainer, gym, and dietitian is credential-checked by a human. Government ID, professional certs, and background verification. The green badge means something.",
    stat: "100% of providers verified",
  },
  {
    title: "One profile",
    desc: "Bookings, health metrics, payment history, and progress photos — all in one place, across every provider you work with. Switch trainers without losing your data.",
    stat: "Zero data lock-in",
  },
  {
    title: "Check-in streaks",
    desc: "Scan a QR code at the gym door. Your streak counter updates instantly. Miss a day and it resets — no gamification tricks, just a clean record of when you showed up.",
    stat: "32-day avg streak",
  },
  {
    title: "Progress journal",
    desc: "Your trainer or dietitian logs notes, metrics, and plans. You see the same data they see — weight graphs, adherence scores, photo timelines. Read-only, transparent.",
    stat: "3.4 entries/week avg",
  },
  {
    title: "Smart booking",
    desc: "Browse the marketplace, pick a provider, choose a slot, pay. Confirmation in under 60 seconds. Syncs to your calendar automatically.",
    stat: "Under 60s to book",
  },
  {
    title: "Free for members",
    desc: "No subscription fee, no premium tier, no feature gates. You pay your provider directly at their listed price. We take our cut from the provider side.",
    stat: "R 0 platform fee",
  },
];

const KPIS = [
  { label: "Verified providers", value: "14,200" },
  { label: "Countries", value: "52" },
  { label: "Avg check-in streak", value: "32 days" },
  { label: "Member cost", value: "R 0" },
];

export default function ForMembersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          For members
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[20ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Find your gym, trainer, or dietitian &mdash;{" "}
          <em className="font-serif font-normal italic">
            and actually keep going
          </em>
          .
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          14,200 verified providers across 52 countries. One profile, one
          inbox, one checkout. Pay your provider directly &mdash; Binectics is
          free for members.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/marketplace" className="btn-primary-v2 lg">
            Browse marketplace &rarr;
          </Link>
          <Link href="/#how-it-works" className="btn-ghost-v2 lg">
            How it works
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
          Your fitness, in your pocket
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          One app for check-ins, sessions, meal tracking, and progress. Click
          a tab to see each screen.
        </p>
        <MemberDemo />
        <div
          className="mt-6 inline-flex items-center gap-2.5 rounded-(--r-2) px-4 py-2.5"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: "var(--signal)",
              boxShadow: "0 0 0 3px var(--signal-soft)",
            }}
          />
          <span
            className="font-mono text-[12px] uppercase tracking-[0.04em]"
            style={{ color: "var(--fg-2)" }}
          >
            iOS and Android apps coming soon
          </span>
        </div>
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
          The hassle you can skip
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
          Everything you need to stay on track
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Six things that make the difference between signing up and actually
          showing up. Built for people who train, not people who browse.
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
          What members are saying
        </h2>
        <div
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{
            background: "var(--bg-2)",
            borderLeft: "3px solid var(--consumer)",
          }}
        >
          <p
            className="text-[17px] leading-[1.55] max-w-[58ch]"
            style={{ color: "var(--ink)" }}
          >
            &ldquo;I was managing three apps &mdash; one for the gym, one for
            my trainer, one for meal tracking. Now I open Binectics and
            everything is there. My streak counter alone keeps me
            honest.&rdquo;
          </p>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.04em] mt-5"
            style={{ color: "var(--fg-3)" }}
          >
            Tunde Olatunji, Member &middot; Cape Town &middot; 32-day streak
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
          Free. No catch.
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[48ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Members never pay Binectics. You pay your provider directly at
          their listed price. We earn from the provider side &mdash; a 4.9%
          transaction fee.
        </p>
        <Link href="/pricing" className="btn-ghost-v2 lg">
          See provider pricing &rarr;
        </Link>
      </section>

      {/* App coming soon */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="rounded-(--r-3) p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
              style={{
                background: "var(--signal-soft)",
                border: "1px solid oklch(0.88 0.05 148)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--signal)" }}
              />
              <span
                className="font-mono text-[11px] uppercase tracking-[0.04em]"
                style={{ color: "var(--signal-ink)" }}
              >
                Coming soon
              </span>
            </div>
            <h2
              className="text-[24px] sm:text-[28px] font-medium mb-2"
              style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
            >
              The Binectics app
            </h2>
            <p
              className="text-[15px] max-w-[52ch] leading-[1.5]"
              style={{ color: "var(--fg-2)" }}
            >
              Everything you see above — check-ins, bookings, progress
              tracking, marketplace — in a native app for iOS and Android.
              Browse the web marketplace today, and be first to download
              when we launch.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 shrink-0">
            <div
              className="flex items-center gap-3 rounded-(--r-2) px-4 py-3"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                opacity: 0.6,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink)">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div>
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  App Store
                </div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  Coming soon
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 rounded-(--r-2) px-4 py-3"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                opacity: 0.6,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink)">
                <path d="M3.18 23.49L14.1 12.01 3.18.53a1.78 1.78 0 00-.48 1.27v20.4c0 .49.18.94.48 1.29zM15.65 13.56l-3.1-3.1 8.36-4.84a1.56 1.56 0 00-.02-2.73l-8.33-4.82 3.09 3.09 5.5 5.5a1.1 1.1 0 010 1.56l-5.5 5.34zM4.14 24.24l9.51-5.5-2.55-2.55-6.96 8.05zM4.14-.24l6.96 8.05 2.55-2.55L4.14-.24z" />
              </svg>
              <div>
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  Google Play
                </div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  Coming soon
                </div>
              </div>
            </div>
          </div>
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
          Find your next gym, trainer, or dietitian
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[50ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          14,200 verified providers. 52 countries. Zero platform fees.
          Browse the marketplace now — download the app soon.
        </p>
        <Link href="/marketplace" className="btn-primary-v2 lg">
          Browse marketplace &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
