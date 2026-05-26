import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Settings — settings.html prototype.
 * Consumer chrome (nav bar, not dashboard sidebar).
 * 2-col layout: 220px section nav + scrolling sections.
 * Sections: Profile, Preferences, Notifications (matrix), Payment methods (4 cards),
 * Billing history (table 6 rows), Security (password, 2FA, passkey, sessions),
 * Privacy (toggles + data), Linked accounts (4), Danger zone (3 actions).
 */

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className="w-7.5 h-4.5 rounded-full relative cursor-pointer shrink-0"
      style={{ background: on ? "var(--ink)" : "var(--border-2)", marginTop: 2 }}
    >
      <span
        className="absolute w-3.5 h-3.5 rounded-full top-0.5"
        style={{
          background: "var(--bg)",
          left: on ? "14px" : "2px",
          transition: "left var(--motion-fast) var(--ease)",
        }}
      />
    </span>
  );
}

function Check({ on = false, disabled = false }: { on?: boolean; disabled?: boolean }) {
  return (
    <span
      className="w-4.5 h-4.5 rounded-[4px] flex items-center justify-center cursor-pointer"
      style={{
        background: on ? "var(--ink)" : "var(--bg)",
        border: on ? "1px solid var(--ink)" : "1px solid var(--border-2)",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {on && (
        <span
          className="w-2 h-1.25 inline-block"
          style={{
            borderLeft: "1.5px solid var(--bg)",
            borderBottom: "1.5px solid var(--bg)",
            transform: "rotate(-45deg) translateY(-1px)",
          }}
        />
      )}
    </span>
  );
}

const SEC_NAV = [
  {
    group: "Account",
    items: [
      { id: "profile", label: "Profile", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
      { id: "preferences", label: "Preferences", icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8" /></> },
      { id: "notifications", label: "Notifications", icon: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0" /> },
    ],
  },
  {
    group: "Money",
    items: [
      { id: "payments", label: "Payment methods", icon: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></> },
      { id: "billing", label: "Billing history", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></> },
    ],
  },
  {
    group: "Security",
    items: [
      { id: "security", label: "Sign-in & 2FA", icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></> },
      { id: "privacy", label: "Privacy", icon: <path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z" /> },
      { id: "linked", label: "Linked accounts", icon: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></> },
    ],
  },
  {
    group: "Danger",
    items: [
      { id: "danger", label: "Close account", icon: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>, danger: true },
    ],
  },
];

const NOTIF_ROWS = [
  { label: "Booking confirmations", sub: "When a provider accepts", email: true, push: true, sms: false },
  { label: "Session reminders", sub: "24h and 1h before", email: true, push: true, sms: true },
  { label: "Messages from providers", sub: "When Sarah, Nadia, or others write", email: false, push: true, sms: false },
  { label: "Payment receipts", sub: "Charges, refunds, payouts", email: true, push: false, sms: false },
  { label: "Streaks & milestones", sub: "Day 30, day 100, etc", email: false, push: true, sms: false },
  { label: "Weekly summary", sub: "Sundays · what you did, what’s next", email: true, push: false, sms: false },
  { label: "Marketplace recs", sub: "Trending providers near you", email: false, push: false, sms: false },
  { label: "Security alerts", sub: "New sign-in, password change", email: true, push: true, sms: true, emailLocked: true },
];

const BILLING_ROWS = [
  { date: "11 May 14:32", what: "Strength session · Sarah Okafor", sub: "BIN-2026-042841 · Wed 20 May", gw: "VISA •••• 4421", amt: "R 1,890.00" },
  { date: "04 May 11:08", what: "Nutrition consult · Dr Nadia Hassan", sub: "BIN-2026-041922 · video · 30 min", gw: "Apple Pay", amt: "R 380.00" },
  { date: "29 Apr 09:42", what: "Strength session · Sarah Okafor", sub: "Completed · 5★ given", gw: "VISA •••• 4421", amt: "R 1,200.00" },
  { date: "22 Apr 06:14", what: "Day pass · Iron Lab Sea Point", sub: "Drop-in · attended", gw: "VISA •••• 4421", amt: "R 180.00" },
  { date: "01 Apr 08:30", what: "Refund · cancelled session", sub: "Pier B. refunded fully · 33h notice", gw: "VISA •••• 4421", amt: "+ R 1,200.00", refund: true },
  { date: "29 Mar 17:14", what: "Strength session · Sarah Okafor", sub: "Completed · 5★ given", gw: "VISA •••• 4421", amt: "R 1,200.00" },
];

export default function SettingsPage() {
  return (
    <div style={{ background: "var(--bg-2)" }}>
      {/* Nav */}
      <nav
        className="h-15 flex items-center justify-between px-5 sm:px-10 sticky top-0 z-10"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-7">
          <Link href="/">
            <BinecticsLockup />
          </Link>
          <div className="hidden sm:flex gap-1">
            {[
              { href: "/marketplace", label: "Marketplace" },
              { href: "/dashboard/bookings", label: "My bookings" },
              { href: "/dashboard/messages", label: "Messages" },
              { href: "#", label: "Saved" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2"
                style={{ color: "var(--fg-2)" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
          <button
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          </button>
          <span className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>TA</span>
        </div>
      </nav>

      <div className="mx-auto px-5 sm:px-10 pt-8 sm:pt-10 pb-24" style={{ maxWidth: 1240 }}>
        {/* Head */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end pb-6 mb-8" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h1 className="text-[30px] font-medium leading-none" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Settings</h1>
            <div className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>
              Manage your account, payments, notifications, and privacy. Most changes save automatically.
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase px-2.5 py-1 rounded-full shrink-0 mt-4 sm:mt-0"
            style={{ letterSpacing: "0.05em", color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}
          >
            <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--signal)" }} />
            All changes saved &middot; 11:32
          </span>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-10 items-start">
          {/* Section nav */}
          <nav className="hidden lg:flex flex-col gap-0.5 sticky" style={{ top: 88 }}>
            {SEC_NAV.map((g) => (
              <div key={g.group}>
                <div
                  className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-1 mt-3.5 first:mt-0"
                  style={{ color: "var(--fg-3)" }}
                >
                  {g.group}
                </div>
                {g.items.map((item, i) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center gap-2 py-1.75 rounded-(--r-2) text-[13px] ${i === 0 && g.group === "Account" ? "bg-bg font-medium" : "hover:bg-bg"}`}
                    style={{
                      color: "danger" in item && item.danger ? "var(--danger)" : i === 0 && g.group === "Account" ? "var(--ink)" : "var(--fg-3)",
                      borderLeft: i === 0 && g.group === "Account" ? "2px solid var(--ink)" : "none",
                      paddingLeft: i === 0 && g.group === "Account" ? "8px" : "10px",
                      textDecoration: "none",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: i === 0 && g.group === "Account" ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</svg>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          {/* Sections */}
          <div className="flex flex-col gap-3.5">

            {/* ── PROFILE ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="profile">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Profile</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  Shown to providers you book with. Your photo and name appear next to your messages.
                </p>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                {/* Avatar row */}
                <div className="flex items-center gap-4.5">
                  <span className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-medium shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)", letterSpacing: "-0.015em" }}>TA</span>
                  <div className="flex-1">
                    <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Tunde Adebayo</div>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1 font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
                      <span>Member since Jan 2025</span>
                      <span className="w-0.75 h-0.75 rounded-full" style={{ background: "var(--border-2)" }} />
                      <span>14 bookings</span>
                      <span className="w-0.75 h-0.75 rounded-full" style={{ background: "var(--border-2)" }} />
                      <span>5&#9733; from 11 providers</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="btn-ghost-v2 sm">Upload photo</button>
                    <button className="btn-ghost-v2 sm">Remove</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>First name</label>
                    <input defaultValue="Tunde" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Last name</label>
                    <input defaultValue="Adebayo" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                      Display name <span className="normal-case font-sans" style={{ color: "var(--fg-4)", letterSpacing: "-0.005em", marginLeft: 4 }}>how providers see you</span>
                    </label>
                    <input defaultValue="Tunde A." className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Pronouns</label>
                    <input defaultValue="he / him" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Email <span className="normal-case font-sans" style={{ color: "var(--signal-ink)", letterSpacing: "-0.005em", marginLeft: 4 }}>verified</span>
                  </label>
                  <input defaultValue="tunde@gmail.com" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  <span className="text-[12px] leading-normal" style={{ color: "var(--fg-3)" }}>Used for receipts and security alerts. Change requires re-verification.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Phone</label>
                    <input defaultValue="+27 82 ••• 1284" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Date of birth</label>
                    <input defaultValue="14 Mar 1986" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── PREFERENCES ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="preferences">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Preferences</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  Localization and how Binectics shows you data. These affect every screen.
                </p>
              </div>
              <div className="p-5.5 flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    { label: "Country", value: "South Africa · ZA" },
                    { label: "City", value: "Cape Town" },
                    { label: "Time zone", value: "Africa / Johannesburg · UTC+2" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                      <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    { label: "Language", value: "English (South Africa)" },
                    { label: "Currency", value: "ZAR · R" },
                    { label: "Units", value: "Metric · kg, cm, km" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                      <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: "First day of week", value: "Monday" },
                    { label: "Time format", value: "24-hour · 14:30" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                      <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "var(--font-sans)" }} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── NOTIFICATIONS ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="notifications">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Notifications</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  Pick which channels carry which alerts. Security messages always send by email — that&apos;s not optional.
                </p>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                {/* Matrix */}
                <div className="rounded-(--r-2) overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                  {/* Header row */}
                  <div
                    className="grid gap-3 px-4.5 py-2.5 font-mono text-[10.5px] uppercase items-center"
                    style={{ gridTemplateColumns: "1.6fr repeat(3, 64px)", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", letterSpacing: "0.04em", color: "var(--fg-3)" }}
                  >
                    <span>Notification</span>
                    <span className="text-center">Email</span>
                    <span className="text-center">Push</span>
                    <span className="text-center">SMS</span>
                  </div>
                  {/* Data rows */}
                  {NOTIF_ROWS.map((r, i) => (
                    <div
                      key={r.label}
                      className="grid gap-3 px-4.5 py-3 items-center"
                      style={{ gridTemplateColumns: "1.6fr repeat(3, 64px)", borderBottom: i < NOTIF_ROWS.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <div>
                        <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{r.label}</div>
                        <div className="font-mono text-[10.5px] uppercase mt-0.5" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>{r.sub}</div>
                      </div>
                      <div className="flex justify-center"><Check on={r.email} disabled={r.emailLocked} /></div>
                      <div className="flex justify-center"><Check on={r.push} /></div>
                      <div className="flex justify-center"><Check on={r.sms} /></div>
                    </div>
                  ))}
                </div>

                {/* DND toggle */}
                <div className="flex justify-between items-start gap-3.5 pt-4.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Do not disturb &middot; between sessions</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                      Hold push notifications during your scheduled training time. Email and SMS still work.
                    </div>
                  </div>
                  <Toggle on={false} />
                </div>
              </div>
            </section>

            {/* ── PAYMENT METHODS ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="payments">
              <div className="px-5.5 pt-4.5 pb-3.5 flex justify-between items-start" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Payment methods</h2>
                  <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                    Used for booking sessions and subscriptions. Your primary card is charged first; we fall back to the next one if it fails.
                  </p>
                </div>
                <button className="btn-primary-v2 sm shrink-0">+ Add method</button>
              </div>
              <div className="p-5.5 flex flex-col gap-2">
                {/* VISA */}
                <div className="grid gap-3.5 px-4.5 py-3.5 rounded-(--r-2) items-center" style={{ gridTemplateColumns: "52px 1fr auto auto", border: "1px solid var(--ink)" }}>
                  <span className="w-13 h-8.5 rounded-(--r-1) flex items-center justify-center font-mono text-[10px] font-bold tracking-[0.05em]" style={{ background: "linear-gradient(135deg, oklch(0.22 0.06 248), oklch(0.4 0.12 248))", color: "var(--bg)", border: "none" }}>VISA</span>
                  <div>
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>VISA ending 4421</div>
                    <div className="flex items-center gap-2 mt-0.75 font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
                      <span>Expires 04 / 28</span>
                      <span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} />
                      <span>Issued by Standard Bank &middot; ZA</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full" style={{ color: "var(--bg)", background: "var(--ink)" }}>Primary</span>
                  <span className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
                  </span>
                </div>

                {/* MC */}
                <div className="grid gap-3.5 px-4.5 py-3.5 rounded-(--r-2) items-center" style={{ gridTemplateColumns: "52px 1fr auto auto", border: "1px solid var(--border)" }}>
                  <span className="w-13 h-8.5 rounded-(--r-1) flex items-center justify-center font-mono text-[11px] font-bold" style={{ background: "linear-gradient(135deg, oklch(0.62 0.18 30), oklch(0.7 0.18 65))", color: "var(--bg)", border: "none" }}>MC</span>
                  <div>
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Mastercard ending 8104</div>
                    <div className="font-mono text-[11.5px] uppercase mt-0.75" style={{ letterSpacing: "0.04em", color: "oklch(0.45 0.16 75)" }}>Expires 06 / 26 &middot; in 5 weeks</div>
                  </div>
                  <span />
                  <span className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
                  </span>
                </div>

                {/* Apple Pay */}
                <div className="grid gap-3.5 px-4.5 py-3.5 rounded-(--r-2) items-center" style={{ gridTemplateColumns: "52px 1fr auto auto", border: "1px solid var(--border)" }}>
                  <span className="w-13 h-8.5 rounded-(--r-1) flex items-center justify-center text-[9px] font-medium" style={{ background: "var(--ink)", color: "var(--bg)", border: "none", fontFamily: "var(--font-sans)" }}>&nbsp; Pay</span>
                  <div>
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Apple Pay</div>
                    <div className="flex items-center gap-2 mt-0.75 font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
                      <span>iPhone &middot; this device</span>
                      <span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} />
                      <span>Touch ID</span>
                    </div>
                  </div>
                  <span />
                  <span className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
                  </span>
                </div>

                {/* Paystack */}
                <div className="grid gap-3.5 px-4.5 py-3.5 rounded-(--r-2) items-center" style={{ gridTemplateColumns: "52px 1fr auto auto", border: "1px solid var(--border)" }}>
                  <span className="w-13 h-8.5 rounded-(--r-1) flex items-center justify-center text-[8.5px] font-medium" style={{ background: "oklch(0.45 0.18 200)", color: "var(--bg)", border: "none", fontFamily: "var(--font-sans)" }}>Paystack</span>
                  <div>
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Bank transfer &middot; Paystack</div>
                    <div className="flex items-center gap-2 mt-0.75 font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
                      <span>ABSA &bull;&bull;&bull;&bull; 2241</span>
                      <span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} />
                      <span>Used 4&times; this year</span>
                    </div>
                  </div>
                  <span />
                  <span className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /></svg>
                  </span>
                </div>

                {/* Add method */}
                <div
                  className="flex items-center justify-center gap-2 px-4.5 py-3.5 rounded-(--r-2) cursor-pointer text-[13px] font-medium mt-1"
                  style={{ border: "1.5px dashed var(--border-2)", color: "var(--fg-3)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
                  Add a card &middot; bank &middot; or mobile wallet
                </div>
              </div>
            </section>

            {/* ── BILLING HISTORY ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="billing">
              <div className="px-5.5 pt-4.5 pb-3.5 flex justify-between items-start" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Billing history</h2>
                  <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                    Every charge, refund, and adjustment. Receipts auto-attach to your email.
                  </p>
                </div>
                <button className="btn-ghost-v2 sm shrink-0">Export CSV</button>
              </div>
              <div className="p-5.5">
                <div className="rounded-(--r-2) overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                  <div
                    className="grid gap-3 px-4.5 py-2.75 font-mono text-[10.5px] uppercase items-center min-w-[600px]"
                    style={{ gridTemplateColumns: "100px 1fr 1fr 90px 30px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", letterSpacing: "0.04em", color: "var(--fg-3)" }}
                  >
                    <span>Date</span><span>What</span><span>Payment</span><span className="text-right">Amount</span><span />
                  </div>
                  {BILLING_ROWS.map((r, i) => (
                    <div
                      key={i}
                      className="grid gap-3 px-4.5 py-3.25 items-center cursor-pointer hover:bg-bg-2 min-w-[600px]"
                      style={{ gridTemplateColumns: "100px 1fr 1fr 90px 30px", borderBottom: i < BILLING_ROWS.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13, transition: "background var(--motion-fast) var(--ease)" }}
                    >
                      <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums", color: "var(--fg-2)" }}>{r.date}</span>
                      <div style={{ color: "var(--ink)" }}>
                        {r.what}
                        <span className="block font-mono text-[10.5px] uppercase mt-0.5" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>{r.sub}</span>
                      </div>
                      <span className="font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>{r.gw}</span>
                      <span className="font-mono text-right font-medium" style={{ fontVariantNumeric: "tabular-nums", color: r.refund ? "var(--signal-ink)" : "var(--ink)" }}>{r.amt}</span>
                      <span className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center" style={{ color: "var(--fg-3)" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-center py-2 cursor-pointer mt-2" style={{ color: "var(--fg-3)" }}>
                  Show all 14 charges &rarr;
                </div>
              </div>
            </section>

            {/* ── SECURITY ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="security">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Sign-in &amp; 2FA</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  How you sign in and how we know it&apos;s you. We strongly recommend leaving two-factor on.
                </p>
              </div>
              <div className="px-5.5" style={{ paddingTop: 0, paddingBottom: 0 }}>
                {/* Password */}
                <div className="flex justify-between items-start gap-3.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Password</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>Last changed 14 Jan 2026 &middot; 4 months ago. We&apos;ll prompt you again in 8 months.</div>
                  </div>
                  <button className="btn-ghost-v2 sm shrink-0">Change</button>
                </div>
                {/* 2FA SMS */}
                <div className="flex justify-between items-start gap-3.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Two-factor authentication &middot; SMS</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>A 6-digit code to +27 82 &bull;&bull;&bull; 1284 on every new sign-in. Sent via SMS.</div>
                  </div>
                  <Toggle on={true} />
                </div>
                {/* 2FA Authenticator */}
                <div className="flex justify-between items-start gap-3.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Two-factor authentication &middot; authenticator app</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>Stronger than SMS. Works offline. Set up with Google Authenticator, 1Password, or Authy.</div>
                  </div>
                  <Toggle on={false} />
                </div>
                {/* Passkey */}
                <div className="flex justify-between items-start gap-3.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Passkey &middot; this device</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>Face ID on this iPhone is now your sign-in. No passwords, no codes.</div>
                  </div>
                  <Toggle on={true} />
                </div>
                {/* Auto-signout */}
                <div className="flex justify-between items-start gap-3.5 py-3.5">
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Sign me out after 30 days of inactivity</div>
                    <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>Recommended for shared devices.</div>
                  </div>
                  <Toggle on={false} />
                </div>
              </div>

              {/* Active sessions */}
              <div className="px-5.5 pt-4.5 pb-3.5 flex justify-between items-start" style={{ borderTop: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Active sessions</h2>
                  <p className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>Devices currently signed in to your account.</p>
                </div>
                <button className="btn-ghost-v2 sm shrink-0">Sign out all others</button>
              </div>
              <div className="px-1">
                {[
                  { icon: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" /></>, name: "iPhone 15 Pro", badge: "this device", meta: "Cape Town · Safari · active now", ip: "192.168.1.4", current: true },
                  { icon: <><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M2 18h20" /></>, name: "MacBook Air · Chrome", meta: "Cape Town · last seen yesterday 22:14" },
                  { icon: <rect x="6" y="2" width="12" height="20" rx="2" />, name: "iPad · Binectics app", meta: "Cape Town · 4 days ago" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center gap-3.5 px-4.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="w-8 h-8 rounded-(--r-1) flex items-center justify-center shrink-0" style={{ background: s.current ? "var(--signal-soft)" : "var(--bg-2)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: s.current ? "var(--signal-ink)" : "var(--ink)" }}>{s.icon}</svg>
                    </span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium flex items-center gap-2" style={{ color: "var(--ink)" }}>
                        {s.name}
                        {s.badge && <span className="font-mono text-[9.5px] uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-full font-normal" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)" }}>{s.badge}</span>}
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{s.meta}</div>
                    </div>
                    {s.current
                      ? <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{s.ip}</span>
                      : <button className="btn-ghost-v2 sm" style={{ fontSize: 11, padding: "4px 9px" }}>Sign out</button>
                    }
                  </div>
                ))}
              </div>
            </section>

            {/* ── PRIVACY ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="privacy">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Privacy</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  What you share, and with whom. Health logs are off by default for every new provider.
                </p>
              </div>
              <div className="px-5.5" style={{ paddingTop: 0, paddingBottom: 0 }}>
                {[
                  { t: "Share my health logs with current providers", s: "Weight, photos, mood entries — visible to Sarah Okafor only. Toggle off per-provider in your bookings.", on: true },
                  { t: "Show my real name on reviews", s: "Off means reviews appear as \"Tunde A.\" instead of \"Tunde Adebayo.\"", on: true },
                  { t: "Let Binectics use my activity to improve recommendations", s: "We use it to recommend providers in your city. Never sold or shared with third parties.", on: true },
                  { t: "Receive product research invitations", s: "Once a quarter at most. Always optional and clearly paid when paid.", on: false },
                ].map((item, i) => (
                  <div key={item.t} className="flex justify-between items-start gap-3.5 py-3.5" style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{item.t}</div>
                      <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>{item.s}</div>
                    </div>
                    <Toggle on={item.on} />
                  </div>
                ))}
              </div>
              {/* Your data */}
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderTop: "1px solid var(--border)" }}>
                <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Your data</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                  Download a copy or request deletion. See <Link href="/legal#privacy" className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>privacy policy</Link>.
                </p>
              </div>
              <div className="px-5.5 pb-4 flex gap-2">
                <button className="btn-ghost-v2 sm">Download all my data &middot; ZIP</button>
                <button className="btn-ghost-v2 sm">Request access to a specific record</button>
              </div>
            </section>

            {/* ── LINKED ACCOUNTS ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="linked">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Linked accounts</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  Connect outside services to keep your data in sync. We only read what you allow.
                </p>
              </div>
              <div className="p-5.5 flex flex-col gap-1.5">
                {[
                  { icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>, name: "Google Calendar", meta: "Connected · 2-way sync · last refresh 4m ago", connected: true },
                  { icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, name: "Apple Health", meta: "Workouts, body weight, heart rate", connected: true },
                  { icon: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" /></>, name: "Strava", meta: "Runs, rides, sessions — sync to your provider", connected: false },
                  { icon: <rect x="6" y="2" width="12" height="20" rx="2" />, name: "Whoop", meta: "Recovery score and strain", connected: false },
                ].map((l) => (
                  <div key={l.name} className="flex items-center gap-3 px-4 py-3.25 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
                    <span className="w-8 h-8 rounded-(--r-1) flex items-center justify-center shrink-0" style={{ background: "var(--bg-2)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink)" }}>{l.icon}</svg>
                    </span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{l.name}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{l.meta}</div>
                    </div>
                    <span
                      className="font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full"
                      style={{
                        color: l.connected ? "var(--signal-ink)" : "var(--fg-3)",
                        background: l.connected ? "var(--signal-soft)" : "var(--bg-2)",
                        border: l.connected ? "1px solid oklch(0.88 0.05 148)" : "1px solid var(--border)",
                      }}
                    >
                      {l.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── DANGER ZONE ── */}
            <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} id="danger">
              <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--danger)" }}>Close account</h2>
                <p className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-3)" }}>
                  Two reversible actions and one permanent one. Read what each does before clicking.
                </p>
              </div>
              <div className="p-5.5 flex flex-col gap-2">
                {/* Pause */}
                <div className="flex items-start gap-3.5 px-4.5 py-4 rounded-(--r-2)" style={{ background: "oklch(0.96 0.06 75)", border: "1px solid oklch(0.88 0.07 75)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Pause my account</div>
                    <div className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-2)" }}>
                      Hides your profile from the marketplace, freezes notifications and recurring bookings. Reactivate any time within 12 months.
                    </div>
                  </div>
                  <button className="btn-ghost-v2 sm shrink-0">Pause</button>
                </div>
                {/* Export & delete */}
                <div className="flex items-start gap-3.5 px-4.5 py-4 rounded-(--r-2)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Export then delete</div>
                    <div className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-2)" }}>
                      We&apos;ll email you a ZIP of all your data, then schedule deletion 30 days later. Cancel any time during the window.
                    </div>
                  </div>
                  <button className="btn-ghost-v2 sm shrink-0">Export &amp; delete</button>
                </div>
                {/* Delete forever */}
                <div className="flex items-start gap-3.5 px-4.5 py-4 rounded-(--r-2)" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.88 0.05 25)" }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ color: "var(--danger)" }}>Delete my account now</div>
                    <div className="text-[12.5px] mt-1 max-w-[56ch] leading-normal" style={{ color: "var(--fg-2)" }}>
                      Permanent. We strip your name and contact details within 24 hours. Past bookings stay in your providers&apos; records for tax compliance — that we can&apos;t change.
                    </div>
                  </div>
                  <button
                    className="h-8 px-3.5 rounded-(--r-2) text-[13px] font-medium shrink-0 cursor-pointer"
                    style={{ background: "var(--danger)", color: "oklch(0.98 0 0)", border: "none" }}
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
