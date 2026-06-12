import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Profile",
  description: "Edit your trainer profile, specialties, and certifications.",
};

/**
 * Profile edit — profile-edit.html prototype.
 * Left section nav with checkmarks, scrolling form sections, right preview rail.
 */

const SECTIONS = [
  { id: "basics", label: "Basics", complete: true },
  { id: "bio", label: "Bio & headline", complete: true },
  { id: "photos", label: "Photos", complete: true },
  { id: "credentials", label: "Credentials", warn: true },
  { id: "schedule", label: "Schedule", complete: true },
  { id: "payout", label: "Payout", complete: true },
];

const DOCS = [
  { abbr: "NM", name: "NASM · Certified Personal Trainer", meta: "License #CPT-284921 · expires Mar 2028", status: "verified" },
  { abbr: "CS", name: "CSCS · NSCA", meta: "Certified Sep 2022 · renewal Feb 2027", status: "verified" },
  { abbr: "FA", name: "First Aid · Level 3", meta: "Certified Jan 2024 · expires Jan 2026", status: "expiring" },
];

export default function TrainerProfileEditPage() {
  return (
    <TrainerDashboardShell
      activeItem="My profile"
      crumb="My profile"
      actions={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--signal-ink)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />All changes saved
          </span>
          <button className="btn-ghost-v2 sm">Preview listing</button>
          <button className="btn-primary-v2 sm">Publish changes</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="hidden lg:flex sticky top-20 flex-col gap-0.5">
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={`flex items-center justify-between px-2.5 py-1.75 rounded-(--r-2) text-[13px] ${i === 0 ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)", borderLeft: i === 0 ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: i === 0 ? "8px" : "10px", textDecoration: "none" }}>
              {s.label}
              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: s.complete ? "var(--signal)" : s.warn ? "var(--warn)" : "var(--bg-3)", color: s.complete ? "var(--bg)" : "transparent" }}>
                {s.complete && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
              </span>
            </a>
          ))}
          {/* Rank tip */}
          <div className="mt-4 p-3 rounded-(--r-3)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Search rank</div>
            <div className="text-[18px] font-medium mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>#14 <small className="text-[12px] font-normal" style={{ color: "var(--fg-3)" }}>in Cape Town</small></div>
            <div className="text-[12px] mt-2 leading-relaxed" style={{ color: "var(--fg-3)" }}>Add a video intro to move up 3–5 positions. Profiles with video get 2.4× more bookings.</div>
          </div>
        </nav>

        {/* Form sections */}
        <div className="flex flex-col gap-10">
          <section id="basics">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Basics</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Name, specialization, and location. This is what shows in search results.</p>
            <div className="flex flex-col gap-4 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Display name", value: "Sarah Okafor" }, { label: "Credentials suffix", value: "CSCS" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Primary specialization", value: "Strength & conditioning" }, { label: "Secondary", value: "Running · endurance" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "City", value: "Cape Town" }, { label: "Country", value: "South Africa · ZA" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="bio">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Bio & headline</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Members see the headline in search cards and the bio on your full profile.</p>
            <div className="flex flex-col gap-4 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Headline</label>
                <input required maxLength={80} defaultValue="Strength & running coach · Lagos · in-person + remote" className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>60 characters used of 80. Shows under your name in marketplace results.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>About your practice</label>
                <textarea required minLength={50} maxLength={500} defaultValue="I've coached recreational runners and lifters in Lagos for 9 years. My work is barbell strength built around your sport — most clients run a marathon, train for a triathlon, or just want to keep showing up without injury at 40+." className="rounded-(--r-2) px-3 py-3 text-[14px] resize-y" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: "100px" }} />
                <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>240 characters · members see the first 180 in the search card.</span>
              </div>
            </div>
          </section>

          <section id="credentials">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Credentials</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Upload certificates for verification. Verified credentials earn the badge and rank higher.</p>
            <div className="flex flex-col gap-3 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {DOCS.map((d) => (
                <div key={d.abbr} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", borderLeftWidth: "3px", borderLeftColor: d.status === "verified" ? "var(--signal)" : d.status === "expiring" ? "var(--warn)" : "var(--border)" }}>
                  <span className="w-9 h-9 rounded-(--r-2) flex items-center justify-center text-[10px] font-semibold" style={{ background: d.status === "expiring" ? "var(--trainer-soft)" : "var(--gym)", color: d.status === "expiring" ? "oklch(0.45 0.12 75)" : "oklch(0.98 0 0)" }}>{d.abbr}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{d.name}</div>
                    <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{d.meta}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: d.status === "verified" ? "var(--signal-ink)" : "oklch(0.45 0.16 75)", background: d.status === "verified" ? "var(--signal-soft)" : "var(--trainer-soft)" }}>{d.status === "verified" ? "Verified" : "Expiring"}</span>
                </div>
              ))}
              <button className="btn-ghost-v2 sm self-start">+ Upload credential</button>
            </div>
          </section>
        </div>

        {/* Preview rail */}
        <div className="hidden lg:block sticky top-20">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Live preview</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="aspect-[4/5] relative" style={{ background: "repeating-linear-gradient(135deg, oklch(0.92 0.012 75) 0 10px, oklch(0.94 0.01 75) 10px 20px)", borderBottom: "1px solid var(--border)" }}>
              <span className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Portrait · Sarah Okafor</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--fg-2)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--ink)" }}><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>
                <span className="font-medium" style={{ color: "var(--ink)" }}>4.9</span>
                <span>· 312 reviews</span>
              </div>
              <div className="text-[15px] font-medium mt-1.5" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>Sarah Okafor</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>Strength & conditioning · 6 years</div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {["Online", "In‑person", "English"].map((t) => (
                  <span key={t} className="inline-flex items-center h-5 px-1.5 rounded-(--r-1) text-[11px] bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{t}</span>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="font-mono text-[13px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>R 1,200 <small className="font-normal" style={{ color: "var(--fg-3)" }}>/ session</small></span>
                <span className="font-mono text-[11px]" style={{ color: "var(--signal-ink)" }}>Accepting clients</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
