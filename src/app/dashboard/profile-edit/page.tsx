"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Profile Edit — profile-edit.html prototype.
 * Provider profile editor with 3-column layout:
 * 232px sidebar + main (topbar + section nav + content) + 380px preview rail.
 * 9 sections: Basics, About, Photos, Specializations, Packages,
 * Verification, Availability, Booking rules, Payouts.
 * Preview rail: mock provider card, search rank bar, tips card.
 */

const SECTIONS = [
  { id: "basics", label: "Basics", complete: true },
  { id: "about", label: "About you", complete: true },
  { id: "photos", label: "Photos", complete: false },
  { id: "specs", label: "Specializations", complete: true },
  { id: "packages", label: "Packages", complete: true },
  { id: "verify", label: "Verification", warn: true },
  { id: "avail", label: "Availability", complete: true },
  { id: "rules", label: "Booking rules", complete: true },
  { id: "payouts", label: "Payouts", complete: true },
];

const PACKAGES = [
  { name: "Single session · 60 min", price: "R 1,200", on: true },
  { name: "4-session block", price: "R 4,200", on: true },
  { name: "Online coaching · 30 min", price: "R 850", on: true },
  { name: "Movement screen · intake", price: "R 600", on: false },
  { name: "12-week transformation", price: "R 9,800", on: true },
];

const DOCS = [
  { name: "Government ID", status: "Verified", date: "14 Jan 2026", ok: true },
  { name: "NSCA-CSCS", status: "Verified", date: "22 Feb 2026", ok: true },
  { name: "Public liability insurance", status: "Expiring 12 Jun", date: "01 Mar 2025", warn: true },
  { name: "CPR certification", status: "Verified", date: "03 Apr 2026", ok: true },
];

const WORKING_HOURS = [
  { day: "Mon", hours: "06:00 – 18:00", on: true },
  { day: "Tue", hours: "06:00 – 18:00", on: true },
  { day: "Wed", hours: "06:00 – 18:00", on: true },
  { day: "Thu", hours: "06:00 – 18:00", on: true },
  { day: "Fri", hours: "06:00 – 16:00", on: true },
  { day: "Sat", hours: "08:00 – 12:00", on: true },
  { day: "Sun", hours: "Off", on: false },
];

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className="shrink-0 relative cursor-pointer"
      style={{
        width: 30,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--ink)" : "var(--border-2)",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: 14,
          height: 14,
          background: "var(--bg)",
          top: 2,
          left: on ? 14 : 2,
          transition: "left var(--motion-fast) var(--ease)",
        }}
      />
    </span>
  );
}

