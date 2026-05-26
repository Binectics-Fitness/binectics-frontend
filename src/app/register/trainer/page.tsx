"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import SearchableSelect from "@/components/SearchableSelect";

/**
 * Onboarding — trainer track, step 3 "Your practice"
 * Hardcoded to match onboarding.html prototype.
 * 3-column layout: left stepper rail, center form, right summary.
 */

const ROLES = [
  { name: "Member", dot: "var(--ink)", tag: "Consumer", on: false },
  { name: "Trainer", dot: "var(--trainer)", tag: "Active", on: true },
  { name: "Gym / studio", dot: "var(--gym)", tag: "Business", on: false },
  { name: "Dietitian", dot: "var(--dietitian)", tag: "Licensed", on: false },
];

const STEPS = [
  { num: 1, label: "Step 01", title: "Pick your role", state: "done" },
  { num: 2, label: "Step 02", title: "Account basics", state: "done" },
  { num: 3, label: "Step 03", title: "Your practice", state: "now" },
  { num: 4, label: "Step 04", title: "Verification & payouts", state: "" },
  { num: 5, label: "Step 05", title: "Preview & go live", state: "" },
];

const CHIPS = [
  { label: "Beginners", on: true }, { label: "Intermediate", on: true }, { label: "Advanced", on: true },
  { label: "Youth (under 16)", on: false }, { label: "Masters (40+)", on: true }, { label: "Pre / post‑natal", on: true },
  { label: "Post‑rehab", on: false }, { label: "Marathon & triathlon", on: true }, { label: "Powerlifting prep", on: false },
];

const ACCOUNT = [
  { k: "Name", v: "Tunde Adebayo" }, { k: "Email", v: "tunde@gmail.com" }, { k: "City", v: "Lagos · Nigeria" }, { k: "Currency", v: "NGN ₦" },
];

const VERIF = [
  { num: "01", done: true, t: "Government ID", s: "NIN, driver's license, or passport · 2 min" },
  { num: "02", done: false, t: "Certification", s: "NSCA, ACE, NASM, or local equivalent" },
  { num: "03", done: false, t: "Payout method", s: "Bank account or mobile money" },
  { num: "04", done: false, t: "Two‑factor auth", s: "SMS or authenticator app" },
];

const PRIMARY_SPEC_OPTIONS = [
  { label: "Strength & conditioning", value: "strength-conditioning" },
  { label: "Olympic lifting", value: "olympic-lifting" },
  { label: "Powerlifting", value: "powerlifting" },
  { label: "Bodybuilding", value: "bodybuilding" },
  { label: "Functional fitness", value: "functional" },
  { label: "HIIT", value: "hiit" },
  { label: "Mobility & rehab", value: "mobility-rehab" },
];

const SECONDARY_SPEC_OPTIONS = [
  { label: "Endurance / running", value: "endurance-running" },
  { label: "Strength & conditioning", value: "strength-conditioning" },
  { label: "Olympic lifting", value: "olympic-lifting" },
  { label: "Yoga", value: "yoga" },
  { label: "Pilates", value: "pilates" },
  { label: "Mobility & rehab", value: "mobility-rehab" },
];

const SESSION_FORMAT_OPTIONS = [
  { label: "In‑person + remote programming", value: "in-person-remote" },
  { label: "In‑person only", value: "in-person" },
  { label: "Remote only", value: "remote" },
  { label: "Group sessions", value: "group" },
];

const LANGUAGE_OPTIONS = [
  { label: "English, Yoruba", value: "en-yo" },
  { label: "English", value: "en" },
  { label: "English, Igbo", value: "en-ig" },
  { label: "English, Hausa", value: "en-ha" },
  { label: "French", value: "fr" },
  { label: "Portuguese", value: "pt" },
];

