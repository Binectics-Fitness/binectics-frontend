"use client";

import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { useState } from "react";

const TICKETS = [
  { id: "SUP-2026-04841", subj: "Member's QR code isn't working at gate · Iron Lab", time: "8m", priority: "p1" as const, from: "Tunde A.", meta: "· 1 reply" },
  { id: "SUP-2026-04839", subj: "Stripe Connect onboarding stuck on \"tax info pending\"", time: "22m", priority: "p2" as const, from: "Apex Body · Manila", meta: "· you assigned" },
  { id: "SUP-2026-04835", subj: "\"Why can't I list 5 different package prices?\"", time: "42m", priority: "p3" as const, from: "Sarah Okafor", meta: "· feature ask" },
  { id: "SUP-2026-04832", subj: "Payout missing — expected May 19, no deposit yet", time: "1h", priority: "p1" as const, from: "Iron Lab", meta: "· escalated by L1" },
  { id: "SUP-2026-04828", subj: "Want to delete my account & all data (GDPR)", time: "2h", priority: "p2" as const, from: "Pier Botha", meta: "· legal hold" },
  { id: "SUP-2026-04825", subj: "Dietitian intake form not loading on Safari iOS 17", time: "3h", priority: "p2" as const, from: "Folake A.", meta: "· bug" },
  { id: "SUP-2026-04822", subj: "Multiple charges for same booking — refunded but anxious", time: "4h", priority: "p3" as const, from: "Marcus B.", meta: "· resolved-ish" },
  { id: "SUP-2026-04818", subj: "How do I bulk-import 320 existing members from Mindbody?", time: "6h", priority: "p3" as const, from: "Flow Studio · Cairo", meta: "· onboarding" },
];

