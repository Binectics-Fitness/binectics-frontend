import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Find answers to common questions about using Binectics as a member or provider.",
};

/**
 * Help center — help.html prototype. Pixel-perfect rebuild.
 * Hero: max-w-1080, 88px top padding, 64px h1, r-3 search box at 720px.
 * Quick cards: bg-2, 22px icon, hover→bg. Categories: 3-col, 32px icon square, 17px title.
 * Trending: 2-col card grid. Contact: 3-col, 28px padding, ink middle card.
 */

const QUICK = [
  { icon: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>, title: "Reschedule a session", desc: "Free until 24 hours before · pick a new slot from your provider's calendar" },
  { icon: <><path d="M3 10h13a5 5 0 1 1 0 10h-3"/><path d="m7 6-4 4 4 4"/></>, title: "Request a refund", desc: "Open a dispute from your booking page · decision within 24 hours" },
  { icon: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></>, title: "Update payment method", desc: "Add or remove cards · switch primary · use mobile money" },
  { icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, title: "Reset password", desc: "Email link expires in 30 minutes · check spam if you don't see it" },
];

const CATEGORIES = [
  { icon: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>, title: "Bookings & sessions", count: 68, articles: ["How a booking gets confirmed", "Reschedule or cancel a session", "Check in with the QR code", "Recurring bookings explained"] },
  { icon: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></>, title: "Payments & refunds", count: 54, articles: ["How the platform fee works", "When refunds arrive on your card", "Failed payments & retries", "Using Apple Pay & mobile money"] },
  { icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>, title: "Your account", count: 42, articles: ["Change your email or phone", "Set up two‑factor authentication", "Manage notification settings", "Download a copy of your data"] },
  { icon: <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>, title: "Provider onboarding", count: 71, articles: ["List your gym, studio, or practice", "What documents we need to verify", "Set up your packages & pricing", "Connect your payment gateway"] },
  { icon: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></>, title: "QR check‑in & kiosk", count: 28, articles: ["Set up the kiosk app on an iPad", "Wall‑mount the kiosk · hardware list", "What to do if QR scanning fails", "Streak tracking explained"] },
  { icon: <><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-7"/></>, title: "Plans & programming", count: 46, articles: ["Build a 12‑week program", "Customize the plan builder library", "Deliver PDF plans to clients", "Adherence & check‑in data"] },
  { icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>, title: "Earnings & payouts", count: 38, articles: ["When payouts arrive in your account", "Set up your payout schedule", "Tax statements & SARS forms", "Multi‑currency settlements"] },
  { icon: <path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z"/>, title: "Trust & safety", count: 31, articles: ["How verification works", "Reporting a listing or review", "Our refund & protection policy", "Conduct & community guidelines"] },
  { icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></>, title: "Technical issues", count: 34, articles: ["App keeps crashing on Android", "Calendar sync isn't working", "QR scanner is slow at low light", "Browser compatibility notes"] },
];

const TRENDING = [
  { cat: "Payments & refunds", title: "When will my refund show up on my card?", desc: "Card refunds take 2–5 business days. Bank transfers usually settle next business day. We send a receipt the moment we issue the refund.", views: "4,128" },
  { cat: "Bookings & sessions", title: "My provider hasn't confirmed my booking · what now?", desc: "Confirmations usually come within 4 hours. If 12+ have passed with no response, your card is released automatically — no charge to you.", views: "3,402" },
  { cat: "Account", title: "Two‑factor codes aren't arriving by SMS", desc: "Three things to try, in order: switch to authenticator app, check carrier filters, change your country code. The walkthrough sorts 92% of cases.", views: "2,948" },
  { cat: "QR check‑in", title: "Streak broke even though I checked in · why?", desc: "Time zones. Streaks are calculated in your home time zone, not the gym's. If you travel, switch your time zone in settings before midnight local.", views: "2,184" },
  { cat: "Provider onboarding", title: "Why hasn't my listing been approved yet?", desc: "Average approval time is 36 hours. The most common reason for delay is a low‑resolution business document. Re‑upload at 1200×1500 or higher.", views: "1,866" },
  { cat: "Earnings & payouts", title: "My payout is smaller than I expected", desc: "Three reasons account for nearly all variance: refunds inside the payout window, gateway fees, and exchange rate at settlement time. We show all three in your statement.", views: "1,422" },
];

const CONTACTS = [
  { icon: <path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z"/>, title: "In‑app chat", desc: "Open the chat bubble from any page. Replies usually within an hour on weekdays, four hours overnight or weekends.", meta: "3 humans online now · Cape Town & Lagos" },
  { icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></>, title: "Email a real person", desc: <><strong style={{ color: "var(--bg)", fontWeight: 500 }}>help@binectics.com</strong> · best for refunds, billing questions, anything you need a paper trail for. 4‑hour SLA, weekdays SAST.</>, meta: "Avg first reply · 1h 38m this week", ink: true },
  { icon: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></>, title: "WhatsApp", desc: <>For providers in regions where WhatsApp is the preferred channel. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>+27 82 ••• 2024</strong> · expect a reply within 6 hours SAST.</>, meta: "South Africa & Nigeria only", dotColor: "var(--gym)" },
];

export default function HelpPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero — max-w-1080, padding: 88px 40px 64px, h1: 64px */}
      <section className="mx-auto text-center px-5 sm:px-10" style={{ maxWidth: "1080px", paddingTop: "88px", paddingBottom: "64px" }}>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Help center · 412 articles · 5 languages</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] font-medium" style={{ lineHeight: 0.96, letterSpacing: "-0.04em", color: "var(--ink)", marginTop: "18px" }}>
          What can we <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>help</em> with?
        </h1>
        <p className="text-[17px] mx-auto max-w-[60ch] leading-[1.55]" style={{ color: "var(--fg-2)", marginTop: "22px" }}>Most answers live below. If they don&apos;t, the contact options at the bottom of this page reach a real human within four hours on weekdays.</p>

        {/* Search box — max-w-720, r-3, padding 14px 18px */}
        <div className="mx-auto flex items-center gap-3 rounded-(--r-3)" style={{ maxWidth: "720px", marginTop: "36px", padding: "14px 18px", border: "1px solid var(--border)", background: "var(--bg)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span className="flex-1 text-[16px] text-left" style={{ color: "var(--fg-3)" }}>Ask anything · refund a session, change my plan, dispute a charge…</span>
          <span className="font-mono text-[11px] px-2 py-0.75 rounded-[4px]" style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>⌘ K</span>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.05em] mt-3" style={{ color: "var(--fg-3)" }}><strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>2,481 searches</strong> answered this week · avg time to article 4 seconds</div>
      </section>

      {/* Quick links — bg-2 cards, 22px icon */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {QUICK.map((q) => (
            <div key={q.title} className="flex flex-col gap-2 rounded-(--r-3) cursor-pointer hover:border-ink hover:bg-bg" style={{ padding: "18px 20px", border: "1px solid var(--border)", background: "var(--bg-2)", transition: "border-color var(--motion-fast), background var(--motion-fast)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink)" }}>{q.icon}</svg>
              <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{q.title}</div>
              <div className="text-[12.5px] leading-[1.45]" style={{ color: "var(--fg-3)" }}>{q.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories — 3-col, 32px icon square, 17px title, article links */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-baseline gap-3.5 mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>01</span>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Browse by topic</h2>
          <div className="flex-1 border-b border-border mb-1.5" />
          <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>9 categories · 412 articles</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="flex flex-col gap-3.5 rounded-(--r-3)" style={{ padding: "24px", border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="w-8 h-8 rounded-(--r-2) flex items-center justify-center shrink-0" style={{ background: "var(--bg-2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink)" }}>{c.icon}</svg>
                </div>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-right" style={{ color: "var(--fg-3)" }}>{c.count} articles</span>
              </div>
              <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{c.title}</div>
              <div className="flex flex-col gap-px mt-0.5">
                {c.articles.map((a, i) => (
                  <span key={a} className="flex justify-between items-center py-2 text-[13.5px] cursor-pointer hover:text-ink" style={{ color: "var(--fg-2)", borderBottom: i < c.articles.length - 1 ? "1px solid var(--border)" : "none", transition: "color var(--motion-fast)" }}>
                    {a}
                    <span className="font-mono" style={{ color: "var(--fg-4)" }}>→</span>
                  </span>
                ))}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] pt-2 cursor-pointer hover:text-ink" style={{ color: "var(--fg-3)", borderTop: "1px solid var(--border)" }}>All {c.count} articles →</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending — 2-col card grid */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-baseline gap-3.5 mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>02</span>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Trending this week</h2>
          <div className="flex-1 border-b border-border mb-1.5" />
          <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>Most opened · last 7 days</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {TRENDING.map((t) => (
            <div key={t.title} className="flex justify-between gap-4.5 items-start rounded-(--r-3) cursor-pointer hover:border-ink" style={{ padding: "18px 22px", border: "1px solid var(--border)", background: "var(--bg)", transition: "border-color var(--motion-fast)" }}>
              <div className="flex-1 min-w-0">
                <span className="inline-block font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-(--r-1) mb-2" style={{ color: "var(--fg-3)", border: "1px solid var(--border)", background: "var(--bg-2)" }}>{t.cat}</span>
                <div className="text-[16px] font-medium leading-[1.3]" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{t.title}</div>
                <div className="text-[13px] mt-1.5 leading-[1.55]" style={{ color: "var(--fg-2)" }}>{t.desc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Opens / week</div>
                <div className="text-[12.5px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{t.views}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact — 3-col, 28px padding, ink middle card, 28px icon */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-baseline gap-3.5 mb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>03</span>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Still need a human?</h2>
          <div className="flex-1 border-b border-border mb-1.5" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {CONTACTS.map((c) => (
            <div key={c.title} className="flex flex-col gap-3.5 rounded-(--r-3)" style={{ padding: "28px", border: `1px solid ${c.ink ? "var(--ink)" : "var(--border)"}`, background: c.ink ? "var(--ink)" : "var(--bg)", color: c.ink ? "var(--bg)" : undefined }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c.ink ? "var(--bg)" : "var(--ink)" }}>{c.icon}</svg>
              <div className="text-[18px] font-medium" style={{ letterSpacing: "-0.012em", color: c.ink ? "var(--bg)" : "var(--ink)" }}>{c.title}</div>
              <div className="text-[13.5px] leading-[1.55]" style={{ color: c.ink ? "oklch(0.82 0.005 85)" : "var(--fg-2)" }}>{c.desc}</div>
              <div className="flex items-center gap-1.5 mt-auto font-mono text-[11px] uppercase tracking-[0.05em] pt-3.5" style={{ color: c.ink ? "oklch(0.65 0.005 85)" : "var(--fg-3)", borderTop: `1px solid ${c.ink ? "oklch(0.3 0.008 80)" : "var(--border)"}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dotColor || "var(--signal)" }} />
                {c.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
