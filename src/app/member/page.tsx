"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { openCommandBar } from "@/hooks/useCommandBar";
import { NotificationsDrawer } from "@/components/ds/NotificationsDrawer";

const WEEK = [
  { day: "Mon", date: 19, done: true },
  { day: "Tue", date: 20, done: true },
  { day: "Wed", date: 21, done: true },
  { day: "Thu", date: 22, done: false },
  { day: "Fri", date: 23, done: true },
  { day: "Sat", date: 24, done: false },
  { day: "Sun", date: 25, done: false, today: true },
];

export default function MemberHomePage() {
  const { user } = useAuth();
  const firstName = user?.first_name || "there";
  const initials = user ? `${(user.first_name?.[0] || "").toUpperCase()}${(user.last_name?.[0] || "").toUpperCase()}` : "—";
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      <style>{`
        .mh-nav-links { display: flex; gap: 4px; }
        .mh-shell { max-width: 1100px; margin: 0 auto; padding: 32px; }
        .mh-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
        .mh-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
        .mh-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .mh-topbar { padding: 12px 32px; }
        .mh-hamburger { display: none; }
        @media (max-width: 1024px) {
          .mh-kpis { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .mh-nav-links { display: none; }
          .mh-hamburger { display: flex; }
          .mh-topbar { padding: 12px 16px; }
          .mh-shell { padding: 20px 16px; }
          .mh-kpis { grid-template-columns: 1fr 1fr; }
          .mh-grid { grid-template-columns: 1fr; }
          .mh-shell h1 { font-size: 24px !important; }
        }
        @media (max-width: 480px) {
          .mh-shell { padding: 16px 14px; }
          .mh-kpis { grid-template-columns: 1fr; }
          .mh-week { grid-template-columns: repeat(7, 1fr); gap: 3px; }
        }
      `}</style>

      {/* ── Top nav ── */}
      <header className="mh-topbar" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 5 }}>
        <Link href="/" style={{ textDecoration: "none" }}><BinecticsLockup /></Link>
        <nav className="mh-nav-links">
          {[
            { label: "Home", href: "/member" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "Bookings", href: "/dashboard/bookings" },
            { label: "Messages", href: "/dashboard/messages" },
            { label: "Activity", href: "/dashboard/member/streaks" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{ padding: "7px 12px", color: link.label === "Home" ? "var(--ink)" : "var(--fg-2)", textDecoration: "none", fontSize: "13.5px", borderRadius: 6 }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="mh-hamburger"
            style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", cursor: "pointer", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button
            type="button"
            title="Search · ⌘K"
            onClick={openCommandBar}
            style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
          <button
            type="button"
            title="Notifications"
            onClick={() => setNotifOpen(true)}
            style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)" }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0" /></svg>
          </button>
          <Link href="/member/settings" style={{ textDecoration: "none" }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-3)", color: "var(--fg-2)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{initials}</span>
          </Link>
        </div>
      </header>

      {/* ── Shell ── */}
      <main className="mh-shell">
        {/* Greeting */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Sunday · 25 May · Cape Town
          </div>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.024em", fontWeight: 500, marginTop: 6, color: "var(--ink)" }}>
            Hey, <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>{firstName}</em>.
          </h1>
        </div>

        {/* KPI row */}
        <div className="mh-kpis">
          {[
            { label: "Streak", value: "32 days", delta: "↑ personal best" },
            { label: "This week", value: "4 / 5", delta: "1 more to hit goal" },
            { label: "Next session", value: "Wed 08:30", delta: "with Sarah · Sea Point", smallValue: true },
            { label: "Weight", value: "73.4 kg", delta: "↓ 1.8 kg · 4 weeks" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</div>
              <div style={{ fontSize: kpi.smallValue ? 18 : 24, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal-ink)", marginTop: 4 }}>{kpi.delta}</div>
            </div>
          ))}
        </div>

        {/* Main grid: 2fr 1fr */}
        <div className="mh-grid">
          {/* Left column */}
          <div>
            {/* Next up card */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 22, marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}>Next up</h3>
              <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 16, background: "var(--bg-2)", borderRadius: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>Strength session · Sarah Okafor</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3 }}>
                    Wed 28 May · 08:30 · 60 min · Iron Lab Sea Point
                  </div>
                </div>
                <Link href="/dashboard/bookings" className="btn-primary-v2 sm">Details</Link>
              </div>
            </div>

            {/* Week plan card */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 22, marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}>This week&apos;s plan · 4/5</h3>
              <div className="mh-week">
                {WEEK.map((d) => {
                  let bg = "var(--bg-2)";
                  let color = "var(--fg-3)";
                  if (d.done) { bg = "var(--signal-soft)"; color = "var(--signal-ink)"; }
                  if (d.today) { bg = "var(--ink)"; color = "var(--bg)"; }
                  return (
                    <div key={d.day} style={{ aspectRatio: "1", background: bg, color, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.7 }}>{d.day}</div>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>{d.date}</div>
                      {d.done && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Quick log card */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}>Quick log</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/dashboard/member/weight-log" className="btn-ghost-v2 sm" style={{ justifyContent: "center", width: "100%", gap: 8 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M7 7l10 10M17 7l-10 10" /></svg>
                  Log weight
                </Link>
                <Link href="/dashboard/member/meal-log" className="btn-ghost-v2 sm" style={{ justifyContent: "center", width: "100%", gap: 8 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
                  Log meal
                </Link>
                <Link href="/dashboard/member/workout-log" className="btn-ghost-v2 sm" style={{ justifyContent: "center", width: "100%", gap: 8 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.4 14.4 9.6 9.6M18 6l-8.4 8.4M2 22l4-4M22 2l-4 4M6 18l8.4-8.4" /></svg>
                  Log workout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