export default function OnboardingTrainer() {
  const [primarySpec, setPrimarySpec] = useState("strength-conditioning");
  const [secondarySpec, setSecondarySpec] = useState("endurance-running");
  const [sessionFormat, setSessionFormat] = useState("in-person-remote");
  const [language, setLanguage] = useState("en-yo");

  return (
    <div className="min-h-screen grid mx-auto max-w-360 px-0 lg:px-8 grid-cols-1 lg:grid-cols-[280px_1fr_360px]" style={{ background: "var(--bg)" }}>

      {/* ═══ LEFT RAIL ═══ */}
      <aside className="hidden lg:flex flex-col gap-9 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)", padding: "28px 24px" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <BinecticsMark size={22} />
          <span className="font-semibold text-[17px]" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Binectics</span>
        </Link>

        {/* Role picker */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-4)" }}>Role</div>
          <div className="flex flex-col gap-1.5">
            {ROLES.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-(--r-2) cursor-pointer" style={{ border: `1px solid ${r.on ? "var(--ink)" : "var(--border)"}`, background: "var(--bg)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: r.dot }} />
                <span className="text-[13px] font-medium" style={{ color: r.on ? "var(--ink)" : "var(--fg-2)" }}>{r.name}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: r.on ? "var(--ink)" : "var(--fg-4)" }}>{r.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-4)" }}>Onboarding</div>
          <div className="flex flex-col">
            {STEPS.map((s, i) => (
              <div key={s.num} className="grid relative" style={{ gridTemplateColumns: "22px 1fr", gap: "12px", padding: "4px 0" }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && <span className="absolute z-0" style={{ left: "11px", top: "26px", bottom: 0, width: "1px", background: "var(--border-2)" }} />}
                {/* Number circle */}
                <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-[11px] z-[1]" style={{
                  background: s.state === "done" || s.state === "now" ? "var(--ink)" : "var(--bg)",
                  color: s.state === "done" || s.state === "now" ? "var(--bg)" : "var(--fg-3)",
                  border: s.state === "done" || s.state === "now" ? "1px solid var(--ink)" : "1px solid var(--border-2)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {s.state === "done" ? "✓" : s.num}
                </span>
                {/* Label */}
                <div style={{ paddingBottom: "18px", paddingTop: "1px" }}>
                  <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-4)" }}>{s.label}</div>
                  <div className="text-[13.5px] font-medium mt-0.5" style={{ color: s.state === "now" ? "var(--ink)" : "var(--fg-2)" }}>{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══ CENTER STAGE ═══ */}
      <main className="flex flex-col min-w-0">
        <div className="flex flex-col gap-6 sm:gap-8 max-w-[740px] px-5 py-8 sm:px-10 sm:py-12 lg:px-20 lg:py-14">
          {/* Head */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>Step 03 of 05 — trainer track</div>
            <h1 className="text-[26px] sm:text-[36px] font-medium mt-2.5" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Tell members about your training.</h1>
            <p className="text-[15.5px] mt-3 max-w-[580px] leading-relaxed" style={{ color: "var(--fg-3)" }}>This is the page members see before booking. Be specific, not generic — the trainers who book out fastest tend to commit to a tight focus.</p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4.5">
            {/* Headline */}
            <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Headline</label>
              <input className="rounded-(--r-2) px-3.5 py-3 text-[14px]" style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }} defaultValue="Strength & running coach · Lagos · in‑person + remote" />
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>Shows under your name in marketplace results. 60 characters used of 80.</span>
            </div>

            {/* About */}
            <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>About your practice</label>
              <textarea className="rounded-(--r-2) px-3.5 py-3 text-[14px] resize-none" style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)", fontFamily: "inherit", outline: "none", minHeight: "88px" }} defaultValue="I've coached recreational runners and lifters in Lagos for 9 years. My work is barbell strength built around your sport — most clients run a marathon, train for a triathlon, or just want to keep showing up without injury at 40+. Sessions in Lekki, V/I, and Ikeja. Remote programming for clients outside Lagos." />
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>240 characters · members see the first 180 in the search card.</span>
            </div>

            {/* Specializations */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Primary specialization</label>
              <SearchableSelect value={primarySpec} onChange={setPrimarySpec} options={PRIMARY_SPEC_OPTIONS} placeholder="Select specialization" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Secondary (optional)</label>
              <SearchableSelect value={secondarySpec} onChange={setSecondarySpec} options={SECONDARY_SPEC_OPTIONS} placeholder="Select secondary" />
            </div>

            {/* Who you work with */}
            <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Who you work with</label>
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <span key={c.label} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[13px] cursor-pointer" style={{
                    border: `1px solid ${c.on ? "var(--ink)" : "var(--border-2)"}`,
                    background: c.on ? "var(--ink)" : "transparent",
                    color: c.on ? "var(--bg)" : "var(--fg-2)",
                  }}>
                    {c.on && <span className="text-[11px]">✓</span>}
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Session + Languages */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Session formats</label>
              <SearchableSelect value={sessionFormat} onChange={setSessionFormat} options={SESSION_FORMAT_OPTIONS} placeholder="Select format" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Languages</label>
              <SearchableSelect value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} placeholder="Select languages" />
            </div>

            {/* Hero photo upload */}
            <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Hero photo</label>
              <div className="flex flex-col items-center gap-1.5 rounded-(--r-3) px-7 py-7 cursor-pointer" style={{ border: "1.5px solid var(--signal)", background: "var(--signal-soft)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--signal-ink)" }}><path d="M20 6L9 17l-5-5" /></svg>
                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>tunde-hero.jpg · uploaded</div>
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>3.2 MB · 2400×1500 · auto‑cropped to 16:9 for results card</div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav bar — sticky bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-5 sm:px-20 py-4 sm:py-6 sticky bottom-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
            Progress <strong className="font-medium" style={{ color: "var(--ink)" }}>· 60%</strong> — about 4 min left
          </div>
          <div className="flex gap-2.5">
            <button className="btn-ghost-v2 md">Save &amp; finish later</button>
            <button className="btn-ghost-v2 md">← Back</button>
            <button className="btn-primary-v2 md">Continue → verification</button>
          </div>
        </div>
      </main>

      {/* ═══ RIGHT SUMMARY RAIL ═══ */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)", padding: "36px 24px" }}>
        {/* Profile pill */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Your profile so far</div>
          <div className="mt-3.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-full font-mono text-[11px] uppercase tracking-[0.05em]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink)" }}>
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: "var(--trainer)" }} />
              Trainer · Lagos, NG
            </span>
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Account</div>
          {ACCOUNT.map((a) => (
            <div key={a.k} className="flex justify-between items-start py-2.5 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>{a.k}</span>
              <span className="text-[13px] font-medium text-right" style={{ color: "var(--ink)", maxWidth: "60%" }}>{a.v}</span>
            </div>
          ))}
        </div>

        {/* Verification checklist */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>Up next — verification</div>
          {VERIF.map((v, i) => (
            <div key={v.num} className="flex gap-4 py-3.5 items-center" style={{ borderBottom: i < VERIF.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="font-mono text-[11px] w-7 text-right" style={{ color: "var(--fg-4)", fontVariantNumeric: "tabular-nums" }}>{v.num}</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: v.done ? "var(--signal-ink)" : "var(--fg-4)" }}>
                <circle cx="12" cy="12" r="10" />
                {v.done && <path d="M9 12l2 2 4-4" />}
              </svg>
              <div>
                <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{v.t}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{v.s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Why we ask */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Why we ask</div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)", margin: 0 }}>
            Members see a verified badge on your profile only after ID and certification are confirmed by our team. Reviews trust scores by 3.4× on verified providers — so we move quickly. Most are approved in under 48 hours.
          </p>
        </div>
      </aside>
    </div>
  );
}
