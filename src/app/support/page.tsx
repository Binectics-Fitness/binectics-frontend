import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Support — support.html prototype.
 * Admin 4-column layout: 232px dark sidebar + 320px queue + 1fr workspace + 360px context.
 * Queue: 7 open cases with SLA indicators, parties, pills.
 * Workspace: breadcrumbs, h1 with SLA pill, 5-stat summary, tab nav, conversation.
 * Context: parties, resolution picker, booking facts, timeline, related cases.
 */

const QUEUE_FILTERS = [
  { label: "All", count: 7, on: true },
  { label: "Priority", count: 2 },
  { label: "Chargebacks", count: 1 },
  { label: "Refund", count: 4 },
  { label: "Over SLA", count: 3 },
];

const CASES = [
  { id: "DSP-2401", time: "3h ago", who: "Pier Botha → Iron Lab", what: "Cancelled session refund denied · provider claims policy bars same-day refund.", pills: ["priority", "refund"], amt: "R 1,200", sla: "SLA in 1h 12m", slaType: "red", on: true },
  { id: "DSP-2398", time: "9h", who: "Aman R. → Apex Body, Manila", what: "Refund denied on policy ToS §4.2 · member requests platform review.", pills: ["refund"], amt: "₱ 3,400", sla: "SLA 14h", slaType: "warn" },
  { id: "DSP-2394", time: "1d", who: "Card holder •••• 4421 → CrossPower Stuttgart", what: "Stripe chargeback · reason code 4855 · service not as described.", pills: ["priority", "chargeback"], amt: "€ 89.00", sla: "Evidence due 36h", slaType: "red" },
  { id: "DSP-2391", time: "1d", who: "Halima D. → Lagos Lift Club", what: "Trainer no-show · 2 sessions · provider hasn’t responded.", pills: ["refund"], amt: "₦ 28,000", sla: "SLA 22h" },
  { id: "DSP-2387", time: "2d", who: "Wei Chen → Velo Cycling Club", what: "Plan downgrade not applied at billing.", pills: ["resolved"], amt: "R 380", sla: "Pending close" },
  { id: "DSP-2384", time: "2d", who: "Folake A. → Dr Nadia Hassan", what: "PDF plan never delivered after intake consult.", pills: ["refund"], amt: "₦ 165k", sla: "SLA 18h" },
  { id: "DSP-2380", time: "3d", who: "Marcus B. → Strathmore Strength Co.", what: "Charged twice for the same day pass · gateway duplicate.", pills: ["refund"], amt: "KSh 1,400", sla: "SLA 8h" },
];

const SUMMARY = [
  { label: "Case ID", value: "DSP-2401" },
  { label: "Amount disputed", value: "R 1,200.00", sub: "· ZAR" },
  { label: "Opened", value: "18 May · 09:14" },
  { label: "Status", value: "Awaiting provider", dot: true },
  { label: "Owner", value: "Andile K." },
];

const TABS = [
  { label: "Conversation", count: "5", on: true },
  { label: "Evidence", count: "3" },
  { label: "Policy lookup" },
  { label: "Audit trail" },
];

const RESOLUTIONS = [
  { title: "Full refund to member", desc: "R 1,200 returns to Pier’s VISA. Iron Lab absorbs.", amt: "R 1,200", on: true },
  { title: "Partial refund · 50%", desc: "Split responsibility. Both parties notified.", amt: "R 600" },
  { title: "No refund · uphold provider", desc: "Policy applies. Member notified with explanation." },
  { title: "Escalate to legal", desc: "Case forwarded to compliance. Neither party charged.", danger: true },
];

const TIMELINE = [
  { title: "Booking placed", sub: "Sun 17 May · 10:22", done: true },
  { title: "Rescheduled by member", sub: "Fri 16 May · 14:18", done: true },
  { title: "Cancelled by member", sub: "Mon 18 May · 09:14", done: true },
  { title: "Case opened", sub: "Mon 18 May · 09:18", now: true },
  { title: "Resolution due", sub: "Tue 19 May · 09:14" },
];

