"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { DashboardMobileNav } from "@/components/ds/MobileNav";

/**
 * Dietitian Messages / Inbox — Dr Nadia Hassan
 * Hardcoded to match dietitian-messages.html prototype.
 * Full 4-column layout: sidebar + inbox list + thread + context rail.
 * "use client" needed for useState (active conversation + filter).
 */

/* ─── Icon helper ──────────────────────────────────────────────── */
function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d ? <path d={d} /> : children}</svg>;
}

/* ─── Sidebar data ─────────────────────────────────────────────── */
const SIDEBAR = [
  { label: "Practice", items: [
    { name: "Today", href: "/dashboard/dietitian", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Consultations", href: "/dashboard/dietitian/consultations", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Clients", badge: "68", href: "/dashboard/dietitian/clients", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Inbox", badge: "12", href: "/dashboard/dietitian/messages", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /> },
  ]},
  { label: "Plans & food", items: [
    { name: "Meal plans", href: "/dashboard/dietitian/meal-plans", icon: <I><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></I> },
    { name: "Food database", href: "/dashboard/dietitian/foods", icon: <I d="M3 7h18M3 12h18M3 17h12" /> },
    { name: "Protocols", href: "/dashboard/dietitian/protocols", icon: <I><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></I> },
  ]},
  { label: "Practice ops", items: [
    { name: "Earnings", href: "/dashboard/dietitian/earnings", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "My profile", href: "/dashboard/dietitian/profile", icon: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></I> },
    { name: "Settings", href: "/dashboard/dietitian/settings", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></I> },
  ]},
];

/* ─── Inbox data ───────────────────────────────────────────────── */
const CONVERSATIONS = [
  { id: "aa", init: "AA", name: "Aisha Adams", ts: "28m", sub: "Quick Q on today's programming — should I do the front squats at the same RPE...", unread: true, tags: [{ label: "Client", type: "client" }, { label: "Programming", type: "default" }] },
  { id: "nk", init: "NK", name: "Nthabiseng Khumalo", ts: "3m", sub: "Hi Sarah — would Tuesday at 7 work for a first consult? Heard great things from Linda.", unread: true, tags: [{ label: "Lead", type: "lead" }, { label: "Reply within 1h", type: "urgent" }] },
  { id: "rj", init: "RJ", name: "Rashid Jansen", ts: "1h", sub: "Booked 8 sessions — looking forward. PAR-Q form attached.", unread: true, tags: [{ label: "Client", type: "client" }, { label: "Onboarding", type: "default" }] },
  { id: "wc", init: "WC", name: "Wei Chen", ts: "3h", sub: "Snatch felt off today, attached the slo-mo. Bar drifting forward in the third pull.", unread: true, tags: [{ label: "Client", type: "client" }, { label: "Technique", type: "default" }] },
  { id: "lm", init: "LM", name: "Linda Mokoena", ts: "Yesterday", sub: "PR'd squat at 92.5! Thank you  Will send vid tonight", unread: false, tags: [{ label: "Client", type: "client" }] },
  { id: "il", init: "IL", name: "Iron Lab Sea Point", ts: "Mon", sub: "Coach roster for the long weekend — please confirm by Friday 5pm.", unread: false, tags: [{ label: "Gym", type: "gym" }, { label: "Scheduling", type: "default" }], gymAvatar: true },
  { id: "tn", init: "TN", name: "Thandi Nkosi", ts: "Mon", sub: "Rescheduling Friday's session to next Tuesday — childcare conflict", unread: false, tags: [{ label: "Client", type: "client" }, { label: "Scheduling", type: "default" }] },
  { id: "mk", init: "MK", name: "Mike Khumalo", ts: "2d", sub: "Last 2 sessions in the conditioning pack — what's the next block?", unread: false, tags: [{ label: "Client", type: "client" }, { label: "Renewal", type: "default" }] },
  { id: "js", init: "JS", name: "Jamal Sutherland", ts: "3d", sub: "Excited for our first session — anything I should bring beyond water and shoes?", unread: false, tags: [{ label: "Lead", type: "lead" }, { label: "Onboarding", type: "default" }] },
];

const FILTERS = [
  { label: "All", count: "38", active: true },
  { label: "Unread", count: "7", active: false },
  { label: "Clients", count: "29", active: false },
  { label: "Leads", count: "6", active: false },
  { label: "Gym", count: "3", active: false },
];

const MESSAGES = [
  { out: false, init: "AA", name: "Aisha", time: "09:42 GMT+4", text: "Hey Sarah! Did the Friday session. Front squat felt heavy at 50 — bar was sitting weird on my shoulders. Pulled the working sets back to 45.", date: "Sunday · 17 May" },
  { out: false, init: "AA", isImage: true, date: null },
  { out: true, init: "NH", name: "You", time: "14:18 SAST", text: "Good call on backing off. From the video the bar is rolling onto your throat instead of sitting on the shelf — shoulders need to push up into the bar, not down. Try this: take your stance and elbows up before you unrack.\n\nStick with 45 this week. Want to see one more clean session before we add weight.", date: null },
  { out: true, init: "NH", name: "You", time: "14:20 SAST", text: "Also — sent you the updated week 7 plan. Has a back squat day to give the front squat a break.", attachment: { name: "aisha-week-07-strength.pdf", meta: "PDF · 248 KB" }, date: null },
  { out: false, init: "AA", name: "Aisha", time: "11:02 GMT+4", text: "Quick Q on today's programming — should I do the front squats at the same RPE I had on the back squat last week, or build up by feel? Want to make sure I'm not just chasing the same weight.", date: "Today · Mon 18 May" },
];

const QUICK_REPLIES = [
  "RPE 7 today · save the gas for Friday",
  "Build by feel, stop at the first ugly rep",
  "Send a video of the working set",
  "Let's talk it through on the call",
];

const SHARED_FILES = [
  { name: "aisha-week-07-strength.pdf", meta: "17 May · 248 KB", icon: "doc" },
  { name: "front-squat-fri.mov", meta: "17 May · 4.2 MB · 0:34", icon: "video" },
  { name: "aisha-week-06-strength.pdf", meta: "10 May · 252 KB", icon: "doc" },
  { name: "jan-2026-progress.jpg", meta: "12 May · 880 KB", icon: "img" },
];

const TAG_STYLE: Record<string, React.CSSProperties> = {
  default: { color: "var(--fg-2)", borderColor: "var(--border)", background: "var(--bg)" },
  urgent: { color: "var(--danger)", borderColor: "oklch(0.88 0.05 25)", background: "var(--danger-soft)" },
  client: { color: "var(--trainer)", borderColor: "oklch(0.88 0.05 75)", background: "var(--trainer-soft)" },
  lead: { color: "var(--signal-ink)", borderColor: "oklch(0.88 0.05 148)", background: "var(--signal-soft)" },
  gym: { color: "var(--gym)", borderColor: "oklch(0.88 0.04 248)", background: "var(--gym-soft)" },
};

/* ─── Sidebar content ──────────────────────────────────────────── */
function SidebarContent() {
  return (
    <div className="flex flex-col gap-6 px-3.5 pb-6">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1"><BinecticsLockup /></Link>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>NH</span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Dr Nadia Hassan</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Dietitian · Lagos</div>
        </div>
      </div>
      {SIDEBAR.map((s) => (
        <nav key={s.label} className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2 py-1 mb-1" style={{ color: "var(--fg-4)" }}>{s.label}</div>
          {s.items.map((item) => {
            const isActive = item.name === "Inbox";
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] ${isActive ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`} style={{ color: isActive ? "var(--ink)" : "var(--fg-2)" }}>
                {item.icon}<span className="flex-1">{item.name}</span>
                {item.badge && <span className={`ml-auto font-mono text-[11px] px-1.5 py-px rounded-full ${isActive ? "" : "bg-bg-2"}`} style={isActive ? { background: "var(--ink)", color: "var(--bg)" } : { color: "var(--fg-3)" }}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
      ))}
      <div className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>NH</span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Dr Nadia H.</div>
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>DIETITIAN · RD</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function DietitianMessagesPage() {
  const [activeConv, setActiveConv] = useState("aa");
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Mobile nav */}
      <DashboardMobileNav><SidebarContent /></DashboardMobileNav>

      {/* Desktop layout — 4-col: sidebar + inbox + thread + context */}
      <div className="hidden lg:grid h-screen overflow-hidden" style={{ gridTemplateColumns: "232px 320px 1fr 320px" }}>

        {/* ─── SIDEBAR ─── */}
        <aside className="flex flex-col gap-6 h-screen overflow-y-auto" style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 14px" }}>
          <SidebarContent />
        </aside>

        {/* ─── INBOX LIST ─── */}
        <aside className="flex flex-col h-screen" style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>
          {/* Inbox head */}
          <div className="flex flex-col gap-3 px-4.5 pt-4.5 pb-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center">
              <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Inbox</h2>
              <button className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 h-[30px] px-2.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span className="flex-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>Search messages, names, files...</span>
              <span className="font-mono text-[10px] px-1.25 py-px rounded-[3px]" style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>⌘ K</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 flex-wrap px-4.5 py-3">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.25 py-1 rounded-full cursor-pointer"
                style={{
                  border: "1px solid",
                  borderColor: activeFilter === f.label ? "var(--ink)" : "var(--border)",
                  background: activeFilter === f.label ? "var(--ink)" : "var(--bg)",
                  color: activeFilter === f.label ? "var(--bg)" : "var(--fg-3)",
                }}
              >
                {f.label} <span style={{ marginLeft: "4px", color: activeFilter === f.label ? "oklch(0.75 0.005 85)" : "var(--fg-4)" }}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map((c) => (
              <div
                key={c.id}
                className="flex gap-2.5 px-4.5 py-3 cursor-pointer relative"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: activeConv === c.id ? "var(--bg)" : "transparent",
                }}
                onClick={() => setActiveConv(c.id)}
              >
                {activeConv === c.id && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-sm" style={{ background: "var(--ink)" }} />}
                <span
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                  style={c.gymAvatar ? { background: "var(--gym)", color: "oklch(0.95 0 0)" } : { background: "var(--bg-3)", color: "var(--fg-2)" }}
                >
                  {c.init}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
                      {c.name}
                      {c.unread && <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5" style={{ background: "var(--signal)" }} />}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] shrink-0" style={{ color: "var(--fg-3)" }}>{c.ts}</span>
                  </div>
                  <div className="text-[12.5px] mt-[3px] truncate" style={{ color: c.unread ? "var(--ink)" : "var(--fg-2)", fontWeight: c.unread ? 500 : 400, lineHeight: "1.4" }}>{c.sub}</div>
                  {c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {c.tags.map((t) => (
                        <span key={t.label} className="font-mono text-[9.5px] uppercase tracking-[0.05em] px-[5px] py-[2px] rounded-(--r-1)" style={{ border: "1px solid", ...TAG_STYLE[t.type] }}>{t.label}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── THREAD ─── */}
        <main className="flex flex-col h-screen min-w-0" style={{ background: "var(--bg)" }}>
          {/* Thread head */}
          <div className="flex justify-between items-center px-6 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>AA</span>
              <div>
                <div className="text-[15px] font-medium flex items-center gap-2" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
                  Aisha Adams
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] font-normal" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--signal)" }} />Active client · online monthly
                  </span>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>Last active 4m ago · Dubai (GMT+4) · session today 11:30</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
                <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
                <><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M23 9l-6 6M17 9l6 6" /></>,
                <><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="5" cy="12" r="2" /></>,
              ].map((paths, i) => (
                <button key={i} className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{paths}</svg>
                </button>
              ))}
            </div>
          </div>

          {/* Thread body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3.5">
            {MESSAGES.map((m, i) => (
              <div key={i}>
                {m.date && (
                  <div className="flex items-center gap-3 my-2.5">
                    <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{m.date}</span>
                    <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                )}
                {m.isImage ? (
                  <div className="flex gap-3 items-start" style={{ maxWidth: "80%" }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                    <div className="w-[200px] h-[160px] rounded-(--r-3) relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.86 0.04 80), oklch(0.78 0.06 60))" }}>
                      <span className="absolute bottom-2 left-2.5 font-mono text-[9.5px] uppercase tracking-[0.04em] opacity-60" style={{ color: "var(--ink)" }}>IMG · video frame</span>
                    </div>
                  </div>
                ) : (
                  <div className={`flex gap-3 items-start ${m.out ? "self-end flex-row-reverse" : ""}`} style={{ maxWidth: "80%" }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={m.out ? { background: "var(--dietitian)", color: "oklch(0.95 0 0)" } : { background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                    <div className="flex flex-col gap-1 min-w-0">
                      {m.name && (
                        <div className={`font-mono text-[10.5px] uppercase tracking-[0.04em] flex items-baseline gap-2 ${m.out ? "justify-end" : ""}`} style={{ color: "var(--fg-3)" }}>
                          <strong className="font-sans text-[12.5px] normal-case font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{m.name}</strong>
                          <span>{m.time}</span>
                        </div>
                      )}
                      <div
                        className="px-3.5 py-2.5 rounded-(--r-3) text-[13.5px] leading-relaxed whitespace-pre-line"
                        style={m.out ? { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" } : { background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)" }}
                      >
                        {m.text}
                        {m.attachment && (
                          <div className="flex gap-2.5 items-center px-3 py-2.5 rounded-(--r-2) mt-1.5" style={m.out ? { background: "oklch(0.22 0.008 80)", border: "1px solid oklch(0.3 0.008 80)" } : { background: "var(--bg)", border: "1px solid var(--border)" }}>
                            <div className="w-7 h-7 rounded-(--r-1) flex items-center justify-center shrink-0" style={m.out ? { background: "oklch(0.3 0.008 80)" } : { background: "var(--bg-2)" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: m.out ? "var(--bg)" : "var(--fg-2)" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12.5px] font-medium" style={{ color: m.out ? "var(--bg)" : "var(--ink)" }}>{m.attachment.name}</div>
                              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-px" style={{ color: m.out ? "oklch(0.7 0.005 85)" : "var(--fg-3)" }}>{m.attachment.meta}</div>
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: m.out ? "oklch(0.8 0.005 85)" : "var(--fg-2)" }}>↓ Download</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div className="flex gap-1.5 flex-wrap px-6 py-2 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
            {QUICK_REPLIES.map((qr) => (
              <span key={qr} className="px-3 py-1.5 text-[12.5px] rounded-full cursor-pointer" style={{ color: "var(--fg-2)", background: "var(--bg)", border: "1px solid var(--border)" }}>{qr}</span>
            ))}
          </div>

          {/* Composer */}
          <div className="px-6 py-3.5 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="rounded-(--r-3) px-3 pt-2.5 pb-2" style={{ border: "1px solid var(--border-2)" }}>
              <div className="text-[14px] w-full min-h-[44px]" style={{ color: "var(--ink)" }}>RPE 7 today — </div>
              <div className="flex justify-between items-center mt-1.5">
                <div className="flex gap-1">
                  {[
                    "M21.4 11l-9.2 9.2a6 6 0 0 1-8.4-8.4l9.2-9.2a4 4 0 0 1 5.6 5.6l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
                    "M3 3h18v18H3zM9 9h6v6H9z",
                    "M3 4h18v17H3zM3 9h18M8 2v4M16 2v4",
                    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
                    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
                  ].map((d) => (
                    <span key={d} className="w-6 h-6 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={d} /></svg>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-4)" }}>⌘ + Enter to send</span>
                  <button className="btn-primary-v2 sm">Send →</button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ─── CONTEXT RAIL ─── */}
        <aside className="flex flex-col gap-4.5 h-screen overflow-y-auto p-5" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)" }}>
          {/* About */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>About Aisha</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex gap-3 items-center p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>AA</span>
                <div className="flex-1">
                  <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>Aisha Adams</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>Online · monthly · joined Jan 2026</div>
                </div>
              </div>
              {[
                { k: "Time zone", v: "GMT+4 · Dubai" },
                { k: "Streak", v: "45 days" },
                { k: "Adherence · 30d", v: "88%" },
                { k: "Total spent", v: "$ 1,920.00" },
                { k: "Goals", v: "Build strength · maintain bodyweight" },
              ].map((r, i, arr) => (
                <div key={r.k} className="flex justify-between gap-2.5 px-4 py-2.5 text-[12.5px]" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                  <span className="font-mono text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", maxWidth: "60%" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next session */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Next session</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex gap-3 items-center p-4">
                <div className="text-center pr-3" style={{ borderRight: "1px solid var(--border)" }}>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>MAY</div>
                  <div className="text-[20px] font-medium leading-none" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.022em" }}>18</div>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Programming review</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>Today · 11:30 SAST · 30 min · Zoom</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared files */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Shared in this thread</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {SHARED_FILES.map((f, i) => (
                <div key={f.name} className="flex gap-2.5 items-center px-4 py-2.5 cursor-pointer hover:bg-bg-2" style={{ borderBottom: i < SHARED_FILES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-[26px] h-[26px] rounded-(--r-1) flex items-center justify-center shrink-0" style={{ background: "var(--bg-2)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth="1.5">
                      {f.icon === "doc" && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>}
                      {f.icon === "video" && <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></>}
                      {f.icon === "img" && <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{f.name}</div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-px" style={{ color: "var(--fg-3)" }}>{f.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ─── MOBILE fallback ─── */}
      <div className="lg:hidden p-4 flex flex-col gap-4">
        <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Inbox</div>
        {CONVERSATIONS.map((c) => (
          <div key={c.id} className="flex gap-2.5 p-3 rounded-(--r-2)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{c.init}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</span>
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{c.ts}</span>
              </div>
              <div className="text-[12.5px] mt-1 truncate" style={{ color: "var(--fg-2)" }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
