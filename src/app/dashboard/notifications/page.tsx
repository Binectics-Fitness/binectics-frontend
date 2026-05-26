import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Notifications kit — notifications.html prototype.
 * Design spec page (not a user-facing inbox). Sections:
 * - Push iOS: 8 notification cards in 2-col grid
 * - SMS critical: 4 messages with char counts
 * - In-app components: toast/banner/drawer
 * - Voice & tone guidelines with do/don't
 */

const PUSH_CARDS = [
  { title: "Booking confirmed", body: "Sarah confirmed your Wed 08:30 session", actions: "Open booking · Reschedule" },
  { title: "Reminder · 1h before", body: "See you in 60 min at Iron Lab Sea Point", actions: "I'm on my way · Cancel" },
  { title: "Reminder · 24h before", body: "Tomorrow 08:30 with Sarah", actions: "Confirm · Reschedule" },
  { title: "Payment received", body: "R 1,200 paid to your account", actions: "View receipt" },
  { title: "New message", body: "Sarah sent you a quick note", actions: "Reply · View" },
  { title: "Streak milestone", body: "30-day streak unlocked. Personal best.", actions: "See badge" },
  { title: "Payout sent", body: "R 84,200 on its way to your bank", actions: "View statement" },
  { title: "Refund processed", body: "R 1,200 refunded to your card", actions: "OK" },
];

const SMS_MESSAGES = [
  { title: "Booking confirmed", body: "Sarah confirmed your Wed 28 May 08:30 session at Iron Lab Sea Point. Reschedule: bnx.co/r/4421", count: "132/160" },
  { title: "Reminder · 1h before", body: "Reminder: session with Sarah Okafor in 60 min at Iron Lab Sea Point. Bnx.co/b/4421", count: "101/160" },
  { title: "Payment failed", body: "Your Binectics payment of R850 failed. Update card to keep your membership active: bnx.co/p", count: "117/160" },
  { title: "Refund processed", body: "R1,200 refunded to your VISA ****4421. Should appear in 2-5 business days. Questions: help@binectics", count: "152/160" },
];

const COMPONENTS = [
  { title: "Toast", desc: "Transient confirmations. 4s default. Use for: save success, action confirmed, undoable mutations. Never errors." },
  { title: "Banner", desc: "Persistent at page top. Use for: account status, billing issues, system maintenance. Dismissible on demand." },
  { title: "Drawer", desc: "Side panel for notifications and contextual content. Auto-closes on click outside." },
];