function pillClass(type: string) {
  if (type === "priority") return { color: "var(--danger)", bg: "var(--danger-soft)", border: "oklch(0.88 0.05 25)" };
  if (type === "chargeback") return { color: "var(--gym)", bg: "var(--gym-soft)", border: "oklch(0.88 0.04 248)" };
  if (type === "refund") return { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)", border: "oklch(0.88 0.05 75)" };
  if (type === "resolved") return { color: "var(--signal-ink)", bg: "var(--signal-soft)", border: "oklch(0.88 0.05 148)" };
  return { color: "var(--fg-2)", bg: "var(--bg)", border: "var(--border)" };
}

export default function SupportPage() {
  return (
    <div className="grid h-screen overflow-hidden grid-cols-1 lg:grid-cols-[232px_320px_1fr_360px]">

      {/* ═══ ADMIN SIDEBAR ═══ */}
      <aside className="hidden lg:flex flex-col gap-5.5 h-screen overflow-y-auto" style={{ background: "var(--ink)", color: "oklch(0.85 0.005 85)", padding: "18px 14px", borderRight: "1px solid var(--ink)" }}>
        <Link href="/" style={{ color: "var(--bg)" }}><BinecticsLockup /></Link>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-0.75 rounded-full w-fit" style={{ border: "1px solid oklch(0.35 0.01 80)", color: "oklch(0.75 0.005 85)", letterSpacing: "0.04em" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />Production &middot; admin
        </span>

        <nav className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase px-2 py-1 mb-1" style={{ color: "oklch(0.55 0.008 80)", letterSpacing: "0.06em" }}>Moderate</div>
          {[
            { label: "Overview", href: "/admin/dashboard" },
            { label: "Listings queue", badge: "38", alert: true },
            { label: "Reviews flagged", badge: "12" },
            { label: "Fraud signals", badge: "4", alert: true },
          ].map((n) => (
            <Link key={n.label} href={n.href || "#"} className="flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] hover:bg-[oklch(0.20_0.008_80)]" style={{ color: "oklch(0.80 0.005 85)" }}>
              {n.label}
              {n.badge && <span className="ml-auto font-mono text-[11px] px-1.5 rounded-full" style={{ background: n.alert ? "var(--danger)" : "oklch(0.30 0.01 80)", color: n.alert ? "oklch(0.98 0 0)" : "oklch(0.85 0.005 85)" }}>{n.badge}</span>}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase px-2 py-1 mb-1" style={{ color: "oklch(0.55 0.008 80)", letterSpacing: "0.06em" }}>Support</div>
          {[
            { label: "Disputes", badge: "7", alert: true, on: true },
            { label: "Refund queue", badge: "14" },
            { label: "Resolved", badge: "218" },
            { label: "Help tickets", badge: "42" },
          ].map((n) => (
            <span key={n.label} className={`flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] cursor-pointer ${n.on ? "font-medium" : ""}`} style={{ background: n.on ? "oklch(0.22 0.008 80)" : "transparent", color: n.on ? "var(--bg)" : "oklch(0.80 0.005 85)" }}>
              {n.label}
              {n.badge && <span className="ml-auto font-mono text-[11px] px-1.5 rounded-full" style={{ background: n.alert ? "var(--danger)" : "oklch(0.30 0.01 80)", color: n.alert ? "oklch(0.98 0 0)" : "oklch(0.85 0.005 85)" }}>{n.badge}</span>}
            </span>
          ))}
        </nav>

        <nav className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase px-2 py-1 mb-1" style={{ color: "oklch(0.55 0.008 80)", letterSpacing: "0.06em" }}>Platform</div>
          {["Countries · 52", "Payments", "Users", "Analytics"].map((n) => (
            <span key={n} className="px-2 py-1.75 rounded-(--r-2) text-[13.5px] cursor-pointer" style={{ color: "oklch(0.80 0.005 85)" }}>{n}</span>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid oklch(0.30 0.008 80)" }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[11px]" style={{ background: "oklch(0.30 0.01 80)", color: "var(--bg)" }}>AK</span>
          <div style={{ flex: 1 }}>
            <div className="text-[13px] font-medium" style={{ color: "var(--bg)" }}>Andile K.</div>
            <div className="font-mono text-[11px]" style={{ color: "oklch(0.65 0.008 80)" }}>SUPPORT LEAD</div>
          </div>
        </div>
      </aside>

      {/* ═══ QUEUE ═══ */}
      <aside className="flex flex-col h-screen" style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-2.5 shrink-0" style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center">
            <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>Open cases &middot; 7</h2>
            <span className="font-mono text-[10px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>My queue</span>
          </div>
          <div className="flex items-center gap-2 h-7.5 px-2.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Case ID, name, amount...</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0" style={{ padding: "0 14px 12px" }}>
          {QUEUE_FILTERS.map((f) => (
            <span key={f.label} className="font-mono text-[10.5px] uppercase cursor-pointer" style={{ padding: "4px 9px", borderRadius: 999, letterSpacing: "0.04em", background: f.on ? "var(--ink)" : "var(--bg)", color: f.on ? "var(--bg)" : "var(--fg-3)", border: f.on ? "1px solid var(--ink)" : "1px solid var(--border)" }}>
              {f.label} <span style={{ color: f.on ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{f.count}</span>
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {CASES.map((c) => (
            <div key={c.id} className={`flex flex-col gap-1.25 cursor-pointer relative ${c.on ? "bg-bg" : "hover:bg-bg"}`} style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
              {c.on && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: "var(--ink)" }} />}
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}><strong style={{ color: "var(--ink)", fontWeight: 500 }}>{c.id}</strong> &middot; {c.time}</span>
                <span className={`font-mono text-[10.5px] uppercase shrink-0 ${c.slaType === "red" ? "font-medium" : ""}`} style={{ color: c.slaType === "red" ? "var(--danger)" : c.slaType === "warn" ? "oklch(0.45 0.16 75)" : "var(--fg-3)", letterSpacing: "0.04em" }}>{c.sla}</span>
              </div>
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{c.who}</div>
              <div className="text-[12.5px] leading-[1.4] line-clamp-2" style={{ color: "var(--fg-2)" }}>{c.what}</div>
              <div className="flex items-center gap-1 mt-1">
                {c.pills.map((p) => {
                  const s = pillClass(p);
                  return <span key={p} className="font-mono text-[9.5px] uppercase px-1.5 py-0.25 rounded-(--r-1)" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, letterSpacing: "0.04em" }}>{p}</span>;
                })}
                <span className="ml-auto font-mono text-[11.5px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.amt}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ═══ WORKSPACE ═══ */}
      <main className="flex flex-col h-screen min-w-0" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="flex justify-between items-center shrink-0 gap-4" style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
              <Link href="/admin/dashboard" style={{ color: "var(--fg-3)" }}>Admin</Link>
              <span style={{ color: "var(--fg-4)" }}>/</span>
              <span style={{ color: "var(--fg-3)" }}>Support</span>
              <span style={{ color: "var(--fg-4)" }}>/</span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>DSP-2401</span>
            </div>
            <h1 className="text-[22px] font-medium flex items-center gap-2.5" style={{ letterSpacing: "-0.018em", color: "var(--ink)", lineHeight: 1.1 }}>
              Cancelled session refund &middot; Pier Botha
              <span className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase px-2.25 py-0.75 rounded-full font-normal" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid oklch(0.88 0.05 25)", letterSpacing: "0.05em" }}>
                <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--danger)" }} />SLA in 1h 12m
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="btn-ghost-v2 sm">Escalate to Andile</button>
            <button className="btn-primary-v2 sm">Resolve case &rarr;</button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid shrink-0" style={{ gridTemplateColumns: "repeat(5, 1fr)", padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
          {SUMMARY.map((s, i) => (
            <div key={s.label} style={{ padding: "0 18px", borderRight: i < 4 ? "1px solid var(--border)" : "none", paddingLeft: i === 0 ? 0 : undefined, paddingRight: i === 4 ? 0 : undefined }}>
              <div className="font-mono text-[10px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.05em" }}>{s.label}</div>
              <div className="text-[15px] font-medium mt-1 flex items-center gap-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.005em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                {s.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--warn)" }} />}
                {s.value}
                {s.sub && <small className="font-mono text-[11px] font-normal" style={{ color: "var(--fg-3)" }}>{s.sub}</small>}
              </div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex shrink-0" style={{ padding: "0 24px", borderBottom: "1px solid var(--border)" }}>
          {TABS.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-2 cursor-pointer" style={{ padding: "12px 14px", fontSize: "13.5px", color: t.on ? "var(--ink)" : "var(--fg-3)", fontWeight: t.on ? 500 : 400, borderBottom: t.on ? "2px solid var(--ink)" : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
              {t.count && <span className="font-mono text-[10.5px]" style={{ color: t.on ? "var(--ink)" : "var(--fg-4)" }}>{t.count}</span>}
            </span>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: "20px 24px 80px" }}>
          {/* Date divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Sunday &middot; 17 May</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* System event */}
          <div className="self-center inline-flex items-center gap-2 font-mono text-[10.5px] uppercase px-3 py-2 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)", letterSpacing: "0.05em" }}>
            Booking BIN-2026-040112 placed &middot; R 1,200 held on VISA 4421
          </div>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Today &middot; Mon 18 May</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <div className="self-center inline-flex items-center gap-2 font-mono text-[10.5px] uppercase px-3 py-2 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)", letterSpacing: "0.05em" }}>
            Pier Botha cancelled at 09:14 &middot; 33h before session start
          </div>

          {/* Member message */}
          <div className="flex gap-3 items-start" style={{ maxWidth: "78%" }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>PB</span>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="font-mono text-[10.5px] uppercase flex items-baseline gap-2" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>
                <strong className="text-[12.5px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>Pier Botha</strong>
                <span className="font-mono text-[9.5px] px-1.25 py-px rounded-[2px]" style={{ color: "var(--gym)", background: "var(--gym-soft)", border: "1px solid oklch(0.88 0.04 248)" }}>Member</span>
                <span>09:18 SAST</span>
              </div>
              <div className="rounded-(--r-3) text-[13.5px] leading-[1.55] whitespace-pre-line" style={{ padding: "11px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                {`Hi — I cancelled this session 33 hours before the start. According to your terms I should be entitled to a full refund. Iron Lab told me they’re keeping the money because it was “same day” but it’s not?

I’d like a full refund please. The cancellation timestamp on my booking screen is clear.`}
              </div>
            </div>
          </div>

          {/* Provider message */}
          <div className="flex gap-3 items-start" style={{ maxWidth: "78%" }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold" style={{ background: "var(--trainer)", color: "oklch(0.2 0.05 75)" }}>IL</span>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="font-mono text-[10.5px] uppercase flex items-baseline gap-2" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>
                <strong className="text-[12.5px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>Iron Lab Sea Point</strong>
                <span className="font-mono text-[9.5px] px-1.25 py-px rounded-[2px]" style={{ color: "oklch(0.42 0.13 75)", background: "var(--trainer-soft)", border: "1px solid oklch(0.88 0.05 75)" }}>Provider</span>
                <span>10:42 SAST</span>
              </div>
              <div className="rounded-(--r-3) text-[13.5px] leading-[1.55] whitespace-pre-line" style={{ padding: "11px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                {`Hi team — Pier is mistaken on the timing. Our scheduling system shows the cancellation came in at 09:14 today and his session was scheduled for 18:00 today, so this was 8h 46m before, not 33h. Our cancellation policy is clearly published as 24h notice required.

Happy to provide our system’s audit log on request.`}
              </div>
            </div>
          </div>

          {/* Admin message */}
          <div className="flex gap-3 items-start self-end flex-row-reverse" style={{ maxWidth: "78%" }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold" style={{ background: "var(--ink)", color: "var(--bg)" }}>AK</span>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="font-mono text-[10.5px] uppercase flex items-baseline gap-2 justify-end" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>
                <span>14:08 SAST</span>
                <strong className="text-[12.5px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>You</strong>
              </div>
              <div className="rounded-(--r-3) text-[13.5px] leading-[1.55] whitespace-pre-line" style={{ padding: "11px 14px", background: "var(--ink)", border: "1px solid var(--ink)", color: "var(--bg)" }}>
                {`Hi Pier and Iron Lab —

I’ve looked into both sides. The booking was originally for Wed 20 May 08:30. Pier rescheduled to Mon 18 May 18:00 on Friday at 14:18. The cancellation came in at Mon 09:14, which is 8h 46m before the rescheduled time.

I’m recommending a full refund here because the original booking notice was well within the 24h window. The reschedule shouldn’t reset the cancellation clock. I’ll update both of you once this is processed.`}
              </div>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0" style={{ borderTop: "1px solid var(--border)", padding: "12px 24px 16px", background: "var(--bg)" }}>
          <div className="flex gap-0 mb-2.5">
            {["Reply to member", "Reply to provider", "Internal note"].map((t, i) => (
              <button key={t} className="font-mono text-[10.5px] uppercase px-3 py-1.25 cursor-pointer" style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)", borderBottom: i === 0 ? "1.5px solid var(--ink)" : "1.5px solid transparent", letterSpacing: "0.04em", background: "transparent", border: "none", borderBottomWidth: "1.5px", borderBottomStyle: "solid", borderBottomColor: i === 0 ? "var(--ink)" : "transparent" }}>{t}</button>
            ))}
          </div>
          <div className="rounded-(--r-3) focus-within:border-ink" style={{ border: "1px solid var(--border-2)", background: "var(--bg)", padding: "10px 12px 8px" }}>
            <div className="text-[14px]" style={{ color: "var(--fg-3)", minHeight: 48 }}>Type your response...</div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1">
                {["attach", "template"].map((a) => (
                  <span key={a} className="w-6.5 h-6.5 rounded-(--r-1) flex items-center justify-center cursor-pointer hover:bg-bg-2" style={{ color: "var(--fg-3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={a === "attach" ? "M21.4 11.6l-9-9a5 5 0 0 0-7 7l9 9a3 3 0 0 0 4.2-4.2l-8.5-8.5" : "M12 5v14M5 12h14"} /></svg>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="font-mono text-[10.5px] uppercase px-2.5 py-1 rounded-(--r-1) cursor-pointer hover:border-ink hover:text-ink" style={{ border: "1px solid var(--border)", color: "var(--fg-3)", letterSpacing: "0.04em", background: "var(--bg)" }}>Canned responses</span>
                <button className="btn-primary-v2 sm">Send</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ CONTEXT RAIL ═══ */}
      <aside className="hidden lg:flex flex-col gap-4.5 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)", padding: "18px" }}>
        {/* Parties */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Parties</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5" style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>PB</span>
              <div style={{ flex: 1 }}>
                <div className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
                  Pier Botha
                  <span className="font-mono text-[9.5px] px-1.25 py-px rounded-[2px] uppercase" style={{ color: "var(--gym)", background: "var(--gym-soft)", border: "1px solid oklch(0.88 0.04 248)", letterSpacing: "0.04em" }}>Member</span>
                </div>
                <div className="font-mono text-[10.5px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>Cape Town &middot; 14 bookings &middot; 0 disputes</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5" style={{ padding: "12px 14px" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold" style={{ background: "var(--trainer)", color: "oklch(0.2 0.05 75)" }}>IL</span>
              <div style={{ flex: 1 }}>
                <div className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
                  Iron Lab Sea Point
                  <span className="font-mono text-[9.5px] px-1.25 py-px rounded-[2px] uppercase" style={{ color: "oklch(0.42 0.13 75)", background: "var(--trainer-soft)", border: "1px solid oklch(0.88 0.05 75)", letterSpacing: "0.04em" }}>Provider</span>
                </div>
                <div className="font-mono text-[10.5px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>Gym &middot; Sea Point &middot; 1 prior dispute</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Resolution</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 14 }}>
            <div className="flex flex-col gap-2">
              {RESOLUTIONS.map((r) => (
                <div key={r.title} className="flex gap-2.5 items-start rounded-(--r-2) cursor-pointer" style={{ padding: "12px 14px", border: r.on ? `1px solid ${r.danger ? "var(--danger)" : "var(--ink)"}` : "1px solid var(--border)", background: r.on ? "var(--bg-2)" : "var(--bg)" }}>
                  <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: r.on ? (r.danger ? "var(--danger)" : "var(--ink)") : "var(--border-2)" }}>
                    {r.on && <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.danger ? "var(--danger)" : "var(--ink)" }} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{r.title}</div>
                    <div className="text-[11.5px] mt-0.5 leading-[1.45]" style={{ color: "var(--fg-3)" }}>{r.desc}</div>
                  </div>
                  {r.amt && <span className="font-mono text-[12px] shrink-0 mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.amt}</span>}
                </div>
              ))}
            </div>
            <button className="btn-primary-v2 w-full justify-center mt-3">Resolve &rarr;</button>
          </div>
        </div>

        {/* Booking facts */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Booking facts</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {[
              { k: "Booking", v: "BIN-2026-040112" },
              { k: "Original date", v: "Wed 20 May 08:30" },
              { k: "Rescheduled to", v: "Mon 18 May 18:00" },
              { k: "Cancelled at", v: "Mon 18 May 09:14" },
              { k: "Provider", v: "Iron Lab Sea Point" },
              { k: "Amount", v: "R 1,200.00" },
              { k: "Gateway", v: "Paystack · VISA 4421" },
            ].map((f, i, a) => (
              <div key={f.k} className="flex justify-between text-[12.5px] gap-3" style={{ padding: "10px 14px", borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ color: "var(--fg-3)" }}>{f.k}</span>
                <span className="font-mono text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Timeline</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {TIMELINE.map((t, i) => (
              <div key={t.title} className="flex gap-2.5" style={{ padding: "10px 14px", borderBottom: i < TIMELINE.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex flex-col items-center shrink-0" style={{ width: 18, paddingTop: 4 }}>
                  <span className="w-1.75 h-1.75 rounded-full" style={{ background: t.done ? "var(--signal)" : t.now ? "var(--warn)" : "var(--border-2)", boxShadow: t.now ? "0 0 0 3px oklch(0.94 0.06 75)" : "none" }} />
                  {i < TIMELINE.length - 1 && <span className="flex-1 w-px mt-0.5" style={{ background: "var(--border)", minHeight: 8 }} />}
                </div>
                <div>
                  <div className="text-[12.5px] font-medium leading-[1.45]" style={{ color: "var(--ink)" }}>{t.title}</div>
                  <div className="font-mono text-[10px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related cases */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Related cases</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {[
              { title: "Iron Lab · late cancellation", sub: "DSP-2198 · Resolved · 22 Apr", amt: "R 950" },
              { title: "Pier Botha · card dispute", sub: "DSP-1044 · Resolved · 14 Jan", amt: "R 480" },
            ].map((r, i) => (
              <div key={r.title} className="flex justify-between items-center gap-3 cursor-pointer hover:bg-bg-2" style={{ padding: "10px 14px", borderBottom: i < 1 ? "1px solid var(--border)" : "none", fontSize: "12.5px" }}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium" style={{ color: "var(--ink)" }}>{r.title}</span>
                  <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{r.sub}</span>
                </div>
                <span className="font-mono text-[12px] shrink-0" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.amt}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
