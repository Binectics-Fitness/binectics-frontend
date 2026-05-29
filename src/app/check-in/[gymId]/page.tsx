"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";

/**
 * QR check-in success — the one celebratory moment.
 * Kiosk frame with idle → success animation.
 * Hardcoded to match checkin.html prototype.
 */

/* ─── Inline styles for animations (CSS-in-JS since these need keyframes) ─── */
const ANIM_CSS = `
@keyframes scan { 0% { top: 8px; opacity: 0.5; } 50% { top: calc(100% - 10px); opacity: 1; } 100% { top: 8px; opacity: 0.5; } }
@keyframes livedot { 50% { opacity: 0.4; } }
@keyframes flash { 0% { transform: translateY(-100%); } 100% { transform: translateY(0%); } }
@keyframes ringIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes ringFade { to { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border-2); } }
@keyframes tickdraw { to { stroke-dashoffset: 0; } }
@keyframes tickfade { to { opacity: 0; transform: scale(0.7); } }
@keyframes photoIn { to { opacity: 1; transform: scale(1); } }
@keyframes riseIn { to { opacity: 1; transform: translateY(0); } }
`;

const TIMELINE = [
  { id: "flash", label: "Status flash", sub: "top bar slides in", ms: "200–1000" },
  { id: "ring", label: "Success ring", sub: "scale 0 → 1", ms: "50–550" },
  { id: "tick", label: "Tick draw", sub: "SVG stroke 60 → 0", ms: "350–670" },
  { id: "photo", label: "Photo reveal", sub: "ring becomes frame", ms: "800–1300" },
  { id: "name", label: "Name rise", sub: "8px translate + fade", ms: "950–1450" },
  { id: "type", label: "Membership", sub: "translate + fade", ms: "1040–1540" },
  { id: "nextcls", label: "Next class card", sub: "translate + fade", ms: "1180–1680" },
  { id: "streak", label: "Streak card", sub: "translate + fade", ms: "1300–1800" },
  { id: "count", label: "Streak ticks +1", sub: "rAF number tween", ms: "1550–2150" },
  { id: "plus", label: "+1 badge", sub: "fade in", ms: "1700–2100" },
  { id: "welcome", label: "Welcome line", sub: "serif italic fade", ms: "1600–2100" },
];

const TOKENS = [
  { k: "fast", v: "120 ms" }, { k: "base", v: "200 ms" },
  { k: "slow", v: "400 ms" }, { k: "hero", v: "500 ms" },
  { k: "ease-out", v: ".16, 1, .3, 1" }, { k: "ease-spring", v: ".34, 1.4, .64, 1" },
];