export default function NotificationsPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header
        className="flex items-center justify-between"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 32px",
        }}
      >
        <Link href="/" className="flex items-center gap-2 font-medium" style={{ color: "var(--ink)" }}>
          <BinecticsLockup />
        </Link>
        <nav className="flex gap-3.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          <Link href="/dashboard" style={{ color: "var(--fg-2)" }}>Dashboard</Link>
          <Link href="/dashboard/settings" style={{ color: "var(--fg-2)" }}>Settings</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 96px" }}>
        <div
          className="font-mono text-[11px] uppercase"
          style={{ color: "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 14 }}
        >
          Track E &middot; Notifications kit
        </div>
        <h1
          className="text-[40px] font-medium"
          style={{ letterSpacing: "-0.028em", marginBottom: 14, color: "var(--ink)" }}
        >
          Notifications &middot;{" "}
          <em className="font-serif font-normal italic">push &middot; SMS &middot; in-app</em>.
        </h1>
        <p
          className="text-[17px] leading-[1.55] max-w-[60ch]"
          style={{ color: "var(--fg-2)", marginBottom: 36 }}
        >
          Email templates live in the emails page. This page covers everything else: push notification specs for iOS &amp; Android, the 4 critical-path SMS messages, and the in-app component reference.
        </p>

        {/* ── Push iOS ── */}
        <section style={{ paddingTop: 42, borderTop: "1px solid var(--border)", marginTop: 42 }}>
          <h2
            className="text-[26px] font-medium"
            style={{ letterSpacing: "-0.02em", marginBottom: 18, color: "var(--ink)" }}
          >
            Push &middot; <em className="font-serif font-normal italic">iOS</em>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PUSH_CARDS.map((c) => (
              <div
                key={c.title}
                className="rounded-(--r-3)"
                style={{
                  padding: 16,
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {c.title}
                </div>
                <div
                  className="text-[12.5px] mt-1 leading-[1.5]"
                  style={{ color: "var(--fg-2)" }}
                >
                  {c.body}
                </div>
                <div
                  className="font-mono text-[10px] uppercase mt-2.5"
                  style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}
                >
                  Actions &middot; {c.actions}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SMS critical ── */}
        <section style={{ paddingTop: 42, borderTop: "1px solid var(--border)", marginTop: 42 }}>
          <h2
            className="text-[26px] font-medium"
            style={{ letterSpacing: "-0.02em", marginBottom: 18, color: "var(--ink)" }}
          >
            SMS &middot; <em className="font-serif font-normal italic">critical only</em>
          </h2>
          <p
            className="text-[14px] leading-[1.6]"
            style={{ color: "var(--fg-2)", marginBottom: 18 }}
          >
            SMS costs money and trains people to ignore. We use it for exactly 4 things, all transactional, all 160 chars max.
          </p>
          <div className="flex flex-col gap-2">
            {SMS_MESSAGES.map((m) => (
              <div
                key={m.title}
                className="rounded-(--r-3) items-center gap-4"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  padding: 22,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    className="text-[13.5px] font-medium"
                    style={{ color: "var(--ink)", marginBottom: 6 }}
                  >
                    {m.title}
                  </div>
                  <code
                    className="text-[12px] block leading-[1.5]"
                    style={{
                      color: "var(--fg-2)",
                      background: "var(--bg-2)",
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {m.body}
                  </code>
                </div>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                  {m.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── In-app components ── */}
        <section style={{ paddingTop: 42, borderTop: "1px solid var(--border)", marginTop: 42 }}>
          <h2
            className="text-[26px] font-medium"
            style={{ letterSpacing: "-0.02em", marginBottom: 18, color: "var(--ink)" }}
          >
            In-app <em className="font-serif font-normal italic">components</em>
          </h2>
          <p
            className="text-[14px] leading-[1.6]"
            style={{ color: "var(--fg-2)", marginBottom: 18 }}
          >
            Defined in the patterns page and shipped in the component library. Reference here for content guidelines.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {COMPONENTS.map((c) => (
              <div
                key={c.title}
                className="rounded-(--r-3)"
                style={{
                  padding: 22,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <h3
                  className="text-[15px] font-medium"
                  style={{ color: "var(--ink)", marginBottom: 10 }}
                >
                  {c.title}
                </h3>
                <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Voice & tone ── */}
        <section style={{ paddingTop: 42, borderTop: "1px solid var(--border)", marginTop: 42 }}>
          <h2
            className="text-[26px] font-medium"
            style={{ letterSpacing: "-0.02em", marginBottom: 18, color: "var(--ink)" }}
          >
            Voice &amp; tone
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" style={{ margin: "14px 0" }}>
            <div className="rounded-(--r-2)" style={{ padding: 14, background: "var(--signal-soft)" }}>
              <strong
                className="block font-mono text-[11px] uppercase"
                style={{ letterSpacing: "0.06em", color: "var(--signal-ink)", marginBottom: 4 }}
              >
                Do
              </strong>
              Sarah confirmed your Wed 08:30 session.
            </div>
            <div className="rounded-(--r-2)" style={{ padding: 14, background: "var(--danger-soft)" }}>
              <strong
                className="block font-mono text-[11px] uppercase"
                style={{ letterSpacing: "0.06em", color: "var(--danger)", marginBottom: 4 }}
              >
                Don&apos;t
              </strong>
              BOOKING CONFIRMED!!! Your session is locked in
            </div>
          </div>
          <p
            className="text-[13.5px] leading-[1.6]"
            style={{ color: "var(--fg-2)" }}
          >
            Plain language, specific facts, no exclamation marks, no emoji unless explicitly part of the message (a streak milestone), never marketing copy disguised as a notification.
          </p>
        </section>
      </main>
    </div>
  );
}