export default function ProfileEditPage() {
  const [activeSection, setActiveSection] = useState("basics");

  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[232px_1fr_380px]"
      style={{
        background: "var(--bg-2)",
      }}
    >
      {/* ═══ SIDEBAR ═══ */}
      <aside
        className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto"
        style={{
          background: "var(--bg)",
          borderRight: "1px solid var(--border)",
          padding: "18px 14px",
        }}
      >
        <Link href="/">
          <BinecticsLockup />
        </Link>
        <div
          className="flex items-center gap-2.5 rounded-(--r-2)"
          style={{
            border: "1px solid var(--border)",
            padding: "8px 10px",
            background: "var(--bg)",
          }}
        >
          <span
            className="w-6.5 h-6.5 rounded-full flex items-center justify-center font-semibold text-[11px]"
            style={{ background: "var(--trainer)", color: "oklch(0.2 0.05 75)" }}
          >
            SO
          </span>
          <div style={{ flex: 1 }}>
            <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              Sarah Okafor
            </div>
            <div
              className="font-mono text-[11px] uppercase"
              style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}
            >
              Trainer &middot; Cape Town
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          <div
            className="font-mono text-[10.5px] uppercase px-2 py-1 mb-1"
            style={{ color: "var(--fg-4)", letterSpacing: "0.06em" }}
          >
            Work
          </div>
          {[
            { href: "/dashboard", label: "Today" },
            { href: "/dashboard/calendar", label: "Calendar" },
            { href: "/dashboard/messages", label: "Inbox", badge: "7" },
          ].map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] hover:bg-bg-2"
              style={{ color: "var(--fg-2)" }}
            >
              {n.label}
              {n.badge && (
                <span
                  className="ml-auto font-mono text-[11px] px-1.5 rounded-full"
                  style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}
                >
                  {n.badge}
                </span>
              )}
            </Link>
          ))}
          <div
            className="font-mono text-[10.5px] uppercase px-2 py-1 mt-3 mb-1"
            style={{ color: "var(--fg-4)", letterSpacing: "0.06em" }}
          >
            Practice
          </div>
          {[
            { href: "/dashboard/dietitian/earnings", label: "Earnings" },
            { href: "/dashboard/profile-edit", label: "My profile", on: true },
            { href: "/dashboard/settings", label: "Settings" },
          ].map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] ${n.on ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`}
              style={{ color: n.on ? "var(--ink)" : "var(--fg-2)" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex flex-col min-w-0">
        {/* Topbar */}
        <div
          className="flex items-center justify-between sticky top-0 z-10"
          style={{
            height: 56,
            padding: "0 28px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
            <Link href="/dashboard" style={{ color: "var(--fg-3)" }}>
              Dashboard
            </Link>
            <span style={{ color: "var(--fg-4)" }}>/</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>Edit profile</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10.5px] uppercase flex items-center gap-1.5"
              style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--signal)" }}
              />
              All changes saved
            </span>
            <button className="btn-ghost-v2 sm">Preview</button>
            <button className="btn-primary-v2 sm">Publish</button>
          </div>
        </div>

        {/* Page heading */}
        <div style={{ padding: "28px 28px 18px" }}>
          <h1
            className="text-[28px] font-medium"
            style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
          >
            Edit profile
          </h1>
          <p
            className="text-[13.5px] mt-1.5 max-w-[56ch] leading-[1.5]"
            style={{ color: "var(--fg-3)" }}
          >
            This is how you appear in the marketplace. Changes save
            automatically &mdash; hit Publish when you&apos;re ready for it to
            go live.
          </p>
        </div>

        {/* Section nav + content */}
        <div
          className="grid items-start grid-cols-1 lg:grid-cols-[200px_1fr]"
          style={{
            gap: 32,
            padding: "0 28px 80px",
          }}
        >
          {/* Section nav */}
          <nav className="sticky flex flex-col gap-0.5" style={{ top: 80 }}>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-between py-1.75 px-2.5 rounded-(--r-2) text-[13px] cursor-pointer"
                style={{
                  color: activeSection === s.id ? "var(--ink)" : "var(--fg-3)",
                  background: activeSection === s.id ? "var(--bg)" : "transparent",
                  fontWeight: activeSection === s.id ? 500 : 400,
                  borderLeft: activeSection === s.id ? "2px solid var(--ink)" : "2px solid transparent",
                  paddingLeft: activeSection === s.id ? "8px" : "10px",
                }}
              >
                {s.label}
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-semibold"
                  style={{
                    background: s.warn
                      ? "var(--warn)"
                      : s.complete
                        ? "var(--signal)"
                        : "var(--bg-3)",
                    color: s.complete || s.warn ? "var(--bg)" : "transparent",
                  }}
                >
                  {s.complete ? "✓" : ""}
                </span>
              </a>
            ))}
          </nav>

          {/* Sections content */}
          <div className="flex flex-col gap-4">
            {/* Basics */}
            <section
              id="basics"
              className="rounded-(--r-3) overflow-hidden"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="px-5.5 pt-4 pb-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                  Basics
                </h2>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                  How you appear in search and on your profile card.
                </div>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: "Display name", value: "Sarah Okafor" },
                    { label: "Headline", value: "Strength & running coach · CSCS" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[10.5px] uppercase"
                        style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}
                      >
                        {f.label}
                      </label>
                      <input
                        defaultValue={f.value}
                        className="h-10 rounded-(--r-2) px-3.5 text-[14px]"
                        style={{
                          border: "1px solid var(--border-2)",
                          color: "var(--ink)",
                          background: "var(--bg)",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    { label: "City", value: "Cape Town" },
                    { label: "Country", value: "South Africa" },
                    { label: "Currency", value: "ZAR" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label
                        className="font-mono text-[10.5px] uppercase"
                        style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}
                      >
                        {f.label}
                      </label>
                      <input
                        defaultValue={f.value}
                        className="h-10 rounded-(--r-2) px-3.5 text-[14px]"
                        style={{
                          border: "1px solid var(--border-2)",
                          color: "var(--ink)",
                          background: "var(--bg)",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="font-mono text-[10.5px] uppercase"
                    style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}
                  >
                    Languages
                  </label>
                  <div className="flex gap-1.5">
                    {["English", "isiZulu", "Afrikaans"].map((l) => (
                      <span
                        key={l}
                        className="px-3 py-1.5 rounded-full text-[12.5px]"
                        style={{
                          border: "1px solid var(--ink)",
                          color: "var(--ink)",
                          background: "var(--bg-2)",
                        }}
                      >
                        {l}
                      </span>
                    ))}
                    <span
                      className="px-3 py-1.5 rounded-full text-[12.5px] cursor-pointer"
                      style={{
                        border: "1px dashed var(--border-2)",
                        color: "var(--fg-3)",
                      }}
                    >
                      + Add
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* About */}
            <section
              id="about"
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>About you</h2>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Short bio for the listing card. Full bio for your profile page.</div>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase flex justify-between" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>
                    Short bio <span className="font-mono text-[11px]" style={{ color: "var(--fg-4)", textTransform: "none", letterSpacing: "normal" }}>186 / 240</span>
                  </label>
                  <textarea defaultValue="CSCS-certified strength coach helping runners lift heavier without giving up their miles. 7 years, 400+ clients, Iron Lab Sea Point." className="rounded-(--r-2) px-3.5 py-3 text-[14px] resize-y" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 80 }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Full bio</label>
                  <textarea defaultValue="I started powerlifting in 2019 and fell in love with the barbell. After getting my CSCS and training 400+ people, I still believe that getting strong is the simplest thing you can do for your health — and the hardest to do alone. My sessions are structured but never rigid. You bring the effort; I bring the plan, the coaching cues, and the accountability." className="rounded-(--r-2) px-3.5 py-3 text-[14px] resize-y" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 120 }} />
                </div>
              </div>
            </section>

            {/* Photos */}
            <section id="photos" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Photos</h2>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>First photo is your hero. Drag to reorder.</div>
              </div>
              <div className="p-5.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="aspect-[4/3] rounded-(--r-2) relative col-span-2 row-span-2" style={{ background: "linear-gradient(135deg, oklch(0.86 0.04 80), oklch(0.78 0.06 60))", border: "1px solid var(--border)" }}>
                    <span className="absolute top-2 left-2 font-mono text-[9.5px] uppercase px-1.5 py-0.5 rounded-(--r-1)" style={{ color: "var(--ink)", background: "var(--bg)", letterSpacing: "0.05em", fontWeight: 500 }}>Hero</span>
                  </div>
                  <div className="aspect-[4/5] rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.84 0.05 120), oklch(0.74 0.08 95))", border: "1px solid var(--border)" }} />
                  <div className="aspect-[4/5] rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.84 0.03 240), oklch(0.72 0.05 220))", border: "1px solid var(--border)" }} />
                  <div className="aspect-[4/5] rounded-(--r-2)" style={{ background: "linear-gradient(135deg, oklch(0.84 0.04 60), oklch(0.72 0.06 40))", border: "1px solid var(--border)" }} />
                  <div className="aspect-[4/5] rounded-(--r-2) flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-ink" style={{ background: "var(--bg-2)", border: "1.5px dashed var(--border-2)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ color: "var(--fg-3)" }}><path d="M12 5v14M5 12h14" /></svg>
                    <span className="font-mono text-[9.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.05em" }}>Upload</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Specializations */}
            <section id="specs" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Specializations</h2>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[10.5px] uppercase mb-2 block" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Primary</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Strength & conditioning", "Running coaching", "Powerlifting", "Olympic weightlifting"].map((s, i) => (
                      <span key={s} className="px-3 py-1.75 rounded-full text-[12.5px] cursor-pointer" style={{ border: i < 2 ? "1px solid var(--ink)" : "1px solid var(--border-2)", color: i < 2 ? "var(--ink)" : "var(--fg-2)", background: i < 2 ? "var(--bg-2)" : "var(--bg)" }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10.5px] uppercase mb-2 block" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Clients</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Adults 25–45", "Athletes", "Runners", "Beginners"].map((s, i) => (
                      <span key={s} className="px-3 py-1.75 rounded-full text-[12.5px] cursor-pointer" style={{ border: i < 3 ? "1px solid var(--ink)" : "1px solid var(--border-2)", color: i < 3 ? "var(--ink)" : "var(--fg-2)", background: i < 3 ? "var(--bg-2)" : "var(--bg)" }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10.5px] uppercase mb-2 block" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Formats</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["In-person 1:1", "Online video", "Group class"].map((s, i) => (
                      <span key={s} className="px-3 py-1.75 rounded-full text-[12.5px] cursor-pointer" style={{ border: i < 2 ? "1px solid var(--ink)" : "1px solid var(--border-2)", color: i < 2 ? "var(--ink)" : "var(--fg-2)", background: i < 2 ? "var(--bg-2)" : "var(--bg)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Packages */}
            <section id="packages" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Packages</h2>
                  <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Drag to reorder. Toggle off to hide from your listing.</div>
                </div>
                <button className="btn-ghost-v2 sm">+ Add package</button>
              </div>
              {PACKAGES.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3.5 px-5.5 py-3.5" style={{ borderBottom: i < PACKAGES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 cursor-grab" style={{ color: "var(--fg-4)" }}><path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" /></svg>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</div>
                  </div>
                  <span className="font-mono text-[13px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{p.price}</span>
                  <Toggle on={p.on} />
                </div>
              ))}
            </section>

            {/* Verification */}
            <section id="verify" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Verification</h2>
                  <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Documents our team has reviewed.</div>
                </div>
                <button className="btn-ghost-v2 sm">+ Upload</button>
              </div>
              {DOCS.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3 px-5.5 py-3.5" style={{ borderBottom: i < DOCS.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: d.warn ? "oklch(0.96 0.06 75)" : "var(--signal-soft)", color: d.warn ? "oklch(0.45 0.16 75)" : "var(--signal-ink)" }}>{d.ok ? "✓" : "!"}</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{d.name}</div>
                    <div className="font-mono text-[10.5px] uppercase" style={{ color: d.warn ? "oklch(0.45 0.16 75)" : "var(--fg-3)", letterSpacing: "0.04em" }}>{d.status} &middot; {d.date}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* Availability */}
            <section id="avail" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Availability</h2>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3.5">
                  {[
                    { label: "Timezone", value: "Africa/Johannesburg (SAST)" },
                    { label: "Min notice", value: "4 hours" },
                    { label: "Max horizon", value: "30 days" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>{f.label}</label>
                      <input defaultValue={f.value} className="h-10 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="font-mono text-[10.5px] uppercase mb-2 block" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Working week</label>
                  {WORKING_HOURS.map((w, i) => (
                    <div key={w.day} className="flex items-center gap-2 py-2.25 text-[12.5px]" style={{ borderBottom: i < WORKING_HOURS.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span className="font-mono text-[11px] uppercase w-9" style={{ color: "var(--ink)", letterSpacing: "0.04em" }}>{w.day}</span>
                      <span className="flex-1 font-mono text-[12px]" style={{ color: w.on ? "var(--ink)" : "var(--fg-4)", fontVariantNumeric: "tabular-nums" }}>{w.hours}</span>
                      <Toggle on={w.on} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Booking rules */}
            <section id="rules" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Booking rules</h2>
              </div>
              {[
                { label: "Require confirmation before charging", on: true },
                { label: "Auto-confirm returning clients", on: true },
                { label: "Allow online bookings", on: true },
                { label: "Allow same-day bookings", on: false },
                { label: "Send intake questionnaire", on: true },
              ].map((r, i, a) => (
                <div key={r.label} className="flex items-center justify-between px-5.5 py-3.5" style={{ borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>{r.label}</span>
                  <Toggle on={r.on} />
                </div>
              ))}
            </section>

            {/* Payouts */}
            <section id="payouts" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payouts</h2>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Where your earnings go and when.</div>
              </div>
              <div className="p-5.5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { label: "Gateway", value: "Paystack" },
                    { label: "Account", value: "FNB ****4821" },
                    { label: "Schedule", value: "Weekly · every Monday" },
                    { label: "Minimum", value: "R 500" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>{f.label}</label>
                      <input defaultValue={f.value} className="h-10 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} readOnly />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ═══ PREVIEW RAIL ═══ */}
      <aside
        className="hidden lg:flex flex-col gap-4.5 sticky top-0 h-screen overflow-y-auto"
        style={{
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--border)",
          padding: "18px 18px",
        }}
      >
        <div className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Preview</div>

        {/* Provider card preview */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="aspect-[5/3]" style={{ background: "linear-gradient(135deg, oklch(0.86 0.04 80), oklch(0.78 0.06 60))" }} />
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--fg-2)" }}>
              <span style={{ color: "var(--ink)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>
              </span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>4.9</span>
              &middot; 312 reviews
            </div>
            <div className="text-[16px] font-medium mt-1.5" style={{ letterSpacing: "-0.014em", color: "var(--ink)" }}>Sarah Okafor</div>
            <div className="text-[13px] mt-0.5" style={{ color: "var(--fg-3)" }}>Strength &amp; running coach &middot; Cape Town</div>
            <div className="flex flex-wrap gap-1.25 mt-2">
              {["CSCS", "Strength", "Running"].map((t) => (
                <span key={t} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{t}</span>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="font-mono text-[13.5px] font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>R 1,200 <small className="font-normal" style={{ color: "var(--fg-3)" }}>/ session</small></span>
              <span className="font-mono text-[11.5px]" style={{ color: "var(--signal-ink)" }}>Accepting clients</span>
            </div>
          </div>
        </div>

        {/* Search rank */}
        <div className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="font-mono text-[10.5px] uppercase mb-2" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Search rank</div>
          <div className="flex items-center gap-2.5">
            <div className="text-[22px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>#4</div>
            <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>of 86 trainers in Cape Town</div>
          </div>
          <div className="h-1.5 rounded-full mt-3" style={{ background: "var(--bg-3)" }}>
            <div className="h-full rounded-full" style={{ width: "94%", background: "var(--signal)" }} />
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="font-mono text-[10.5px] uppercase mb-2" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Tips to rank higher</div>
          <div className="flex flex-col gap-2.5 text-[12.5px]" style={{ color: "var(--fg-2)" }}>
            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>{"✓"}</span>
              Add a 5th photo to fill the grid
            </div>
            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5" style={{ background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>!</span>
              Renew your insurance before 12 Jun
            </div>
            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--bg-3)" }} />
              Add online session format to reach remote clients
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