export default function CheckInPage() {
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // Auto-play on mount
  useEffect(() => {
    const t = setTimeout(() => { setRunKey(1); setPlaying(true); }, 800);
    return () => clearTimeout(t);
  }, []);

  const replay = () => {
    setPlaying(false);
    setTimeout(() => { setRunKey((k) => k + 1); setPlaying(true); }, 100);
  };

  return (
    <div style={{ background: "var(--bg)" }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      <div className="mx-auto max-w-[1320px] px-5 sm:px-10 pt-8 pb-20">
        {/* Topbar */}
        <div className="flex justify-between items-center pb-5 mb-10" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
            <Link href="/" className="hover:text-ink">Binectics</Link>
            <span style={{ color: "var(--fg-4)" }}>/</span>
            <span>Motion</span>
            <span style={{ color: "var(--fg-4)" }}>/</span>
            <span style={{ color: "var(--ink)" }}>QR check‑in success</span>
          </div>
          <span className="font-mono text-[11.5px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>v0.3 · Mar 2026</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 mb-8 items-end">
          <div>
            <h1 className="text-[26px] sm:text-[36px] font-medium leading-[1.05] max-w-[18ch]" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
              The one moment that earns the warmth.
            </h1>
            <p className="text-[15px] mt-2.5 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-2)" }}>
              Every other surface in Binectics is a tool. This is the one place — the second the door opens — where motion is the feature, not the finish. A 2‑second sequence, four members, one set of rules.
            </p>
          </div>
          <div className="hidden sm:flex gap-7 font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
            {[{ k: "Total", v: "2,050 ms" }, { k: "Events", v: "9" }, { k: "Easings", v: "2" }, { k: "Surface", v: "Wall kiosk" }].map((m) => (
              <div key={m.k}>
                <div className="text-[10px] mb-1" style={{ color: "var(--fg-4)" }}>{m.k}</div>
                <div className="text-[14px] font-medium normal-case" style={{ color: "var(--ink)", letterSpacing: "-0.005em", fontFamily: "var(--font-sans)" }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout: kiosk + spec panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-12 items-start">

          {/* ═══ KIOSK STAGE ═══ */}
          <div className="flex items-center justify-center relative rounded-(--r-3) p-4 sm:p-8 lg:p-16" style={{ background: "oklch(0.93 0.005 80)", border: "1px solid var(--border)", minHeight: "820px", backgroundImage: "radial-gradient(circle at 50% 30%, oklch(0 0 0 / 0.04), transparent 70%)" }}>
            {/* Tags */}
            <div className="absolute top-4.5 left-5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)", boxShadow: "0 0 0 3px oklch(0.68 0.16 148 / 0.2)", animation: "livedot 1.4s ease-in-out infinite" }} />
              Live · Iron Lab kiosk · entry door
            </div>
            <div className="absolute top-4.5 right-5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>16:24 SAST · 28 mar</div>

            {/* Kiosk device */}
            <div className="relative" style={{ width: "min(360px, 100%)", maxWidth: "100%", height: "720px", background: "oklch(0.10 0.005 80)", borderRadius: "32px", padding: "12px", boxShadow: "0 30px 50px -22px oklch(0 0 0 / 0.35), 0 2px 0 0 oklch(0 0 0 / 0.06) inset, 0 -2px 0 0 oklch(1 0 0 / 0.04) inset" }}>
              {/* Camera dot */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-10" style={{ background: "oklch(0.20 0.01 240)" }} />

              {/* Screen */}
              <div className="w-full h-full rounded-[22px] overflow-hidden relative flex flex-col" style={{ background: "var(--bg)" }}>
                {/* Status bar */}
                <div className="flex justify-between items-center px-4.5 pt-3.5 pb-2 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                  <div className="flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                    <BinecticsMark size={12} strokeWidth={1.4} />
                    <span>Iron Lab · Sea Point</span>
                  </div>
                  <span>16:24</span>
                </div>

                {/* Stage area */}
                <div className="flex-1 relative overflow-hidden">
                  {/* IDLE state */}
                  <div className="absolute inset-0 flex flex-col items-center pt-14 px-7 pb-8" style={{ opacity: playing ? 0 : 1, transition: "opacity 200ms ease-out", pointerEvents: playing ? "none" : "auto" }}>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] mb-4.5" style={{ color: "var(--fg-3)" }}>Scan to enter</div>
                    <div className="text-[26px] font-medium text-center mb-8 max-w-[14ch]" style={{ letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1.1 }}>
                      Hold your <em className="font-serif font-normal italic">Binectics</em> code up to the camera
                    </div>
                    {/* Viewfinder */}
                    <div className="relative w-40 h-40 sm:w-50 sm:h-50 mb-7">
                      <span className="absolute top-0 left-0 w-7 h-7" style={{ borderTop: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
                      <span className="absolute top-0 right-0 w-7 h-7" style={{ borderTop: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
                      <span className="absolute bottom-0 left-0 w-7 h-7" style={{ borderBottom: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
                      <span className="absolute bottom-0 right-0 w-7 h-7" style={{ borderBottom: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
                      {/* Scan line */}
                      <div className="absolute left-2 right-2 h-0.5" style={{ background: "linear-gradient(to right, transparent, var(--signal), transparent)", boxShadow: "0 0 12px var(--signal)", animation: "scan 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite" }} />
                    </div>
                    <div className="text-[13.5px] text-center max-w-[22ch] leading-[1.45]" style={{ color: "var(--fg-3)" }}>Camera unlocks the door · checks you in · counts your streak.</div>
                    <div className="mt-auto w-full flex justify-between items-center pt-3.5 font-mono text-[10.5px] uppercase tracking-[0.05em]" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
                      <span>Today · <span style={{ color: "var(--ink)" }}>216 checked in</span></span>
                      <span>Door ✓</span>
                    </div>
                  </div>

                  {/* SUCCESS state */}
                  <div key={runKey} className="absolute inset-0 flex flex-col pt-9 px-7 pb-6" style={{ opacity: playing ? 1 : 0, pointerEvents: playing ? "auto" : "none" }}>
                    {/* Flash bar */}
                    <div className="absolute top-0 left-0 right-0 h-9 flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.07em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)", animation: playing ? "flash 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards" : "none", transform: "translateY(-100%)" }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M 2.5 6 L 5 8.5 L 9.5 4" /></svg>
                      Checked in · 16:24
                    </div>

                    {/* Ring + photo */}
                    <div className="flex justify-center pt-9 mb-5.5">
                      <div className="w-28 h-28 sm:w-35 sm:h-35 rounded-full relative" style={{ background: "var(--signal)", animation: playing ? "ringIn 500ms cubic-bezier(0.34, 1.4, 0.64, 1) 50ms forwards, ringFade 400ms ease-out 800ms forwards" : "none", transform: "scale(0)", opacity: 0 }}>
                        {/* Tick */}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ animation: playing ? "tickfade 300ms ease-out 850ms forwards" : "none" }}>
                          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "oklch(0.985 0.005 85)" }}>
                            <path d="M 5 12 L 10 17 L 19 7" style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: playing ? "tickdraw 320ms cubic-bezier(0.16, 1, 0.3, 1) 350ms forwards" : "none" }} />
                          </svg>
                        </div>
                        {/* Photo */}
                        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center text-[56px] font-medium" style={{ color: "var(--ink)", background: "oklch(0.86 0.04 80)", opacity: 0, transform: "scale(0.85)", animation: playing ? "photoIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 800ms forwards" : "none" }}>
                          LM
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="text-center text-[26px] font-medium mb-1" style={{ letterSpacing: "-0.025em", color: "var(--ink)", opacity: 0, transform: "translateY(8px)", animation: playing ? "riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 950ms forwards" : "none" }}>
                      Lerato Mokoena
                    </div>
                    <div className="text-center font-mono text-[10.5px] uppercase tracking-[0.06em] mb-5" style={{ color: "var(--fg-3)", opacity: 0, transform: "translateY(6px)", animation: playing ? "riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1040ms forwards" : "none" }}>
                      Iron Lab Member · 2 years
                    </div>

                    {/* Next class card */}
                    <div className="flex items-center gap-3 px-3.5 py-3 rounded-(--r-3) mb-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", opacity: 0, transform: "translateY(6px)", animation: playing ? "riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1180ms forwards" : "none" }}>
                      <div className="w-11 flex flex-col items-center font-mono text-[9.5px] uppercase tracking-[0.05em] leading-[1.1]" style={{ color: "var(--fg-3)" }}>
                        <span className="text-[19px] font-medium normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>6:30</span>
                        <span>PM</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Strength</div>
                        <div className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>with Sarah Okafor</div>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-3.5 px-3.5 py-3.5 rounded-(--r-3) mb-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", opacity: 0, transform: "translateY(6px)", animation: playing ? "riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1300ms forwards" : "none" }}>
                      <div className="text-[36px] font-medium" style={{ letterSpacing: "-0.04em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>24</div>
                      <div>
                        <div className="text-[13px]" style={{ letterSpacing: "-0.005em", color: "var(--ink)", marginBottom: "2px" }}>Day streak</div>
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)", lineHeight: 1.3 }}>day streak</div>
                      </div>
                      <span className="ml-auto font-mono text-[11px] px-2 py-1 rounded-(--r-1)" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)", opacity: 0, transform: "translateY(-4px)", animation: playing ? "riseIn 400ms cubic-bezier(0.16, 1, 0.3, 1) 1700ms forwards" : "none" }}>+1</span>
                    </div>

                    {/* Welcome */}
                    <div className="mt-auto text-center font-serif italic text-[18px] pt-3" style={{ color: "var(--fg-2)", letterSpacing: "-0.01em", opacity: 0, transform: "translateY(6px)", animation: playing ? "riseIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1600ms forwards" : "none" }}>
                      Welcome back
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT: MOTION SPEC ═══ */}
          <div className="hidden lg:flex flex-col gap-5.5 sticky top-6">
            {/* Controls */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex justify-between items-center px-4 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <span>01 · Now playing</span>
                <span>{playing ? "success" : "idle"}</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { nm: "Lerato M.", tg: "Standard" },
                    { nm: "Marcus C.", tg: "PR potential" },
                    { nm: "Aisha P.", tg: "First-timer" },
                    { nm: "Daniel K.", tg: "Returning" },
                  ].map((c, i) => (
                    <div key={c.nm} className="flex flex-col gap-[3px] px-3 py-2.5 rounded-(--r-2) cursor-pointer" style={{ border: `1px solid ${i === 0 ? "var(--ink)" : "var(--border)"}`, background: "var(--bg)" }}>
                      <span className="text-[13px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{c.nm}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>{c.tg}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3.5">
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-(--r-2) text-[13px] cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 7 2 L 4 6 L 7 10" /></svg>
                  </button>
                  <button onClick={replay} className="flex-[3] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9.5 5 A 4 4 0 1 0 10 7" /><path d="M 9.5 2.5 L 9.5 5 L 7 5" /></svg>
                    Replay sequence
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-(--r-2) text-[13px] cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 5 2 L 8 6 L 5 10" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline events */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex justify-between items-center px-4 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <span>02 · Timeline</span>
                <span>0 ms</span>
              </div>
              <div className="p-4">
                <div className="list-none p-0 m-0" style={{ borderTop: "1px solid var(--border)" }}>
                  {TIMELINE.map((ev) => (
                    <div key={ev.id} className="grid gap-2.5 py-2.25 items-center" style={{ gridTemplateColumns: "18px 1fr auto", borderBottom: "1px solid var(--border)" }}>
                      <span className="w-2 h-2 rounded-full ml-1.25" style={{ background: "var(--border-2)" }} />
                      <div className="flex flex-col">
                        <span className="text-[12.5px]" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{ev.label}</span>
                        <small className="font-mono text-[10px] mt-0.5 tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{ev.sub}</small>
                      </div>
                      <span className="font-mono text-[10.5px] tracking-[0.04em] whitespace-nowrap" style={{ color: "var(--fg-3)" }}>{ev.ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Motion tokens */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex justify-between items-center px-4 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <span>03 · Motion tokens</span>
                <span>shared.css</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {TOKENS.map((t) => (
                  <div key={t.k} className="rounded-(--r-2) px-2.5 py-2.25" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--fg-3)" }}>{t.k}</div>
                    <div className="font-mono text-[11.5px]" style={{ color: "var(--ink)" }}>{t.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Principles */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="px-4 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>04 · Principles</div>
              <div className="p-4 text-[12.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                <p className="mb-2"><strong className="font-medium" style={{ color: "var(--ink)" }}>Spatial continuity.</strong> The viewfinder, the ring, the photo frame all share one center. The eye never has to reorient.</p>
                <p className="mb-2"><strong className="font-medium" style={{ color: "var(--ink)" }}>Earn the moment.</strong> This sequence happens; nothing else in Binectics animates this much. Familiarity makes it land.</p>
                <p><strong className="font-medium" style={{ color: "var(--ink)" }}>Respect reduced motion.</strong> All <code className="font-mono text-[11px]" style={{ color: "var(--ink)" }}>@media (prefers-reduced-motion)</code> collapses to a 200ms cross‑fade.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