export default function AdminTicketsPage() {
  const [activeTicket, setActiveTicket] = useState(0);
  const ticket = TICKETS[activeTicket];

  return (
    <AdminDashboardShell
      activeItem="Tickets"
      crumb="Help tickets"
      actions={
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] hidden sm:inline" style={{ color: "var(--fg-3)" }}>
            First-response · <span style={{ color: "var(--signal-ink)" }}>42m avg</span>
          </span>
          <button className="btn-ghost-v2">My queue</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 -m-4 sm:-m-7 min-h-0" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Ticket list pane */}
        <div className="flex flex-col" style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }}>
          <div className="p-4 flex flex-col gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-[18px] font-medium" style={{ letterSpacing: "-0.014em" }}>
              42 open <span className="font-normal" style={{ color: "var(--fg-3)" }}>· 8 mine</span>
            </h2>
            <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search tickets..." style={{ color: "var(--ink)" }} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { label: "Open", count: "42", active: true },
                { label: "P1", count: "5", active: false },
                { label: "Pending", count: "18", active: false },
                { label: "Mine", count: "8", active: false },
              ].map((f) => (
                <span
                  key={f.label}
                  className="font-mono text-[10px] uppercase tracking-[0.04em] px-[9px] py-1 rounded-full cursor-pointer"
                  style={{
                    background: f.active ? "var(--ink)" : "var(--bg)",
                    color: f.active ? "var(--bg)" : "var(--fg-3)",
                    border: f.active ? "1px solid var(--ink)" : "1px solid var(--border)",
                  }}
                >
                  {f.label} <span style={{ color: f.active ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 3 }}>{f.count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {TICKETS.map((t, i) => (
              <div
                key={t.id}
                className="p-[14px_18px] cursor-pointer"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: activeTicket === i ? "oklch(0.95 0.012 75)" : "transparent",
                  borderLeft: activeTicket === i ? "3px solid var(--brand)" : "none",
                  paddingLeft: activeTicket === i ? 15 : 18,
                }}
                onClick={() => setActiveTicket(i)}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{t.id}</span>
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{t.time}</span>
                </div>
                <div className="text-[13.5px] font-medium mt-1 leading-snug" style={{ color: "var(--ink)" }}>{t.subj}</div>
                <div className="flex gap-2 items-center mt-2 text-[11.5px] flex-wrap" style={{ color: "var(--fg-3)" }}>
                  <PriorityPill p={t.priority} />
                  <span>{t.from}</span>
                  <span>{t.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail pane */}
        <div className="flex flex-col min-h-0 overflow-y-auto">
          {/* Detail header */}
          <div className="p-[22px_28px_18px]" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
            <h1 className="text-[22px] font-medium leading-snug" style={{ letterSpacing: "-0.018em" }}>{ticket.subj}</h1>
            <div className="flex gap-6 mt-3.5 flex-wrap">
              {[
                { l: "Ticket", v: ticket.id },
                { l: "Reporter", v: "Tunde Adebayo · Member" },
                { l: "Provider", v: "Iron Lab Sea Point" },
                { l: "Priority", v: "P1 · gate access", color: "var(--danger)" },
                { l: "SLA", v: "1h 52m remaining" },
                { l: "Assigned", v: "You · Andile K." },
              ].map((m) => (
                <div key={m.l} className="flex flex-col gap-[3px]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{m.l}</span>
                  <span className="text-[13px] font-medium" style={{ color: m.color || "var(--ink)", fontFamily: m.l === "Ticket" ? "ui-monospace, monospace" : undefined }}>{m.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button className="btn-primary-v2">Reply</button>
              <button className="btn-ghost-v2">Reassign</button>
              <button className="btn-ghost-v2">Add note</button>
              <button className="btn-ghost-v2">Force-reissue QR</button>
              <button className="btn-ghost-v2 ml-auto" style={{ color: "var(--signal-ink)" }}>Mark resolved</button>
            </div>
          </div>

          {/* Thread */}
          <div className="p-[20px_28px] flex flex-col gap-3.5">
            <Bubble from="Tunde Adebayo" role="Member" when="11 min ago · via app">
              <p>I&apos;m standing at the gate at Iron Lab right now. I scanned my QR code three times and the turnstile keeps showing &ldquo;invalid code&rdquo;. The staff doesn&apos;t know what to do. Last session was great and I booked again this morning — booking ID BIN-2026-040112. Please help, I have 40 min before my class.</p>
            </Bubble>

            <div className="self-center font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 py-1 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}>
              System · Auto-pulled context: 1 active booking · check-in window opens 18:25 · QR re-issued 2x today
            </div>

            <Bubble from="Andile K." role="L2 Support" when="8 min ago" mine>
              <p>Tunde — sorry about that. I can see your booking is valid. The gate device at Iron Lab last synced 47 min ago, so your re-issued QR isn&apos;t on it yet. I&apos;ve just pushed a manual sync and granted you a one-time bypass code: <strong>4-8-2-1</strong>.</p>
              <p>Punch that into the gate keypad. I&apos;m watching the device come back online live.</p>
            </Bubble>

            <Bubble from="Tunde Adebayo" role="Member" when="6 min ago">
              <p>Worked — thank you so much. In tho.</p>
            </Bubble>

            <div className="self-center font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 py-1 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}>
              System · Device sync confirmed at 18:33 · QR validated · session checked-in
            </div>
          </div>

          {/* Reply area */}
          <div className="p-[14px_28px_18px] mt-auto" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="flex gap-1 mb-2">
              {["Reply", "Internal note", "Macro"].map((tab, i) => (
                <span
                  key={tab}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-(--r-1) cursor-pointer"
                  style={{
                    background: i === 0 ? "var(--ink)" : "var(--bg)",
                    color: i === 0 ? "var(--bg)" : "var(--fg-3)",
                    border: i === 0 ? "1px solid var(--ink)" : "1px solid var(--border)",
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>
            <textarea
              className="w-full rounded-(--r-2) p-[10px_12px] text-[13.5px] outline-none resize-y"
              style={{ border: "1px solid var(--border)", font: "inherit", minHeight: 80 }}
              defaultValue="Glad you're in. Just so you know, this happens roughly once a month when the gate device misses a sync window — usually our fault, not yours. I've added a watcher on Iron Lab's device and you'll get an auto-bypass code by SMS the next time. No need to ticket us."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--fg-3)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m13 3 1 7 7 1-7 1-1 7-1-7-7-1 7-1z" /></svg>
                3 Claude-suggested macros
              </span>
              <div className="flex gap-1.5">
                <button className="btn-ghost-v2">Save draft</button>
                <button className="btn-primary-v2">Send &amp; resolve</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
function PriorityPill({ p }: { p: "p1" | "p2" | "p3" }) {
  const styles: Record<string, { background: string; color: string; border?: string }> = {
    p1: { background: "var(--danger-soft)", color: "var(--danger)" },
    p2: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    p3: { background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)" },
  };
  return (
    <span className="font-mono text-[10px] px-1.5 py-[2px] rounded-full uppercase tracking-[0.04em]" style={styles[p]}>
      {p.toUpperCase()}
    </span>
  );
}

function Bubble({
  from,
  role,
  when,
  mine,
  children,
}: {
  from: string;
  role: string;
  when: string;
  mine?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-(--r-3) p-[14px_18px] max-w-[80%] ${mine ? "self-end" : ""}`}
      style={{
        background: mine ? "var(--ink)" : "var(--bg)",
        color: mine ? "var(--bg)" : "var(--ink)",
        border: mine ? "1px solid var(--ink)" : "1px solid var(--border)",
      }}
    >
      <div className="flex gap-2.5 items-baseline mb-1.5 text-[12px]">
        <span className="font-semibold" style={{ color: mine ? "var(--bg)" : "var(--ink)" }}>{from}</span>
        <span
          className="font-mono text-[9.5px] px-[5px] py-[1.5px] rounded-(--r-1) uppercase tracking-[0.04em]"
          style={{
            background: mine ? "oklch(0.32 0.01 80)" : "var(--bg-2)",
            color: mine ? "var(--bg)" : "var(--fg-2)",
          }}
        >
          {role}
        </span>
        <span className="font-mono text-[10.5px]" style={{ color: mine ? "oklch(0.7 0.005 80)" : "var(--fg-3)" }}>{when}</span>
      </div>
      <div className="text-[13.5px] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
